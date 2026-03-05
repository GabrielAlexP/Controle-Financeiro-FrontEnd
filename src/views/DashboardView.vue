<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFinanceStore } from "../stores/finance";
import { useCardStore } from "../stores/card";
import { useAuthStore } from "../stores/auth";
import api from "../services/api";

import ConfirmModal from "../components/shared/ConfirmModal.vue";
import OnboardingWizard from "../components/shared/OnboardingWizard.vue";
import ExpenseChartCard from "../components/dashboard/ExpenseChartCard.vue";
import RecentTransactionsCard from "../components/dashboard/RecentTransactionsCard.vue";
import CreditCardSummaryCard from "../components/dashboard/CreditCardSummaryCard.vue";
import PendingTransactionsCard from "../components/shared/PendingTransactionsCard.vue";
import GoalsListCard from "../components/shared/GoalsListCard.vue";
import IndicatorsCard from "../components/dashboard/IndicatorsCard.vue";

const financeStore = useFinanceStore();
const cardStore = useCardStore();
const authStore = useAuthStore();

const activeAccountId = ref<number | "geral">("geral");

const selectedMonth = ref(
  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
);

const confirmModal = ref({
  isOpen: false,
  title: "",
  message: "",
  type: "primary" as "primary" | "danger" | "success",
  isLoading: false,
  action: async () => { },
});

onMounted(async () => {
  await financeStore.fetchAllData();
});

const activeAccountName = computed(() => {
  if (activeAccountId.value === "geral") return "Todas as Contas";
  const account = financeStore.accounts.find((a) => a.id === activeAccountId.value);
  return account ? account.name : "Sua Conta";
});

const dashboardData = computed(() => {
  let inc = 0,
    exp = 0;

  financeStore.transactions.forEach((tx) => {
    const txMonth = tx.transactionDate ? tx.transactionDate.substring(0, 7) : "";

    if (tx.isPaid && txMonth === selectedMonth.value) {
      if (activeAccountId.value === "geral" || tx.accountId === activeAccountId.value) {
        if (tx.type === "INCOME") inc += tx.amount;
        if (tx.type === "EXPENSE") exp += tx.amount;
      }
    }
  });

  const bal =
    activeAccountId.value === "geral"
      ? financeStore.totalBalance
      : financeStore.accounts.find((a) => a.id === activeAccountId.value)?.balance || 0;

  return {
    balance: bal,
    income: inc,
    expense: exp,
    netIncome: inc - exp,
  };
});

const expensesByCategory = computed(() => {
  const categoryTotals: Record<number, number> = {};
  let totalExpense = 0;

  financeStore.transactions.forEach((tx) => {
    const txMonth = tx.transactionDate ? tx.transactionDate.substring(0, 7) : "";

    if (tx.type === "EXPENSE" && tx.isPaid && txMonth === selectedMonth.value) {
      if (activeAccountId.value === "geral" || tx.accountId === activeAccountId.value) {
        categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
        totalExpense += tx.amount;
      }
    }
  });

  return Object.keys(categoryTotals)
    .map((catIdStr) => {
      const catId = Number(catIdStr);
      const cat = financeStore.categories.find((c) => c.id === catId);
      const amount = categoryTotals[catId] || 0;

      return {
        id: catId,
        name: cat ? cat.name : "Outros",
        amount: amount,
        color: cat ? cat.colorHex : "#ccc",
        percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
});

const recentTransactions = computed(() => {
  return financeStore.transactions
    .filter((tx) => {
      const txMonth = tx.transactionDate ? tx.transactionDate.substring(0, 7) : "";
      const isAccMatch =
        activeAccountId.value === "geral" || tx.accountId === activeAccountId.value;
      return isAccMatch && txMonth === selectedMonth.value;
    })
    .slice(0, 5);
});

const pendingTransactions = computed(() => {
  return financeStore.transactions.filter((tx) => {
    const txMonth = tx.transactionDate ? tx.transactionDate.substring(0, 7) : "";
    const isAccMatch =
      activeAccountId.value === "geral" || tx.accountId === activeAccountId.value;
    return (
      isAccMatch &&
      txMonth === selectedMonth.value &&
      !tx.isPaid &&
      tx.creditCardId === null
    );
  });
});

const openConfirmModal = (
  title: string,
  message: string,
  type: "primary" | "danger" | "success",
  action: () => Promise<void>
) => {
  confirmModal.value.title = title;
  confirmModal.value.message = message;
  confirmModal.value.type = type;
  confirmModal.value.action = action;
  confirmModal.value.isOpen = true;
};

const executeConfirmAction = async () => {
  confirmModal.value.isLoading = true;
  try {
    await confirmModal.value.action();
    await financeStore.fetchAllData();
    confirmModal.value.isOpen = false;
  } catch (error: any) {
    alert(error.response?.data?.error || "Erro ao processar a ação.");
  } finally {
    confirmModal.value.isLoading = false;
  }
};

const handlePayCardBill = (payload: { cardId: number; amount: number }) => {
  openConfirmModal(
    "Pagar Fatura?",
    `Deseja pagar a fatura no valor de ${formatCurrency(
      payload.amount
    )}? O valor será descontado do saldo da conta bancária vinculada.`,
    "success",
    async () => {
      await cardStore.payBill(payload.cardId, selectedMonth.value);
    }
  );
};

const handlePendingAction = (tx: any) => {
  openConfirmModal(
    "Confirmar Pagamento?",
    "Deseja confirmar este pagamento? O valor será descontado do saldo da conta vinculada.",
    "success",
    async () => {
      await api.put(`/transacoes/${tx.id}/pagar`);
    }
  );
};

const currentMonthFormatted = computed(() => {
  if (!selectedMonth.value) return "";
  const [year, month] = selectedMonth.value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
};
</script>

<template>
  <main class="view-root">
    <OnboardingWizard v-if="authStore.user && !authStore.user.isOnboarded" />

    <div class="dashboard-container" v-else-if="!financeStore.isLoading">
      <div class="page-header">
        <div>
          <h1 class="page-title">Visão Geral</h1>
          <p class="subtitle">
            Resumo financeiro de
            <strong style="text-transform: capitalize">{{ currentMonthFormatted }}</strong>
            <span v-if="activeAccountId !== 'geral'">em <strong>{{ activeAccountName }}</strong></span>
          </p>
        </div>
        <div class="header-actions">
          <input type="month" v-model="selectedMonth" class="month-picker glass-card" />
          <button class="btn-outline" @click="financeStore.fetchAllData()">
            🔄 Atualizar
          </button>
        </div>
      </div>

      <div class="account-tabs">
        <button class="tab-btn" :class="{ active: activeAccountId === 'geral' }" @click="activeAccountId = 'geral'">
          📊 Todas as Contas
        </button>
        <button v-for="account in financeStore.accounts" :key="account.id" class="tab-btn"
          :class="{ active: activeAccountId === account.id }" @click="activeAccountId = account.id">
          🏦 {{ account.name }}
        </button>
      </div>

      <Transition name="view-fade" mode="out-in">
        <div :key="activeAccountId + selectedMonth.toString()" class="animated-wrapper">
          <div class="summary-cards">
            <div class="card glass-card balance-card">
              <div class="card-icon">🏦</div>
              <div class="card-info">
                <h3>Saldo Atual</h3>
                <p class="amount">{{ formatCurrency(dashboardData.balance) }}</p>
              </div>
            </div>
            <div class="card glass-card income-card">
              <div class="card-icon green">📈</div>
              <div class="card-info">
                <h3>Receitas</h3>
                <p class="amount positive">+ {{ formatCurrency(dashboardData.income) }}</p>
              </div>
            </div>
            <div class="card glass-card expense-card">
              <div class="card-icon red">📉</div>
              <div class="card-info">
                <h3>Despesas</h3>
                <p class="amount negative">- {{ formatCurrency(dashboardData.expense) }}</p>
              </div>
            </div>
            <div class="card glass-card net-income-card">
              <div class="card-icon" :class="dashboardData.netIncome >= 0 ? 'green' : 'red'">
                ⚖️
              </div>
              <div class="card-info">
                <h3>Sobra</h3>
                <p class="amount" :class="dashboardData.netIncome >= 0 ? 'positive' : 'negative'">
                  {{ dashboardData.netIncome >= 0 ? "+" : "" }}
                  {{ formatCurrency(dashboardData.netIncome) }}
                </p>
              </div>
            </div>
          </div>

          <div class="dashboard-grid main-grid">
            <ExpenseChartCard :expenses="expensesByCategory" :total-expense="dashboardData.expense" />
            <RecentTransactionsCard :transactions="recentTransactions" />
          </div>

          <div class="dashboard-grid middle-grid">
            <CreditCardSummaryCard :selected-month="selectedMonth" @pay-bill="handlePayCardBill" />
            <PendingTransactionsCard title="Transações Pendentes" :transactions="pendingTransactions"
              empty-message="Tudo em dia! Nenhuma pendência." action-icon="✅" action-title="Marcar como Pago"
              layout="column" @action="handlePendingAction" />
          </div>

          <div class="dashboard-grid secondary-grid">
            <GoalsListCard :goals="financeStore.goals" :show-actions="false" />
            <IndicatorsCard :selic="financeStore.indicators.SELIC" :cdi="financeStore.indicators.CDI" />
          </div>
        </div>
      </Transition>

      <ConfirmModal :is-open="confirmModal.isOpen" :title="confirmModal.title" :message="confirmModal.message"
        :type="confirmModal.type" :is-loading="confirmModal.isLoading" @confirm="executeConfirmAction"
        @cancel="confirmModal.isOpen = false" />
    </div>

    <div v-else class="loading-state">
      <div class="spinner"></div>
      <h2>Carregando...</h2>
    </div>
  </main>
</template>

<style scoped>
.view-root {
  width: 100%;
  height: 100%;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2rem;
}

.animated-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}

.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateY(15px) scale(0.98);
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.98);
}

.loading-state {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-color);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--glass-border);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-color);
  letter-spacing: -0.5px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1rem;
  margin-top: 0.2rem;
}

.subtitle strong {
  color: var(--text-color);
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.month-picker {
  padding: 0.6rem 1rem;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-color);
  border-radius: 0.8rem;
  font-weight: 600;
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
  text-transform: capitalize;
}

.month-picker:focus {
  border-color: #8b5cf6;
}

.month-picker::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(0.5);
}

.btn-outline {
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-color);
  border-radius: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: var(--input-bg);
  border-color: #8b5cf6;
}

.account-tabs {
  display: flex;
  gap: 0.8rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.account-tabs::-webkit-scrollbar {
  height: 4px;
}

.account-tabs::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 2rem;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab-btn:hover {
  background: var(--input-bg);
  color: var(--text-color);
}

.tab-btn.active {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.card {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.card-icon {
  width: 55px;
  height: 55px;
  border-radius: 1.2rem;
  background: rgba(139, 92, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.card-icon.green {
  background: rgba(16, 185, 129, 0.1);
}

.card-icon.red {
  background: rgba(239, 68, 68, 0.1);
}

.card-info h3 {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.3rem;
}

.amount {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-color);
  white-space: nowrap;
}

.amount.positive {
  color: #10b981;
}

.amount.negative {
  color: #ef4444;
}

.dashboard-grid {
  display: grid;
  gap: 1.5rem;
}

.main-grid,
.middle-grid {
  grid-template-columns: 1fr 1fr;
}

.secondary-grid {
  grid-template-columns: 2fr 1fr;
}

@media (max-width: 1024px) {

  .main-grid,
  .middle-grid,
  .secondary-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>