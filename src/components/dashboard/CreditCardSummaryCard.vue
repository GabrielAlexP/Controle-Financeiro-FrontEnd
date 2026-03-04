<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useCardStore } from "../../stores/card";
import { useFinanceStore } from "../../stores/finance";

const props = defineProps<{ selectedMonth: string }>();
const emit = defineEmits(["pay-bill"]);

const cardStore = useCardStore();
const financeStore = useFinanceStore();
const activeDashboardCardId = ref<number | null>(null);

watch(
  () => cardStore.cards,
  (newCards) => {
    if (newCards.length > 0 && !activeDashboardCardId.value) {
      activeDashboardCardId.value = newCards[0].id;
    }
  },
  { deep: true, immediate: true }
);

const activeDashboardCard = computed(() => {
  return cardStore.cards.find((c) => c.id === activeDashboardCardId.value) || null;
});

const dashboardCardBillAmount = computed(() => {
  if (!activeDashboardCard.value) return 0;
  return financeStore.transactions
    .filter(
      (tx) =>
        tx.creditCardId === activeDashboardCard.value!.id &&
        !tx.isPaid &&
        tx.transactionDate.substring(0, 7) === props.selectedMonth
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
});

const currentMonthFormatted = computed(() => {
  if (!props.selectedMonth) return "";
  const [year, month] = props.selectedMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const formatted = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
};
</script>

<template>
  <div class="cards-area glass-card">
    <div class="section-header">
      <h3>Cartões de Crédito</h3>
      <router-link to="/cartoes" class="link-view-all">Ver detalhes</router-link>
    </div>

    <template v-if="cardStore.cards.length > 0">
      <div class="card-tabs">
        <button
          v-for="card in cardStore.cards"
          :key="card.id"
          class="card-tab-btn"
          :class="{ active: activeDashboardCardId === card.id }"
          @click="activeDashboardCardId = card.id"
        >
          💳 {{ card.name }}
        </button>
      </div>

      <div class="card-summary" v-if="activeDashboardCard">
        <div class="bill-info">
          <span
            >Fatura de
            <span style="text-transform: capitalize">{{
              currentMonthFormatted
            }}</span></span
          >
          <span class="bill-amount">{{ formatCurrency(dashboardCardBillAmount) }}</span>
        </div>
        <button
          class="btn-pay-bill"
          :disabled="dashboardCardBillAmount <= 0"
          @click="
            emit('pay-bill', {
              cardId: activeDashboardCard.id,
              amount: dashboardCardBillAmount,
            })
          "
        >
          💵 Pagar Fatura
        </button>
      </div>
    </template>

    <div v-else class="empty-message">Nenhum cartão cadastrado.</div>
  </div>
</template>

<style scoped>
.cards-area {
  padding: 1.8rem;
  display: flex;
  flex-direction: column;
  height: 100%;
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
.card-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.8rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--glass-border);
}
.card-tabs::-webkit-scrollbar {
  height: 4px;
}
.card-tabs::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 4px;
}
.card-tab-btn {
  padding: 0.6rem 1rem;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
  border-radius: 0.5rem;
  white-space: nowrap;
  transition: all 0.2s;
}
.card-tab-btn:hover {
  background: var(--input-bg);
  color: var(--text-color);
}
.card-tab-btn.active {
  background: var(--glass-bg);
  color: var(--text-color);
  border-color: var(--glass-border);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.bill-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1.2rem;
  background: var(--input-bg);
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
}
.bill-info span:first-child {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
}
.bill-amount {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-color);
}
.btn-pay-bill {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 0.8rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: auto;
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
