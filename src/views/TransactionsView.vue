<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore } from '../stores/finance'

const financeStore = useFinanceStore()

const filterMonth = ref('all')
const filterType = ref('all')
const searchQuery = ref('')

const currentPage = ref(1)
const itemsPerPage = 10

onMounted(async () => {
  if (financeStore.transactions.length === 0) {
    await financeStore.fetchAllData()
  }
})

const getCategoryColor = (categoryId: number) => {
  const cat = financeStore.categories.find(c => c.id === categoryId)
  return cat ? cat.colorHex : '#94A3B8'
}

const getCategoryIcon = (categoryId: number) => {
  const cat = financeStore.categories.find(c => c.id === categoryId)
  return cat ? cat.icon : '📌'
}

const availableMonths = computed(() => {
  const months = new Set<string>()
  financeStore.transactions.forEach(tx => {
    if (tx.transactionDate) {
      months.add(tx.transactionDate.substring(0, 7))
    }
  })
  
  return Array.from(months).sort().reverse().map(monthStr => {
    const [year, month] = monthStr.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
    return {
      value: monthStr,
      label: label.charAt(0).toUpperCase() + label.slice(1)
    }
  })
})

const filteredTransactions = computed(() => {
  let filtered = financeStore.transactions

  if (filterMonth.value !== 'all') {
    filtered = filtered.filter(tx => tx.transactionDate && tx.transactionDate.substring(0, 7) === filterMonth.value)
  }

  if (filterType.value !== 'all') {
    filtered = filtered.filter(tx => tx.type === filterType.value)
  }

  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(tx => 
      (tx.description && tx.description.toLowerCase().includes(query)) ||
      (tx.categoryName && tx.categoryName.toLowerCase().includes(query)) ||
      (tx.accountName && tx.accountName.toLowerCase().includes(query))
    )
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage) || 1
})

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredTransactions.value.slice(start, end)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const formatDate = (dateStr: string) => {
  if(!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}
</script>

<template>
  <div class="transactions-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Transações</h1>
        <p class="subtitle">Acompanhe todas as suas entradas e saídas detalhadamente</p>
      </div>
      <button class="btn-primary">+ Nova Transação</button>
    </div>

    <div class="filters-bar glass-card">
      <div class="filter-group">
        <label>Período</label>
        <div class="select-wrapper">
          <select v-model="filterMonth" class="styled-input" @change="currentPage = 1">
            <option value="all">Todos os meses</option>
            <option v-for="month in availableMonths" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="filter-group">
        <label>Tipo de Lançamento</label>
        <div class="select-wrapper">
          <select v-model="filterType" class="styled-input" @change="currentPage = 1">
            <option value="all">Todas as transações</option>
            <option value="INCOME">Apenas Receitas (+)</option>
            <option value="EXPENSE">Apenas Despesas (-)</option>
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
            placeholder="Ex: Mercado, Uber, Salário..." 
            class="styled-input search-input" 
          />
        </div>
      </div>
    </div>

    <div class="table-container glass-card">
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in paginatedTransactions" :key="tx.id" class="table-row">
              <td class="td-date">
                <span class="date">{{ formatDate(tx.transactionDate) }}</span>
              </td>
              <td class="td-desc">
                <strong>{{ tx.description || tx.categoryName }}</strong>
                <span v-if="tx.installmentTotal" class="installment-tag">
                  Parcela {{ tx.installmentCurrent }}/{{ tx.installmentTotal }}
                </span>
                <span v-if="tx.isFixed" class="fixed-tag">Fixo</span>
              </td>
              <td class="td-category">
                <span class="cat-badge" :style="{ backgroundColor: getCategoryColor(tx.categoryId) + '20', color: getCategoryColor(tx.categoryId), borderColor: getCategoryColor(tx.categoryId) + '40' }">
                  {{ getCategoryIcon(tx.categoryId) }} {{ tx.categoryName }}
                </span>
              </td>
              <td class="td-account">
                <span class="account-name">🏦 {{ tx.accountName }}</span>
                <span v-if="tx.creditCardName" class="card-name">💳 {{ tx.creditCardName }}</span>
              </td>
              <td class="td-amount text-right" :class="tx.type.toLowerCase()">
                {{ tx.type === 'INCOME' ? '+' : '-' }} {{ formatCurrency(tx.amount) }}
              </td>
              <td class="td-status text-center">
                <span class="status-badge" :class="tx.isPaid ? 'paid' : 'pending'">
                  {{ tx.isPaid ? 'Pago' : 'Pendente' }}
                </span>
              </td>
            </tr>
            <tr v-if="paginatedTransactions.length === 0">
              <td colspan="6" class="empty-state">
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
          Mostrando <strong>{{ paginatedTransactions.length }}</strong> de <strong>{{ filteredTransactions.length }}</strong> transações
        </span>
        <div class="page-controls">
          <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">Anterior</button>
          <span class="page-current">Página {{ currentPage }} de {{ totalPages }}</span>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">Próxima</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transactions-container { display: flex; flex-direction: column; gap: 2rem; padding-bottom: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; }
.page-title { font-size: 2rem; font-weight: 800; color: var(--text-color); }
.subtitle { color: var(--text-muted); font-size: 1rem; margin-top: 0.2rem; }
.btn-primary { padding: 0.8rem 1.5rem; border: none; border-radius: 0.75rem; background: var(--primary-gradient); color: white; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }

.filters-bar { display: flex; gap: 1.5rem; padding: 1.5rem; flex-wrap: wrap; align-items: flex-end; }
.filter-group { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 200px; }
.filter-group.search { flex: 2; }
.filter-group label { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

.styled-input { width: 100%; padding: 0.8rem 1rem; border: 1px solid var(--glass-border); background: var(--input-bg); color: var(--text-color); border-radius: 0.75rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; cursor: pointer; }
.styled-input:focus { border-color: #8B5CF6; }

.search-wrapper { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 1rem; opacity: 0.6; }
.search-input { padding-left: 2.8rem; cursor: text; }

.table-container { padding: 1rem; display: flex; flex-direction: column; }
.table-responsive { overflow-x: auto; }
.finance-table { width: 100%; border-collapse: collapse; min-width: 800px; }
.finance-table th, .finance-table td { padding: 1.2rem 1rem; text-align: left; border-bottom: 1px solid var(--glass-border); }
.finance-table th { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding-top: 0.5rem; }

.table-row { transition: background-color 0.2s; }
.table-row:hover { background-color: rgba(255, 255, 255, 0.05); }

.td-date { display: flex; flex-direction: column; }
.date { font-weight: 600; color: var(--text-color); font-size: 0.95rem; }

.td-desc { display: flex; flex-direction: column; align-items: flex-start; gap: 0.3rem; }
.td-desc strong { color: var(--text-color); font-size: 0.95rem; }
.installment-tag, .fixed-tag { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 1rem; font-weight: 600; background: var(--glass-bg); color: var(--text-muted); border: 1px solid var(--glass-border); }

.cat-badge { padding: 0.3rem 0.8rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 700; border: 1px solid; display: inline-block; }
.td-account { display: flex; flex-direction: column; gap: 0.3rem; }
.account-name { font-size: 0.9rem; color: var(--text-muted); font-weight: 600; }
.card-name { font-size: 0.75rem; color: #8B5CF6; font-weight: 600; }

.text-right { text-align: right !important; }
.text-center { text-align: center !important; }

.td-amount { font-weight: 700; font-size: 1.05rem; white-space: nowrap; }
.td-amount.income { color: #10B981; }
.td-amount.expense { color: #EF4444; }

.status-badge { padding: 0.4rem 0.8rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 700; }
.status-badge.paid { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }

.empty-state { padding: 4rem 0 !important; }
.empty-content { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--text-muted); }
.empty-icon { font-size: 3rem; opacity: 0.5; }

.pagination { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 1rem 0.5rem; border-top: 1px solid var(--glass-border); margin-top: 0.5rem; }
.page-info { font-size: 0.9rem; color: var(--text-muted); }
.page-info strong { color: var(--text-color); }
.page-controls { display: flex; align-items: center; gap: 1rem; }
.page-current { font-size: 0.9rem; font-weight: 600; color: var(--text-color); }
.page-btn { padding: 0.5rem 1rem; background: var(--input-bg); border: 1px solid var(--glass-border); color: var(--text-color); border-radius: 0.5rem; cursor: pointer; font-weight: 600; transition: all 0.2s; }
.page-btn:hover:not(:disabled) { background: var(--glass-bg); border-color: #8B5CF6; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 768px) { .filters-bar { flex-direction: column; align-items: stretch; } }
</style>