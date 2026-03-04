<script setup lang="ts">
defineProps<{
  category: any;
}>();

const emit = defineEmits(["edit", "delete"]);
</script>

<template>
  <div class="crud-item category-card">
    <div class="cat-color-strip" :style="{ backgroundColor: category.colorHex }"></div>
    <div class="cat-content">
      <div class="cat-header">
        <div class="cat-title-wrap">
          <span class="cat-icon">{{ category.icon }}</span>
          <h3>{{ category.name }}</h3>
        </div>
        <span class="type-badge" :class="category.type.toLowerCase()">
          {{ category.type === "INCOME" ? "Receita" : "Despesa" }}
        </span>
      </div>
      <div class="item-actions">
        <button class="action-btn edit" @click="emit('edit', category)">Editar</button>
        <button class="action-btn delete" @click="emit('delete', category.id)">
          Excluir
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crud-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--input-bg);
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
  transition: transform 0.2s;
}

.category-card {
  padding: 0;
  overflow: hidden;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
}

.category-card:hover {
  transform: translateY(-5px);
  border-color: rgba(139, 92, 246, 0.3);
}

.cat-color-strip {
  height: 6px;
  width: 100%;
}

.cat-content {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cat-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cat-icon {
  font-size: 1.2rem;
}

.cat-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color);
}

.type-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.3rem 0.6rem;
  border-radius: 1rem;
}

.type-badge.income {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.type-badge.expense {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
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
