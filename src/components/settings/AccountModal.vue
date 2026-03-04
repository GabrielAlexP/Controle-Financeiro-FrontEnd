<script setup lang="ts">
import { ref, watch } from "vue";
import { useAccountStore } from "../../stores/account";

const props = defineProps<{ isOpen: boolean; account: any }>();
const emit = defineEmits(["close"]);

const accountStore = useAccountStore();
const form = ref({ id: null as number | null, name: "", balance: 0 });
const balanceDisplay = ref("");
const errorMsg = ref("");
const loading = ref(false);

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      errorMsg.value = "";
      if (props.account) {
        form.value = {
          id: props.account.id,
          name: props.account.name,
          balance: props.account.balance,
        };
        balanceDisplay.value = new Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(props.account.balance);
      } else {
        form.value = { id: null, name: "", balance: 0 };
        balanceDisplay.value = "";
      }
    }
  }
);

const onBalanceInput = (e: Event) => {
  const el = e.target as HTMLInputElement;
  let val = el.value.replace(/\D/g, ""); // Remove tudo que não for número
  if (!val) {
    balanceDisplay.value = "";
    form.value.balance = 0;
    return;
  }
  const num = parseInt(val, 10) / 100; // Converte para decimal
  form.value.balance = num;
  balanceDisplay.value = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const handleSubmit = async () => {
  errorMsg.value = "";
  loading.value = true;
  try {
    if (form.value.id) {
      await accountStore.updateAccount(form.value.id, {
        name: form.value.name,
        balance: form.value.balance,
      });
    } else {
      await accountStore.createAccount({
        name: form.value.name,
        balance: form.value.balance,
      });
    }
    emit("close");
  } catch (error: any) {
    if (error.response && error.response.data) {
      errorMsg.value =
        error.response.data.error ||
        (Object.values(error.response.data)[0] as string) ||
        "Erro ao salvar.";
    } else {
      errorMsg.value = "Erro de conexão.";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content glass-card animate-fade">
      <h2>{{ form.id ? "Editar Conta" : "Nova Conta" }}</h2>

      <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="input-group">
          <label>Nome da Conta</label>
          <input
            type="text"
            v-model="form.name"
            required
            class="styled-input"
            placeholder="Ex: Nubank, Carteira..."
            :disabled="loading"
          />
        </div>

        <div class="input-group">
          <label>Saldo Inicial (R$)</label>
          <input
            type="text"
            inputmode="numeric"
            :value="balanceDisplay"
            @input="onBalanceInput"
            required
            class="styled-input"
            placeholder="Ex: 1.500,00"
            :disabled="loading"
          />
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="btn-outline"
            @click="emit('close')"
            :disabled="loading"
          >
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="loading || !form.name">
            {{ loading ? "Salvando..." : "Salvar" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-content {
  background: var(--glass-bg);
  padding: 2rem;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--glass-border);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}
.modal-content h2 {
  margin-bottom: 1.5rem;
  color: var(--text-color);
  font-size: 1.5rem;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}
.styled-input {
  padding: 0.8rem 1rem;
  border: 1px solid var(--glass-border);
  background: var(--input-bg);
  color: var(--text-color);
  border-radius: 0.75rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}
.styled-input:focus {
  border-color: #8b5cf6;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
.btn-primary {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  background: var(--primary-gradient);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-outline {
  padding: 0.8rem 1.5rem;
  border: 1px solid var(--glass-border);
  background: transparent;
  color: var(--text-color);
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover:not(:disabled) {
  background: var(--input-bg);
}
.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.alert-error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 1rem;
  text-align: center;
}
.animate-fade {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
