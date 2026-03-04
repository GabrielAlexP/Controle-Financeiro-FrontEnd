<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCardStore } from '../stores/card'
import { useFinanceStore } from '../stores/finance'
import { useAccountStore } from '../stores/account'
import { useTransactionStore } from '../stores/transaction'
import CardModal from '../components/CardModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const cardStore = useCardStore()
const financeStore = useFinanceStore()
const accountStore = useAccountStore()
const transactionStore = useTransactionStore()

const isModalOpen = ref(false)
const activeCardId = ref<number | null>(null)
const cardToEdit = ref<any>(null)

const confirmModal = ref({
  isOpen: false,
  title: '',
  message: '',
  type: 'primary' as 'primary' | 'danger' | 'success',
  isLoading: false,
  action: async () => {}
})

onMounted(async () => {
  await cardStore.fetchCards()
  if (financeStore.transactions.length === 0) {
    await financeStore.fetchAllData()
  }
  if (accountStore.accounts.length === 0) {
    await accountStore.fetchAccounts()
  }
  if (cardStore.cards.length > 0) {
    activeCardId.value = cardStore.cards[0].id
  }
})

watch(() => cardStore.cards, (newCards) => {
  if (newCards.length > 0 && (!activeCardId.value || !newCards.find(c => c.id === activeCardId.value))) {
    activeCardId.value = newCards[0].id
  } else if (newCards.length === 0) {
    activeCardId.value = null
  }
}, { deep: true })

const activeCard = computed(() => {
  return cardStore.cards.find(c => c.id === activeCardId.value) || null
})

const getCurrentMonthString = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const currentMonthStr = computed(() => getCurrentMonthString())

const currentMonthName = computed(() => {
  const date = new Date()
  const formatted = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

const totalUsedLimit = computed(() => {
  if (!activeCard.value) return 0
  return financeStore.transactions
    .filter(tx => tx.creditCardId === activeCard.value.id && !tx.isPaid)
    .reduce((sum, tx) => sum + tx.amount, 0)
})

const currentBillAmount = computed(() => {
  if (!activeCard.value) return 0
  return financeStore.transactions
    .filter(tx => tx.creditCardId === activeCard.value.id && !tx.isPaid && tx.transactionDate.substring(0, 7) === currentMonthStr.value)
    .reduce((sum, tx) => sum + tx.amount, 0)
})

const availableLimit = computed(() => {
  if (!activeCard.value) return 0
  return activeCard.value.limitAmount - totalUsedLimit.value
})

const limitPercent = computed(() => {
  if (!activeCard.value || activeCard.value.limitAmount === 0) return 0
  const percent = (totalUsedLimit.value / activeCard.value.limitAmount) * 100
  return percent > 100 ? 100 : percent
})

const pendingInstallments = computed(() => {
  if (!activeCard.value) return []
  return financeStore.transactions
    .filter(tx => tx.creditCardId === activeCard.value!.id && !tx.isPaid && tx.installmentTotal)
    .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime())
})

const openCreateModal = () => {
  cardToEdit.value = null
  isModalOpen.value = true
}

const openEditModal = () => {
  cardToEdit.value = activeCard.value
  isModalOpen.value = true
}

const openConfirmModal = (title: string, message: string, type: 'primary' | 'danger' | 'success', action: () => Promise<void>) => {
  confirmModal.value.title = title
  confirmModal.value.message = message
  confirmModal.value.type = type
  confirmModal.value.action = action
  confirmModal.value.isOpen = true
}

const executeConfirmAction = async () => {
  confirmModal.value.isLoading = true
  try {
    await confirmModal.value.action()
    await financeStore.fetchAllData()
    confirmModal.value.isOpen = false
  } catch (error: any) {
    alert(error.response?.data?.error || 'Erro ao processar a ação.')
  } finally {
    confirmModal.value.isLoading = false
  }
}

const confirmDelete = () => {
  if (!activeCard.value) return
  openConfirmModal(
    'Excluir Cartão?',
    'Tem certeza que deseja excluir este cartão? O saldo da sua conta poderá ser recalculado e o histórico será afetado.',
    'danger',
    async () => {
      await cardStore.deleteCard(activeCard.value!.id)
    }
  )
}

const payCardBill = () => {
  if (!activeCard.value || currentBillAmount.value <= 0) return
  openConfirmModal(
    'Pagar Fatura?',
    `Deseja pagar a fatura de ${currentMonthName.value} no valor de ${formatCurrency(currentBillAmount.value)}? O valor será descontado do saldo da conta bancária vinculada.`,
    'success',
    async () => {
      await cardStore.payBill(activeCard.value!.id, currentMonthStr.value)
    }
  )
}

const handleAnticipateClick = (tx: any) => {
  openConfirmModal(
    'Antecipar Parcela?',
    `Deseja antecipar a parcela ${tx.installmentCurrent}/${tx.installmentTotal} de "${tx.description || tx.categoryName}" para hoje? O valor de ${formatCurrency(tx.amount)} será descontado da conta bancária imediatamente.`,
    'success',
    async () => {
      await transactionStore.advanceTransaction(tx.id)
    }
  )
}

const getCategoryIcon = (categoryId: number) => {
  const cat = financeStore.categories.find(c => c.id === categoryId)
  return cat ? cat.icon : '📌'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
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
      <p>Você ainda não possui cartões de crédito. Adicione um para começar a controlar suas faturas.</p>
      <button class="btn-primary mt-3" @click="openCreateModal">+ Adicionar o primeiro</button>
    </div>

    <template v-else>
      <div class="cards-layout">
        <div class="left-column">
          <div class="card-selector">
            <div 
              v-for="card in cardStore.cards" 
              :key="card.id"
              class="mini-card glass-card"
              :class="{ active: activeCardId === card.id }"
              @click="activeCardId = card.id"
            >
              <div class="mini-icon" :style="{ color: card.color1Hex }">💳</div>
              <div class="mini-info">
                <h4>{{ card.name }}</h4>
                <p>Vence dia {{ card.dueDay }}</p>
              </div>
            </div>
          </div>

          <div class="virtual-card-wrapper" v-if="activeCard">
            <div 
              class="virtual-card"
              :style="{ background: `linear-gradient(135deg, ${activeCard.color1Hex}, ${activeCard.color2Hex})` }"
            >
              <div class="card-top">
                <div class="chip"></div>
                <div class="network-logo">💳</div>
              </div>
              <div class="card-middle">
                <span class="card-number">•••• •••• •••• ••••</span>
              </div>
              <div class="card-bottom">
                <div class="card-holder">
                  <span>BANCO</span>
                  <p>{{ activeCard.accountName }}</p>
                </div>
                <div class="card-expires">
                  <span>FECHAMENTO</span>
                  <p>DIA {{ activeCard.closingDay }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="right-column" v-if="activeCard">
          <div class="details-card glass-card">
            <div class="details-header">
              <div>
                <h2>Fatura Atual</h2>
                <p class="card-title-name">{{ activeCard.name }}</p>
              </div>
              <div class="header-actions">
                <span class="status-badge" :class="limitPercent > 80 ? 'danger' : 'safe'">
                  {{ limitPercent > 80 ? 'Atenção ao Limite' : 'Limite Saudável' }}
                </span>
                <button class="btn-edit" @click="openEditModal" title="Editar Cartão">✏️</button>
                <button class="btn-delete" @click="confirmDelete" title="Excluir Cartão">🗑️</button>
              </div>
            </div>

            <div class="amounts-display">
              <div class="amount-box">
                <span class="label">Fatura de <span style="text-transform: capitalize;">{{ currentMonthName }}</span></span>
                <span class="value used">{{ formatCurrency(currentBillAmount) }}</span>
              </div>
              <div class="amount-box right">
                <span class="label">Limite Disponível</span>
                <span class="value available">{{ formatCurrency(availableLimit) }}</span>
              </div>
            </div>

            <div class="limit-bar-container">
              <div class="limit-track">
                <div class="limit-fill"
                  :style="{ width: limitPercent + '%', backgroundColor: limitPercent > 80 ? '#EF4444' : activeCard.color1Hex }">
                </div>
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

            <button class="btn-pay-bill" :disabled="currentBillAmount <= 0" @click="payCardBill">
              💵 Pagar Fatura ({{ formatCurrency(currentBillAmount) }})
            </button>
          </div>
        </div>
      </div>

      <div class="pending-installments-section glass-card" v-if="activeCard">
        <div class="section-header">
          <h3>Compras Parceladas (Pendentes)</h3>
        </div>
        
        <div class="transaction-grid" v-if="pendingInstallments.length > 0">
          <div class="transaction-item" v-for="tx in pendingInstallments" :key="tx.id">
            <div class="tx-icon">{{ getCategoryIcon(tx.categoryId) }}</div>
            <div class="tx-details">
              <p class="tx-desc">
                {{ tx.description || tx.categoryName }}
                <span class="installment-badge">{{ tx.installmentCurrent }}/{{ tx.installmentTotal }}</span>
              </p>
              <p class="tx-date-cat">Vencimento: {{ formatDate(tx.transactionDate) }}</p>
            </div>
            <div class="tx-amount expense">
              - {{ formatCurrency(tx.amount) }}
            </div>
            <button @click="handleAnticipateClick(tx)" class="action-btn check" title="Antecipar Pagamento">⏱️</button>
          </div>
        </div>

        <div v-else class="empty-message">
          Nenhuma compra parcelada pendente neste cartão.
        </div>
      </div>
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
  border-top-color: #8B5CF6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.left-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-selector {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.card-selector::-webkit-scrollbar {
  height: 4px;
}

.card-selector::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 4px;
}

.mini-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  min-width: 180px;
}

.mini-card:hover {
  border-color: var(--glass-border);
  background: var(--input-bg);
}

.mini-card.active {
  border-color: #8B5CF6;
  background: rgba(139, 92, 246, 0.05);
}

.mini-icon {
  font-size: 1.5rem;
}

.mini-info h4 {
  font-size: 0.95rem;
  color: var(--text-color);
}

.mini-info p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.virtual-card-wrapper {
  perspective: 1000px;
  padding: 1rem 0;
}

.virtual-card {
  width: 100%;
  max-width: 400px;
  height: 250px;
  border-radius: 1.5rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), inset 0 2px 10px rgba(255, 255, 255, 0.2);
  transition: all 0.5s cubic-bezier(0.4, 0.2, 0.2, 1);
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.virtual-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  transform: rotate(30deg);
  pointer-events: none;
}

.virtual-card:hover {
  transform: translateY(-10px) rotateX(5deg) rotateY(-5deg);
  box-shadow: 0 30px 50px rgba(0, 0, 0, 0.3);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.chip {
  width: 45px;
  height: 35px;
  background: linear-gradient(135deg, #e0c38c, #cda75d);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.chip::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.2);
  top: 50%;
  left: 0;
}

.chip::before {
  content: '';
  position: absolute;
  width: 1px;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  top: 0;
  left: 50%;
}

.network-logo {
  font-size: 2rem;
}

.card-middle {
  margin-top: 1rem;
  position: relative;
  z-index: 1;
}

.card-number {
  font-size: 1.5rem;
  font-family: monospace;
  letter-spacing: 2px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  opacity: 0.9;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.card-holder span,
.card-expires span {
  font-size: 0.65rem;
  opacity: 0.8;
  letter-spacing: 1px;
}

.card-holder p,
.card-expires p {
  font-size: 1rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
}

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
  color: #10B981;
}

.status-badge.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
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
  background: #3B82F6;
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
  background: #EF4444;
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
  color: #10B981;
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
  color: #10B981;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-pay-bill:hover:not(:disabled) {
  background: #10B981;
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

/* NOVO: SEÇÃO DE PARCELAS (LARGURA TOTAL) */
.pending-installments-section {
  padding: 2rem;
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

.transaction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.transaction-grid::-webkit-scrollbar {
  width: 6px;
}

.transaction-grid::-webkit-scrollbar-thumb {
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
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
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
}

.installment-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  background: var(--glass-bg);
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
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
  color: #EF4444;
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
  background: #10B981;
  border-color: #10B981;
  filter: grayscale(0);
  transform: scale(1.1);
  color: white;
}

.empty-message {
  padding: 3rem;
  text-align: center;
  color: var(--text-muted);
  font-weight: 500;
  background: var(--input-bg);
  border-radius: 1rem;
  border: 1px dashed var(--glass-border);
  font-size: 1.1rem;
}

@media (max-width: 1024px) {
  .cards-layout {
    grid-template-columns: 1fr;
  }

  .virtual-card {
    margin: 0 auto;
  }
}
</style>