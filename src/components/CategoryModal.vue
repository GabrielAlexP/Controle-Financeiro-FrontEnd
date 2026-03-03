<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCategoryStore } from '../stores/category'

const props = defineProps<{ isOpen: boolean; category: any }>()
const emit = defineEmits(['close'])

const categoryStore = useCategoryStore()
const form = ref({ id: null as number | null, name: '', type: 'EXPENSE', icon: '📌', colorHex: '#8B5CF6' })
const errorMsg = ref('')
const loading = ref(false)

const emojis = ['💰', '🏠', '🍔', '🚗', '🎮', '📱', '🛒', '🏥', '📚', '✈️', '👗', '🐶', '📌', '⚡', '💧']
const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#64748B', '#1F2937']

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    errorMsg.value = ''
    if (props.category) {
      form.value = { 
        id: props.category.id, 
        name: props.category.name, 
        type: props.category.type, 
        icon: props.category.icon || '📌', 
        colorHex: props.category.colorHex || '#8B5CF6' 
      }
    } else {
      form.value = { id: null, name: '', type: 'EXPENSE', icon: '📌', colorHex: '#8B5CF6' }
    }
  }
})

const handleSubmit = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    if (form.value.id) {
      await categoryStore.updateCategory(form.value.id, form.value)
    } else {
      await categoryStore.createCategory(form.value)
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
      <h2>{{ form.id ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
      
      <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="input-group">
          <label>Nome da Categoria</label>
          <input type="text" v-model="form.name" required class="styled-input" placeholder="Ex: Lazer, Alimentação..." :disabled="loading" />
        </div>
        
        <div class="input-group">
          <label>Tipo</label>
          <select v-model="form.type" class="styled-input" :disabled="loading">
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
          </select>
        </div>

        <div class="input-group">
          <label>Ícone</label>
          <div class="emoji-grid">
            <button 
              type="button" 
              v-for="emoji in emojis" 
              :key="emoji" 
              class="emoji-btn" 
              :class="{ active: form.icon === emoji }"
              @click="form.icon = emoji"
              :disabled="loading"
            >
              {{ emoji }}
            </button>
          </div>
        </div>

        <div class="input-group">
          <label>Cor</label>
          <div class="color-grid">
            <button 
              type="button" 
              v-for="color in colors" 
              :key="color" 
              class="color-picker-btn" 
              :class="{ active: form.colorHex === color }"
              :style="{ backgroundColor: color }"
              @click="form.colorHex = color"
              :disabled="loading"
            ></button>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-outline" @click="emit('close')" :disabled="loading">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Salvando...' : 'Salvar' }}</button>
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
.input-group { display: flex; flex-direction: column; gap: 0.5rem; }
.input-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-color); }
.styled-input { padding: 0.8rem 1rem; border: 1px solid var(--glass-border); background: var(--input-bg); color: var(--text-color); border-radius: 0.75rem; font-size: 1rem; outline: none; transition: border-color 0.2s; }
.styled-input:focus { border-color: #8B5CF6; }
.emoji-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.emoji-btn { font-size: 1.5rem; background: var(--input-bg); border: 1px solid var(--glass-border); border-radius: 0.5rem; padding: 0.5rem; cursor: pointer; transition: all 0.2s; }
.emoji-btn:hover:not(:disabled) { background: var(--glass-bg); transform: scale(1.1); }
.emoji-btn.active { border-color: #8B5CF6; background: rgba(139, 92, 246, 0.2); }
.color-grid { display: flex; flex-wrap: wrap; gap: 0.8rem; }
.color-picker-btn { width: 35px; height: 35px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.2s; }
.color-picker-btn:hover:not(:disabled) { transform: scale(1.1); }
.color-picker-btn.active { border-color: var(--text-color); transform: scale(1.1); box-shadow: 0 0 10px rgba(0,0,0,0.2); }
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