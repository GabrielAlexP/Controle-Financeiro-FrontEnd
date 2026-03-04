<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useCardStore } from "../stores/card";
import { useFinanceStore } from "../stores/finance";
import { useAccountStore } from "../stores/account";
import { useTransactionStore } from "../stores/transaction";

import CardModal from "../components/cards/CardModal.vue";
import ConfirmModal from "../components/shared/ConfirmModal.vue";
import VirtualCardSection from "../components/cards/VirtualCardSection.vue";
import CardInvoiceSummary from "../components/cards/CardInvoiceSummary.vue";
import PendingTransactionsCard from "../components/shared/PendingTransactionsCard.vue";

const cardStore = useCardStore();
const financeStore = useFinanceStore();
const accountStore = useAccountStore();
const transactionStore = useTransactionStore();

const isModalOpen = ref(false);
const activeCardId = ref<number | null>(null);
const cardToEdit = ref<any>(null);

const confirmModal = ref({
  isOpen: false,
  title: "",
  message: "",
  type: "primary" as "primary" | "danger" | "success",
  isLoading: false,
  action: async () => {},
});

onMounted(async () => {
  await cardStore.fetchCards();
  if (financeStore.transactions.length === 0) {
    await financeStore.fetchAllData();
  }
  if (accountStore.accounts.length === 0) {
    await accountStore.fetchAccounts();
  }
  if (cardStore.cards.length > 0) {
    activeCardId.value = cardStore.cards[0].id;
  }
});

watch(
  () => cardStore.cards,
  (newCards) => {
    if (
      newCards.length > 0 &&
      (!activeCardId.value || !newCards.find((c) => c.id === activeCardId.value))
    ) {
      activeCardId.value = newCards[0].id;
    } else if (newCards.length === 0) {
      activeCardId.value = null;
    }
  },
  { deep: true }
);

const activeCard = computed(() => {
  return cardStore.cards.find((c) => c.id === activeCardId.value) || null;
});

const getCurrentMonthString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const currentMonthStr = computed(() => getCurrentMonthString());

const currentMonthName = computed(() => {
  const date = new Date();
  const formatted = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
});

const totalUsedLimit = computed(() => {
  if (!activeCard.value) return 0;
  return financeStore.transactions
    .filter((tx) => tx.creditCardId === activeCard.value.id && !tx.isPaid)
    .reduce((sum, tx) => sum + tx.amount, 0);
});

const currentBillAmount = computed(() => {
  if (!activeCard.value) return 0;
  return financeStore.transactions
    .filter(
      (tx) =>
        tx.creditCardId === activeCard.value.id &&
        !tx.isPaid &&
        tx.transactionDate.substring(0, 7) === currentMonthStr.value
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
});

const availableLimit = computed(() => {
  if (!activeCard.value) return 0;
  return activeCard.value.limitAmount - totalUsedLimit.value;
});

const limitPercent = computed(() => {
  if (!activeCard.value || activeCard.value.limitAmount === 0) return 0;
  const percent = (totalUsedLimit.value / activeCard.value.limitAmount) * 100;
  return percent > 100 ? 100 : percent;
});

const pendingInstallments = computed(() => {
  if (!activeCard.value) return [];
  return financeStore.transactions
    .filter(
      (tx) =>
        tx.creditCardId === activeCard.value!.id && !tx.isPaid && tx.installmentTotal
    )
    .sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );
});

const openCreateModal = () => {
  cardToEdit.value = null;
  isModalOpen.value = true;
};

const openEditModal = () => {
  cardToEdit.value = activeCard.value;
  isModalOpen.value = true;
};

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

const confirmDelete = () => {
  if (!activeCard.value) return;
  openConfirmModal(
    "Excluir Cartão?",
    "Tem certeza que deseja excluir este cartão? O saldo da sua conta poderá ser recalculado e o histórico será afetado.",
    "danger",
    async () => {
      await cardStore.deleteCard(activeCard.value!.id);
    }
  );
};

const payCardBill = () => {
  if (!activeCard.value || currentBillAmount.value <= 0) return;
  openConfirmModal(
    "Pagar Fatura?",
    `Deseja pagar a fatura de ${currentMonthName.value} no valor de ${formatCurrency(
      currentBillAmount.value
    )}? O valor será descontado do saldo da conta bancária vinculada.`,
    "success",
    async () => {
      await cardStore.payBill(activeCard.value!.id, currentMonthStr.value);
    }
  );
};

const handleAnticipateClick = (tx: any) => {
  openConfirmModal(
    "Antecipar Parcela?",
    `Deseja antecipar a parcela ${tx.installmentCurrent}/${tx.installmentTotal} de "${
      tx.description || tx.categoryName
    }" para hoje? O valor de ${formatCurrency(
      tx.amount
    )} será descontado da conta bancária imediatamente.`,
    "success",
    async () => {
      await transactionStore.advanceTransaction(tx.id);
    }
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
};
</script>

<template>
  <div class="cards-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Meus Cartões</h1>
        <p class="subtitle">Gerencie limites e faturas</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">+ Novo Cartão</button>
    </div>

    <div v-if="cardStore.isLoading" class="loading-state">
      <div class="spinner"></div>
      <h2>Carregando cartões...</h2>
    </div>

    <div v-else-if="cardStore.cards.length === 0" class="empty-state glass-card">
      <div class="empty-icon">💳</div>
      <h2>Nenhum cartão cadastrado</h2>
      <p>
        Você ainda não possui cartões de crédito. Adicione um para começar a controlar
        suas faturas.
      </p>
      <button class="btn-primary mt-3" @click="openCreateModal">
        + Adicionar o primeiro
      </button>
    </div>

    <template v-else>
      <div class="cards-layout">
        <VirtualCardSection
          :cards="cardStore.cards"
          :active-card-id="activeCardId"
          @update:activeCardId="activeCardId = $event"
        />

        <CardInvoiceSummary
          v-if="activeCard"
          :active-card="activeCard"
          :current-month-name="currentMonthName"
          :current-bill-amount="currentBillAmount"
          :available-limit="availableLimit"
          :limit-percent="limitPercent"
          @edit="openEditModal"
          @delete="confirmDelete"
          @pay="payCardBill"
        />
      </div>

      <PendingTransactionsCard
        v-if="activeCard"
        title="Compras Parceladas (Pendentes)"
        :transactions="pendingInstallments"
        empty-message="Nenhuma compra parcelada pendente neste cartão."
        action-icon="⏱️"
        action-title="Antecipar Pagamento"
        layout="grid"
        @action="handleAnticipateClick"
      />
    </template>

    <CardModal :is-open="isModalOpen" :card="cardToEdit" @close="isModalOpen = false" />

    <ConfirmModal
      :is-open="confirmModal.isOpen"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :type="confirmModal.type"
      :is-loading="confirmModal.isLoading"
      @confirm="executeConfirmAction"
      @cancel="confirmModal.isOpen = false"
    />
  </div>
</template>

<style scoped>
.cards-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2rem;
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
}

.subtitle {
  color: var(--text-muted);
  font-size: 1rem;
  margin-top: 0.2rem;
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.loading-state {
  min-height: 50vh;
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.empty-state h2 {
  color: var(--text-color);
  font-size: 1.5rem;
}

.empty-state p {
  color: var(--text-muted);
  max-width: 400px;
  line-height: 1.5;
}

.mt-3 {
  margin-top: 1rem;
}

.cards-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .cards-layout {
    grid-template-columns: 1fr;
  }
}
</style>
