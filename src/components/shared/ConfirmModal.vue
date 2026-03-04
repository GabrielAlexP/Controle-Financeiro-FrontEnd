<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "primary" | "danger" | "success";
  isLoading?: boolean;
}>();

const emit = defineEmits(["confirm", "cancel"]);
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-content glass-card animate-fade">
      <div class="modal-header">
        <span class="modal-icon" :class="type || 'primary'">
          {{ type === "danger" ? "⚠️" : type === "success" ? "✅" : "❓" }}
        </span>
        <h2>{{ title }}</h2>
      </div>

      <div class="modal-body">
        <p>{{ message }}</p>
      </div>

      <div class="modal-actions">
        <button
          type="button"
          class="btn-outline"
          @click="emit('cancel')"
          :disabled="isLoading"
        >
          {{ cancelText || "Cancelar" }}
        </button>
        <button
          type="button"
          class="btn-confirm"
          :class="type || 'primary'"
          @click="emit('confirm')"
          :disabled="isLoading"
        >
          {{ isLoading ? "Processando..." : confirmText || "Confirmar" }}
        </button>
      </div>
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: var(--glass-bg);
  padding: 2rem;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--glass-border);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 1rem;
}

.modal-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--input-bg);
}

.modal-icon.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.modal-icon.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.modal-icon.primary {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.modal-header h2 {
  color: var(--text-color);
  font-size: 1.4rem;
  font-weight: 800;
}

.modal-body p {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 2rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  width: 100%;
}

.modal-actions button {
  flex: 1;
  padding: 0.8rem;
  border-radius: 0.8rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--text-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--input-bg);
  border-color: var(--text-muted);
}

.btn-confirm {
  border: none;
  color: white;
}

.btn-confirm.primary {
  background: var(--primary-gradient);
}

.btn-confirm.primary:hover:not(:disabled) {
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
}

.btn-confirm.danger {
  background: #ef4444;
}

.btn-confirm.danger:hover:not(:disabled) {
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

.btn-confirm.success {
  background: #10b981;
}

.btn-confirm.success:hover:not(:disabled) {
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.animate-fade {
  animation: fadeInScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
