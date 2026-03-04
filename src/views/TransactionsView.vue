<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTransactionStore } from "../stores/transaction";
import { useFinanceStore } from "../stores/finance";
import TransactionModal from "../components/shared/TransactionModal.vue";
import ConfirmModal from "../components/shared/ConfirmModal.vue";

const transactionStore = useTransactionStore();
const financeStore = useFinanceStore();

const isModalOpen = ref(false);

const filterMonth = ref(
  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
);
const filterType = ref("all");
const filterStatus = ref("all");
const filterCategory = ref("all");
const searchQuery = ref("");

const currentPage = ref(1);
const itemsPerPage = 10;

const confirmModal = ref({
  isOpen: false,
  title: "",
  message: "",
  type: "primary" as "primary" | "danger" | "success",
  isLoading: false,
  action: async () => {},
});

onMounted(async () => {
  if (transactionStore.transactions.length === 0) {
    await transactionStore.fetchTransactions();
  }
  if (financeStore.categories.length === 0) {
    await financeStore.fetchAllData();
  }
});

const getCategoryColor = (categoryId: number) => {
  const cat = financeStore.categories.find((c) => c.id === categoryId);
  return cat ? cat.colorHex : "#94A3B8";
};

const getCategoryIcon = (categoryId: number) => {
  const cat = financeStore.categories.find((c) => c.id === categoryId);
  return cat ? cat.icon : "📌";
};

const filteredTransactions = computed(() => {
  let filtered = transactionStore.transactions;

  if (filterMonth.value && filterMonth.value !== "") {
    filtered = filtered.filter(
      (tx) =>
        tx.transactionDate && tx.transactionDate.substring(0, 7) === filterMonth.value
    );
  }

  if (filterType.value !== "all") {
    filtered = filtered.filter((tx) => tx.type === filterType.value);
  }

  if (filterStatus.value !== "all") {
    const isPaid = filterStatus.value === "paid";
    filtered = filtered.filter((tx) => tx.isPaid === isPaid);
  }

  if (filterCategory.value !== "all") {
    filtered = filtered.filter((tx) => tx.categoryId === Number(filterCategory.value));
  }

  if (searchQuery.value.trim() !== "") {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (tx) =>
        (tx.description && tx.description.toLowerCase().includes(query)) ||
        (tx.categoryName && tx.categoryName.toLowerCase().includes(query)) ||
        (tx.accountName && tx.accountName.toLowerCase().includes(query))
    );
  }

  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage) || 1;
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredTransactions.value.slice(start, end);
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

const getLocalTodayString = (): string => {
  const date = new Date();
  const dateAdjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return dateAdjusted.toISOString().split("T")[0] || "";
};

const isCurrentMonthPending = (tx: any) => {
  if (tx.isPaid || !tx.transactionDate) return false;
  const currentMonth = getLocalTodayString().substring(0, 7);
  const txMonth = tx.transactionDate.substring(0, 7);
  return txMonth === currentMonth;
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

const handlePayClick = (tx: any) => {
  const localToday = getLocalTodayString();
  const txDate = tx.transactionDate || "";

  if (txDate > localToday) {
    openConfirmModal(
      "Antecipar Pagamento?",
      `Esta transação está agendada para ${formatDate(
        txDate
      )}. Deseja antecipar o pagamento para hoje? O valor será descontado da conta vinculada imediatamente.`,
      "success",
      () => transactionStore.advanceTransaction(tx.id)
    );
  } else {
    openConfirmModal(
      "Confirmar Pagamento?",
      "Deseja confirmar este pagamento? O valor será descontado do saldo da conta vinculada.",
      "success",
      () => transactionStore.markAsPaid(tx.id)
    );
  }
};

const handleDeleteClick = (id: number) => {
  openConfirmModal(
    "Excluir Transação?",
    "Tem certeza que deseja excluir esta transação? O saldo da sua conta será recalculado e esta ação não pode ser desfeita.",
    "danger",
    () => transactionStore.deleteTransaction(id)
  );
};
</script>

<template>
  <div class="transactions-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Transações</h1>
        <p class="subtitle">Acompanhe todas as suas entradas e saídas detalhadamente</p>
      </div>
      <button class="btn-primary" @click="isModalOpen = true">+ Nova Transação</button>
    </div>

    <div class="filters-bar glass-card">
      <div class="filter-group">
        <label>Período</label>
        <input
          type="month"
          v-model="filterMonth"
          class="styled-input month-picker"
          @change="currentPage = 1"
        />
      </div>

      <div class="filter-group">
        <label>Categoria</label>
        <div class="select-wrapper">
          <select v-model="filterCategory" class="styled-input" @change="currentPage = 1">
            <option value="all">Todas</option>
            <option v-for="cat in financeStore.categories" :key="cat.id" :value="cat.id">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="filter-group">
        <label>Status</label>
        <div class="select-wrapper">
          <select v-model="filterStatus" class="styled-input" @change="currentPage = 1">
            <option value="all">Todos</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>
      </div>

      <div class="filter-group">
        <label>Tipo</label>
        <div class="select-wrapper">
          <select v-model="filterType" class="styled-input" @change="currentPage = 1">
            <option value="all">Ambos</option>
            <option value="INCOME">Receitas (+)</option>
            <option value="EXPENSE">Despesas (-)</option>
          </select>
        </div>
      </div>

      <div class="filter-group search">
        <label>Buscar Lançamento</label>
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            @input="currentPage = 1"
            placeholder="Ex: Mercado, Uber..."
            class="styled-input search-input"
          />
        </div>
      </div>
    </div>

    <div v-if="transactionStore.isLoading" class="loading-state">
      Carregando transações...
    </div>

    <div v-else class="table-container glass-card">
      <div class="table-responsive">
        <table class="finance-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th class="text-right">Valor</th>
              <th class="text-center">Status</th>
              <th class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tx in paginatedTransactions"
              :key="tx.id"
              class="table-row"
              :class="{ 'highlight-pending': isCurrentMonthPending(tx) }"
            >
              <td>
                <span class="date">{{ formatDate(tx.transactionDate) }}</span>
              </td>
              <td>
                <div class="info-col">
                  <strong>{{ tx.description || tx.categoryName }}</strong>
                  <div class="tags-container" v-if="tx.installmentTotal || tx.isFixed">
                    <span v-if="tx.installmentTotal" class="installment-tag">
                      Parcela {{ tx.installmentCurrent }}/{{ tx.installmentTotal }}
                    </span>
                    <span v-if="tx.isFixed" class="fixed-tag">Fixo</span>
                  </div>
                </div>
              </td>
              <td>
                <span
                  class="cat-badge"
                  :style="{
                    backgroundColor: getCategoryColor(tx.categoryId) + '20',
                    color: getCategoryColor(tx.categoryId),
                    borderColor: getCategoryColor(tx.categoryId) + '40',
                  }"
                >
                  {{ getCategoryIcon(tx.categoryId) }} {{ tx.categoryName }}
                </span>
              </td>
              <td>
                <div class="info-col">
                  <span class="account-name">🏦 {{ tx.accountName }}</span>
                  <span v-if="tx.creditCardName" class="card-name"
                    >💳 {{ tx.creditCardName }}</span
                  >
                </div>
              </td>
              <td class="text-right">
                <div class="amount-col" :class="tx.type.toLowerCase()">
                  {{ tx.type === "INCOME" ? "+" : "-" }} {{ formatCurrency(tx.amount) }}
                </div>
              </td>
              <td class="text-center">
                <span class="status-badge" :class="tx.isPaid ? 'paid' : 'pending'">
                  {{ tx.isPaid ? "Pago" : "Pendente" }}
                </span>
              </td>
              <td>
                <div class="actions-wrapper">
                  <button
                    v-if="!tx.isPaid"
                    @click="handlePayClick(tx)"
                    class="action-btn check"
                    title="Realizar Pagamento"
                  >
                    ✅
                  </button>
                  <button
                    @click="handleDeleteClick(tx.id)"
                    class="action-btn delete"
                    title="Excluir Transação"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedTransactions.length === 0">
              <td colspan="7" class="empty-state">
                <div class="empty-content">
                  <span class="empty-icon">📭</span>
                  <p>Nenhuma transação encontrada com esses filtros.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="filteredTransactions.length > 0">
        <span class="page-info">
          Mostrando <strong>{{ paginatedTransactions.length }}</strong> de
          <strong>{{ filteredTransactions.length }}</strong> transações
        </span>
        <div class="page-controls">
          <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">
            Anterior
          </button>
          <span class="page-current">Página {{ currentPage }} de {{ totalPages }}</span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>

    <TransactionModal :is-open="isModalOpen" @close="isModalOpen = false" />

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
.transactions-container {
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
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  font-size: 1.2rem;
  font-weight: 600;
}

.filters-bar {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 150px;
}

.filter-group.search {
  flex: 2;
  min-width: 250px;
}

.filter-group label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.styled-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid var(--glass-border);
  background: var(--input-bg);
  color: var(--text-color);
  border-radius: 0.75rem;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  cursor: pointer;
}

.styled-input:focus {
  border-color: #8b5cf6;
}

.month-picker {
  text-transform: capitalize;
}

.month-picker::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(0.5);
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  opacity: 0.6;
}

.search-input {
  padding-left: 2.8rem;
  cursor: text;
}

.table-container {
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.table-responsive {
  overflow-x: auto;
}

.finance-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.finance-table th,
.finance-table td {
  padding: 1.2rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--glass-border);
  vertical-align: middle;
}

.finance-table th {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-top: 0.5rem;
}

.table-row {
  transition: all 0.2s;
}

.table-row:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.highlight-pending {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%);
  border-left: 4px solid #f59e0b;
}

.highlight-pending td:first-child {
  padding-left: 0.8rem;
}

.info-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
}

.date {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.95rem;
}

.info-col strong {
  color: var(--text-color);
  font-size: 0.95rem;
}

.tags-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.installment-tag,
.fixed-tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  font-weight: 600;
  background: var(--glass-bg);
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
}

.cat-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid;
  display: inline-block;
  white-space: nowrap;
}

.account-name {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
}

.card-name {
  font-size: 0.75rem;
  color: #8b5cf6;
  font-weight: 600;
}

.text-right {
  text-align: right !important;
}

.text-center {
  text-align: center !important;
}

.amount-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-weight: 700;
  font-size: 1.05rem;
  white-space: nowrap;
}

.amount-col.income {
  color: #10b981;
}

.amount-col.expense {
  color: #ef4444;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-block;
  white-space: nowrap;
}

.status-badge.paid {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.actions-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn.delete:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.1);
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
  color: white;
}

.empty-state {
  padding: 4rem 0 !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1rem 0.5rem;
  border-top: 1px solid var(--glass-border);
  margin-top: 0.5rem;
}

.page-info {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.page-info strong {
  color: var(--text-color);
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-current {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.page-btn {
  padding: 0.5rem 1rem;
  background: var(--input-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-color);
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--glass-bg);
  border-color: #8b5cf6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>