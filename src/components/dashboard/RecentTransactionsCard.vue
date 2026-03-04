<script setup lang="ts">
import { useFinanceStore } from "../../stores/finance";

defineProps<{ transactions: any[] }>();

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
  <div class="recent-transactions glass-card">
    <div class="section-header">
      <h3>Transações</h3>
      <router-link to="/transacoes" class="link-view-all">Ver todas</router-link>
    </div>

    <div class="transaction-list">
      <div class="transaction-item" v-for="tx in transactions" :key="tx.id">
        <div class="tx-icon">{{ getCategoryIcon(tx.categoryId) }}</div>
        <div class="tx-details">
          <p class="tx-desc">
            {{ tx.description || tx.categoryName }}
            <small v-if="tx.installmentTotal" style="color: var(--text-muted)"
              >({{ tx.installmentCurrent }}/{{ tx.installmentTotal }})</small
            >
          </p>
          <p class="tx-date-cat">
            {{ tx.accountName }}
            <span v-if="tx.creditCardName">• {{ tx.creditCardName }}</span> •
            {{ formatDate(tx.transactionDate) }}
          </p>
        </div>
        <div class="tx-amount" :class="tx.type.toLowerCase()">
          <span v-if="!tx.isPaid" class="pending-badge">Pendente</span>
          {{ tx.type === "INCOME" ? "+" : "-" }} {{ formatCurrency(tx.amount) }}
        </div>
      </div>

      <div v-if="transactions.length === 0" class="empty-message">
        Sem transações registradas.
      </div>
    </div>
  </div>
</template>

<style scoped>
.recent-transactions {
  padding: 1.8rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.section-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
}
.link-view-all {
  color: #8b5cf6;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}
.link-view-all:hover {
  text-decoration: underline;
}
.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}
.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--input-bg);
  border: 1px solid transparent;
  transition: all 0.2s;
}
.transaction-item:hover {
  border-color: var(--glass-border);
  transform: translateX(5px);
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
}
.tx-desc {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.2rem;
}
.tx-date-cat {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.tx-amount {
  font-weight: 700;
  font-size: 1.1rem;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.tx-amount.income {
  color: #10b981;
}
.tx-amount.expense {
  color: #ef4444;
}
.pending-badge {
  font-size: 0.65rem;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  padding: 0.2rem 0.4rem;
  border-radius: 0.5rem;
  margin-bottom: 0.2rem;
}
.empty-message {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-weight: 500;
  background: var(--input-bg);
  border-radius: 1rem;
  border: 1px dashed var(--glass-border);
  margin: auto 0;
}
</style>
