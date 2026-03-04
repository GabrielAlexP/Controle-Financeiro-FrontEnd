<script setup lang="ts">
defineProps<{
  activeCard: any;
  currentMonthName: string;
  currentBillAmount: number;
  availableLimit: number;
  limitPercent: number;
}>();

const emit = defineEmits(["edit", "delete", "pay"]);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
};
</script>

<template>
  <div class="right-column">
    <div class="details-card glass-card">
      <div class="details-header">
        <div>
          <h2>Fatura Atual</h2>
          <p class="card-title-name">{{ activeCard.name }}</p>
        </div>
        <div class="header-actions">
          <span class="status-badge" :class="limitPercent > 80 ? 'danger' : 'safe'">
            {{ limitPercent > 80 ? "Atenção ao Limite" : "Limite Saudável" }}
          </span>
          <button class="btn-edit" @click="emit('edit')" title="Editar Cartão">✏️</button>
          <button class="btn-delete" @click="emit('delete')" title="Excluir Cartão">
            🗑️
          </button>
        </div>
      </div>

      <div class="amounts-display">
        <div class="amount-box">
          <span class="label"
            >Fatura de
            <span style="text-transform: capitalize">{{ currentMonthName }}</span></span
          >
          <span class="value used">{{ formatCurrency(currentBillAmount) }}</span>
        </div>
        <div class="amount-box right">
          <span class="label">Limite Disponível</span>
          <span class="value available">{{ formatCurrency(availableLimit) }}</span>
        </div>
      </div>

      <div class="limit-bar-container">
        <div class="limit-track">
          <div
            class="limit-fill"
            :style="{
              width: limitPercent + '%',
              backgroundColor: limitPercent > 80 ? '#EF4444' : activeCard.color1Hex,
            }"
          ></div>
        </div>
        <div class="limit-labels">
          <span>{{ limitPercent.toFixed(1) }}% de uso</span>
          <span>{{ formatCurrency(activeCard.limitAmount) }} (Total)</span>
        </div>
      </div>

      <div class="dates-grid">
        <div class="date-box">
          <span class="icon">📅</span>
          <div class="date-info">
            <span class="label">Fechamento</span>
            <span class="value">Dia {{ activeCard.closingDay }}</span>
          </div>
        </div>
        <div class="date-box">
          <span class="icon">🚨</span>
          <div class="date-info">
            <span class="label">Vencimento</span>
            <span class="value">Dia {{ activeCard.dueDay }}</span>
          </div>
        </div>
      </div>

      <button
        class="btn-pay-bill"
        :disabled="currentBillAmount <= 0"
        @click="emit('pay')"
      >
        💵 Pagar Fatura ({{ formatCurrency(currentBillAmount) }})
      </button>
    </div>
  </div>
</template>

<style scoped>
.right-column {
  display: flex;
  flex-direction: column;
}

.details-card {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  flex: 1;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.details-header h2 {
  font-size: 1.5rem;
  color: var(--text-color);
}

.card-title-name {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 0.3rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.safe {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.btn-edit {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #3b82f6;
  color: white;
  transform: scale(1.1);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.1);
}

.amounts-display {
  display: flex;
  justify-content: space-between;
}

.amount-box {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.amount-box.right {
  text-align: right;
}

.amount-box .label {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 500;
}

.amount-box .value {
  font-size: 2rem;
  font-weight: 800;
}

.value.used {
  color: var(--text-color);
}

.value.available {
  color: #10b981;
}

.limit-bar-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.limit-track {
  width: 100%;
  height: 12px;
  background: var(--input-bg);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
}

.limit-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 1s ease-out, background-color 0.3s;
}

.limit-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 600;
}

.dates-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: auto;
}

.date-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--input-bg);
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
}

.date-box .icon {
  font-size: 1.5rem;
}

.date-info {
  display: flex;
  flex-direction: column;
}

.date-info .label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.date-info .value {
  font-size: 1.1rem;
  color: var(--text-color);
  font-weight: 700;
}

.btn-pay-bill {
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  border: none;
  border-radius: 1rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-pay-bill:hover:not(:disabled) {
  background: #10b981;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.btn-pay-bill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--glass-bg);
  color: var(--text-muted);
}
</style>
