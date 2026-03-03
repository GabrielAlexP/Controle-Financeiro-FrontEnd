<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCardStore } from '../stores/card'
import { useAccountStore } from '../stores/account'

const props = defineProps<{ isOpen: boolean; card?: any }>()
const emit = defineEmits(['close'])

const cardStore = useCardStore()
const accountStore = useAccountStore()

const form = ref({
  id: null as number | null,
  accountId: null as number | null,
  name: '',
  limitAmount: 0,
  closingDay: 1,
  dueDay: 5,
  color1Hex: '#8B5CF6',
  color2Hex: '#4C1D95'
})

const errorMsg = ref('')
const loading = ref(false)

const gradientPresets = [
  { c1: '#8B5CF6', c2: '#4C1D95' },
  { c1: '#EF4444', c2: '#991B1B' },
  { c1: '#F59E0B', c2: '#B45309' },
  { c1: '#10B981', c2: '#047857' },
  { c1: '#3B82F6', c2: '#1D4ED8' },
  { c1: '#1F2937', c2: '#0F172A' },
]

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    errorMsg.value = ''
    if (props.card) {
      form.value = {
        id: props.card.id,
        accountId: props.card.accountId,
        name: props.card.name,
        limitAmount: props.card.limitAmount,
        closingDay: props.card.closingDay,
        dueDay: props.card.dueDay,
        color1Hex: props.card.color1Hex,
        color2Hex: props.card.color2Hex
      }
    } else {
      form.value = {
        id: null,
        accountId: accountStore.accounts.length > 0 ? accountStore.accounts[0].id : null,
        name: '',
        limitAmount: 0,
        closingDay: 1,
        dueDay: 5,
        color1Hex: '#8B5CF6',
        color2Hex: '#4C1D95'
      }
    }
  }
})

const selectColor = (c1: string, c2: string) => {
  form.value.color1Hex = c1
  form.value.color2Hex = c2
}

const handleSubmit = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    if (form.value.id) {
      await cardStore.updateCard(form.value.id, form.value)
    } else {
      await cardStore.createCard(form.value)
    }
    emit('close')
  } catch (error: any) {
    if (error.response && error.response.data) {
      errorMsg.value = error.response.data.error || Object.values(error.response.data)[0] as string || 'Erro ao salvar.'
    } else {
      errorMsg.value = 'Erro de conexão.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content glass-card animate-fade">
      <h2>{{ form.id ? 'Editar Cartão' : 'Novo Cartão' }}</h2>
      
      <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="input-group">
          <label>Conta Bancária Vinculada</label>
          <select v-model="form.accountId" required class="styled-input" :disabled="loading">
            <option v-for="acc in accountStore.accounts" :key="acc.id" :value="acc.id">
              {{ acc.name }}
            </option>
          </select>
        </div>

        <div class="input-group">
          <label>Nome do Cartão</label>
          <input type="text" v-model="form.name" required class="styled-input" placeholder="Ex: Nubank, Itaú Click..." :disabled="loading" />
        </div>

        <div class="input-group">
          <label>Limite (R$)</label>
          <input type="number" step="0.01" v-model="form.limitAmount" required class="styled-input" :disabled="loading" />
        </div>

        <div class="grid-2-cols">
          <div class="input-group">
            <label>Dia de Fechamento</label>
            <input type="number" min="1" max="31" v-model="form.closingDay" required class="styled-input" :disabled="loading" />
          </div>
          <div class="input-group">
            <label>Dia de Vencimento</label>
            <input type="number" min="1" max="31" v-model="form.dueDay" required class="styled-input" :disabled="loading" />
          </div>
        </div>

        <div class="input-group">
          <label>Cor do Cartão</label>
          <div class="color-options">
            <button 
              type="button"
              v-for="(preset, index) in gradientPresets" 
              :key="index"
              class="color-btn"
              :class="{ active: form.color1Hex === preset.c1 }"
              :style="{ background: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})` }"
              @click="selectColor(preset.c1, preset.c2)"
              :disabled="loading"
            ></button>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-outline" @click="emit('close')" :disabled="loading">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="loading || !form.accountId">
            {{ loading ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 1rem; }
.modal-content { background: var(--glass-bg); padding: 2rem; border-radius: 1.5rem; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; border: 1px solid var(--glass-border); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); }
.modal-content h2 { margin-bottom: 1.5rem; color: var(--text-color); font-size: 1.5rem; }
.modal-form { display: flex; flex-direction: column; gap: 1.2rem; }
.grid-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.input-group { display: flex; flex-direction: column; gap: 0.5rem; }
.input-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-color); }
.styled-input { padding: 0.8rem 1rem; border: 1px solid var(--glass-border); background: var(--input-bg); color: var(--text-color); border-radius: 0.75rem; font-size: 1rem; outline: none; transition: border-color 0.2s; }
.styled-input:focus { border-color: #8B5CF6; }
.color-options { display: flex; gap: 0.8rem; flex-wrap: wrap; padding: 0.5rem 0; }
.color-btn { width: 35px; height: 35px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.2s; }
.color-btn:hover:not(:disabled) { transform: scale(1.15); border-color: white; }
.color-btn.active { transform: scale(1.15); border-color: var(--text-color); box-shadow: 0 0 10px rgba(0,0,0,0.2); }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
.btn-primary { padding: 0.8rem 1.5rem; border: none; border-radius: 0.75rem; background: var(--primary-gradient); color: white; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { padding: 0.8rem 1.5rem; border: 1px solid var(--glass-border); background: transparent; color: var(--text-color); border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover:not(:disabled) { background: var(--input-bg); }
.btn-outline:disabled { opacity: 0.6; cursor: not-allowed; }
.alert-error { background-color: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.8rem; border-radius: 0.5rem; font-size: 0.9rem; font-weight: 500; margin-bottom: 1rem; text-align: center; }
.animate-fade { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>