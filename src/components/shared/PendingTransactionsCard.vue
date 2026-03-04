<script setup lang="ts">
import { useFinanceStore } from "../../stores/finance";

withDefaults(
  defineProps<{
    title?: string;
    transactions: any[];
    emptyMessage?: string;
    actionIcon?: string;
    actionTitle?: string;
    layout?: "column" | "grid";
  }>(),
  {
    title: "Transações Pendentes",
    emptyMessage: "Tudo em dia! Nenhuma pendência.",
    actionIcon: "✅",
    actionTitle: "Realizar Ação",
    layout: "column",
  }
);

const emit = defineEmits(["action"]);
const financeStore = useFinanceStore();

const getCategoryIcon = (categoryId: number) => {
  const cat = financeStore.categories.find((c) => c.id === categoryId);
  return cat ? cat.icon : "📌";
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
};
</script>

<template>
  <div class="pending-area glass-card">
    <div class="section-header">
      <h3>{{ title }}</h3>
    </div>

    <div class="transaction-container" :class="layout">
      <div class="transaction-item" v-for="tx in transactions" :key="tx.id">
        <div class="tx-icon">{{ getCategoryIcon(tx.categoryId) }}</div>
        <div class="tx-details">
          <p class="tx-desc">
            {{ tx.description || tx.categoryName }}
            <span v-if="tx.installmentTotal" class="installment-badge"
              >{{ tx.installmentCurrent }}/{{ tx.installmentTotal }}</span
            >
          </p>
          <p class="tx-date-cat">
            <span v-if="tx.accountName">{{ tx.accountName }} •</span> Vencimento:
            {{ formatDate(tx.transactionDate) }}
          </p>
        </div>
        <div class="tx-amount" :class="tx.type.toLowerCase()">
          {{ tx.type === "INCOME" ? "+" : "-" }} {{ formatCurrency(tx.amount) }}
        </div>
        <button @click="emit('action', tx)" class="action-btn check" :title="actionTitle">
          {{ actionIcon }}
        </button>
      </div>

      <div v-if="transactions.length === 0" class="empty-message">
        {{ emptyMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.pending-area {
  padding: 1.8rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.section-header {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
}
.empty-message {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-weight: 500;
  background: var(--input-bg);
  border-radius: 1rem;
  border: 1px dashed var(--glass-border);
  font-size: 1.05rem;
  margin: auto 0;
}

.transaction-container {
  display: flex;
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}
.transaction-container.column {
  flex-direction: column;
  max-height: 400px;
}
.transaction-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  max-height: 500px;
  overflow-x: hidden;
}

.transaction-container::-webkit-scrollbar {
  width: 6px;
}
.transaction-container::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 4px;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 1rem;
  background: var(--input-bg);
  border: 1px solid transparent;
  transition: all 0.2s;
}
.transaction-item:hover {
  border-color: var(--glass-border);
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.tx-icon {
  width: 45px;
  height: 45px;
  background: var(--glass-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.tx-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.tx-desc {
  font-weight: 700;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.05rem;
  line-height: 1.2;
}
.installment-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  background: var(--glass-bg);
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  font-weight: 600;
  white-space: nowrap;
}
.tx-date-cat {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.tx-amount {
  font-weight: 800;
  font-size: 1.2rem;
  white-space: nowrap;
  margin-right: 1rem;
}
.tx-amount.expense {
  color: #ef4444;
}
.tx-amount.income {
  color: #10b981;
}

.action-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  padding: 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.action-btn.check {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
  filter: grayscale(1);
}
.action-btn.check:hover {
  background: #10b981;
  border-color: #10b981;
  filter: grayscale(0);
  transform: scale(1.1);
}
</style>
