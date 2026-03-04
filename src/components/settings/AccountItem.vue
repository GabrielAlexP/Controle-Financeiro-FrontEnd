<script setup lang="ts">
defineProps<{
  account: any;
}>();

const emit = defineEmits(["edit", "delete"]);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
</script>

<template>
  <div class="crud-item">
    <div class="item-info">
      <div class="item-icon">🏦</div>
      <div>
        <h3>{{ account.name }}</h3>
        <p>Saldo: {{ formatCurrency(account.balance) }}</p>
      </div>
    </div>
    <div class="item-actions">
      <button class="action-btn edit" @click="emit('edit', account)">Editar</button>
      <button class="action-btn delete" @click="emit('delete', account.id)">
        Excluir
      </button>
    </div>
  </div>
</template>

<style scoped>
.crud-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  background: var(--input-bg);
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
  transition: transform 0.2s;
}

.crud-item:hover {
  transform: translateX(5px);
  border-color: rgba(139, 92, 246, 0.3);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-icon {
  font-size: 2rem;
  background: var(--glass-bg);
  padding: 0.5rem;
  border-radius: 0.8rem;
}

.item-info h3 {
  font-size: 1.1rem;
  color: var(--text-color);
  font-weight: 700;
}

.item-info p {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.edit {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.action-btn.edit:hover {
  background: #3b82f6;
  color: white;
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn.delete:hover {
  background: #ef4444;
  color: white;
}
</style>
