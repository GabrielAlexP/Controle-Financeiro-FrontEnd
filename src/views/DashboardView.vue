<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore } from '../stores/finance'

const financeStore = useFinanceStore()

const activeAccountId = ref<number | 'geral'>('geral')
const chartViewType = ref<'bars' | 'pie'>('bars')

const selectedMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)

onMounted(async () => {
  await financeStore.fetchAllData()
})

const activeAccountName = computed(() => {
  if (activeAccountId.value === 'geral') return 'Todas as Contas'
  const account = financeStore.accounts.find(a => a.id === activeAccountId.value)
  return account ? account.name : 'Sua Conta'
})

const dashboardData = computed(() => {
  let inc = 0, exp = 0
  
  financeStore.transactions.forEach(tx => {
    const txMonth = tx.transactionDate ? tx.transactionDate.substring(0, 7) : ''
    
    if (tx.isPaid && txMonth === selectedMonth.value) {
      if (activeAccountId.value === 'geral' || tx.accountId === activeAccountId.value) {
        if (tx.type === 'INCOME') inc += tx.amount
        if (tx.type === 'EXPENSE') exp += tx.amount
      }
    }
  })

  const bal = activeAccountId.value === 'geral' 
      ? financeStore.totalBalance 
      : (financeStore.accounts.find(a => a.id === activeAccountId.value)?.balance || 0)

  return {
    balance: bal,
    income: inc,
    expense: exp,
    netIncome: inc - exp
  }
})

const expensesByCategory = computed(() => {
  const categoryTotals: Record<number, number> = {}
  let totalExpense = 0

  financeStore.transactions.forEach(tx => {
    const txMonth = tx.transactionDate ? tx.transactionDate.substring(0, 7) : ''
    
    if (tx.type === 'EXPENSE' && tx.isPaid && txMonth === selectedMonth.value) {
      if (activeAccountId.value === 'geral' || tx.accountId === activeAccountId.value) {
         categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount
         totalExpense += tx.amount
      }
    }
  })

  const result = Object.keys(categoryTotals).map(catIdStr => {
    const catId = Number(catIdStr)
    const cat = financeStore.categories.find(c => c.id === catId)
    const amount = categoryTotals[catId]
    return {
      id: catId,
      name: cat ? cat.name : 'Outros',
      amount: amount,
      color: cat ? cat.colorHex : '#ccc',
      percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }
  }).sort((a, b) => b.amount - a.amount)

  return result
})

const pieChartStyle = computed(() => {
  let gradientStrings: string[] = []
  let currentStart = 0
  
  if (expensesByCategory.value.length === 0) {
    return { background: 'conic-gradient(#e2e8f0 0% 100%)' }
  }

  for (const cat of expensesByCategory.value) {
    const end = currentStart + cat.percent
    gradientStrings.push(`${cat.color} ${currentStart}% ${end}%`)
    currentStart = end
  }
  
  return {
    background: `conic-gradient(${gradientStrings.join(', ')})`
  }
})

const recentTransactions = computed(() => {
  return financeStore.transactions
    .filter(tx => {
      const txMonth = tx.transactionDate ? tx.transactionDate.substring(0, 7) : ''
      const isAccMatch = activeAccountId.value === 'geral' || tx.accountId === activeAccountId.value
      return isAccMatch && txMonth === selectedMonth.value
    })
    .slice(0, 5)
})

const getCategoryIcon = (categoryId: number) => {
  const cat = financeStore.categories.find(c => c.id === categoryId)
  return cat ? cat.icon : '📌'
}

const currentMonthFormatted = computed(() => {
  if (!selectedMonth.value) return ''
  const [year, month] = selectedMonth.value.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  const formatted = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const calcProgress = (current: number, target: number) => {
  if (!target || target === 0) return 100
  const percent = (current / target) * 100
  return percent > 100 ? 100 : percent
}

const formatDate = (dateStr: string) => {
  if(!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}
</script>

<template>
  <div class="dashboard-container" v-if="!financeStore.isLoading">
    
    <div class="page-header">
      <div>
        <h1 class="page-title">Visão Geral</h1>
        <p class="subtitle">
          Resumo financeiro de <strong>{{ currentMonthFormatted }}</strong> 
          <span v-if="activeAccountId !== 'geral'">em <strong>{{ activeAccountName }}</strong></span>
        </p>
      </div>
      <div class="header-actions">
        <input type="month" v-model="selectedMonth" class="month-picker glass-card" />
        <button class="btn-outline" @click="financeStore.fetchAllData()">🔄 Atualizar</button>
      </div>
    </div>

    <div class="account-tabs">
      <button 
        class="tab-btn"
        :class="{ active: activeAccountId === 'geral' }"
        @click="activeAccountId = 'geral'"
      >
        📊 Todas as Contas
      </button>
      <button 
        v-for="account in financeStore.accounts" 
        :key="account.id"
        class="tab-btn"
        :class="{ active: activeAccountId === account.id }"
        @click="activeAccountId = account.id"
      >
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
            <div class="card-icon" :class="dashboardData.netIncome >= 0 ? 'green' : 'red'">⚖️</div>
            <div class="card-info">
              <h3>Sobra</h3>
              <p class="amount" :class="dashboardData.netIncome >= 0 ? 'positive' : 'negative'">
                {{ dashboardData.netIncome >= 0 ? '+' : '' }} {{ formatCurrency(dashboardData.netIncome) }}
              </p>
            </div>
          </div>
        </div>

        <div class="dashboard-grid main-grid">
          <div class="category-chart glass-card">
            <div class="section-header">
              <div>
                <h3>Onde seu dinheiro foi</h3>
              </div>
              
              <div class="chart-toggle glass-card">
                <button 
                  :class="{ active: chartViewType === 'bars' }" 
                  @click="chartViewType = 'bars'"
                >
                  📊
                </button>
                <button 
                  :class="{ active: chartViewType === 'pie' }" 
                  @click="chartViewType = 'pie'"
                >
                  🍩
                </button>
              </div>
            </div>
            
            <div v-if="expensesByCategory.length === 0" class="empty-message">
              Nenhuma despesa neste mês.
            </div>

            <Transition name="fade" mode="out-in" v-else>
              <div v-if="chartViewType === 'bars'" class="category-list" key="bars">
                <div class="cat-item" v-for="cat in expensesByCategory" :key="cat.id">
                  <div class="cat-header">
                    <span class="cat-name">{{ getCategoryIcon(cat.id) }} {{ cat.name }}</span>
                    <span class="cat-amount">{{ formatCurrency(cat.amount) }} <small>({{ cat.percent }}%)</small></span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" :style="{ width: cat.percent + '%', backgroundColor: cat.color }"></div>
                  </div>
                </div>
              </div>

              <div v-else class="pie-view" key="pie">
                <div class="donut-container">
                  <div class="donut-chart" :style="pieChartStyle">
                    <div class="donut-hole">
                      <span class="donut-total-label">Total</span>
                      <span class="donut-total-value">{{ formatCurrency(dashboardData.expense) }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="pie-legend">
                  <div class="legend-item" v-for="cat in expensesByCategory" :key="cat.id">
                    <div class="legend-color" :style="{ backgroundColor: cat.color }"></div>
                    <div class="legend-info">
                      <span class="legend-name">{{ cat.name }}</span>
                      <span class="legend-percent">{{ cat.percent }}%</span>
                    </div>
                    <span class="legend-amount">{{ formatCurrency(cat.amount) }}</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <div class="recent-transactions glass-card">
            <div class="section-header">
              <h3>Transações</h3>
              <router-link to="/transacoes" class="link-view-all">Ver todas</router-link>
            </div>
            
            <div class="transaction-list">
              <div class="transaction-item" v-for="tx in recentTransactions" :key="tx.id">
                <div class="tx-icon">{{ getCategoryIcon(tx.categoryId) }}</div>
                <div class="tx-details">
                  <p class="tx-desc">
                    {{ tx.description || tx.categoryName }} 
                    <small v-if="tx.installmentTotal" style="color:var(--text-muted)">({{ tx.installmentCurrent }}/{{ tx.installmentTotal }})</small>
                  </p>
                  <p class="tx-date-cat">
                    {{ tx.accountName }} <span v-if="tx.creditCardName">• {{ tx.creditCardName }}</span> • {{ formatDate(tx.transactionDate) }}
                  </p>
                </div>
                <div class="tx-amount" :class="tx.type.toLowerCase()">
                  <span v-if="!tx.isPaid" class="pending-badge">Pendente</span>
                  {{ tx.type === 'INCOME' ? '+' : '-' }} {{ formatCurrency(tx.amount) }}
                </div>
              </div>
              
              <div v-if="recentTransactions.length === 0" class="empty-message">
                Sem transações.
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid secondary-grid">
          <div class="goals-area glass-card">
            <div class="section-header">
              <h3>Caixinhas</h3>
              <router-link to="/metas" class="link-view-all">Ver detalhes</router-link>
            </div>
            <div class="goals-list">
              <div class="goal-item" v-for="goal in financeStore.goals" :key="goal.id">
                <div class="goal-header">
                  <span class="goal-name">🎯 {{ goal.name }}</span>
                  <span v-if="goal.yieldType !== 'NONE'" class="goal-yield" :class="goal.yieldType.toLowerCase()">
                    + {{ formatCurrency(goal.yieldAmount) }}
                  </span>
                </div>
                <p class="goal-amounts">
                  <strong>{{ formatCurrency(goal.currentAmount) }}</strong> <span v-if="goal.targetAmount">de {{ formatCurrency(goal.targetAmount) }}</span>
                </p>
                <div class="progress-track" v-if="goal.targetAmount">
                  <div class="progress-fill primary-gradient" :style="{ width: calcProgress(goal.currentAmount, goal.targetAmount) + '%' }"></div>
                </div>
              </div>
              <div v-if="financeStore.goals.length === 0" class="empty-message" style="grid-column: 1 / -1;">
                Sem caixinhas.
              </div>
            </div>
          </div>

          <div class="indicators-area glass-card">
            <div class="section-header">
              <h3>Rendimentos</h3>
            </div>
            <div class="indicators-wrapper">
              <div class="indicator-box">
                <span class="ind-label">Selic</span>
                <span class="ind-value">{{ financeStore.indicators.SELIC }}% <small>a.a</small></span>
              </div>
              <div class="indicator-box">
                <span class="ind-label">CDI</span>
                <span class="ind-value">{{ financeStore.indicators.CDI }}% <small>a.a</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <div v-else class="loading-state">
    <div class="spinner"></div>
    <h2>Carregando...</h2>
  </div>
</template>

<style scoped>
.dashboard-container { display: flex; flex-direction: column; gap: 2rem; padding-bottom: 2rem; }

.animated-wrapper { display: flex; flex-direction: column; gap: 2rem; width: 100%; }

.view-fade-enter-active, .view-fade-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.view-fade-enter-from { opacity: 0; transform: translateY(15px) scale(0.98); }
.view-fade-leave-to { opacity: 0; transform: translateY(-15px) scale(0.98); }

.loading-state { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-color); }
.spinner { width: 50px; height: 50px; border: 4px solid var(--glass-border); border-top-color: #8B5CF6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; }
.page-title { font-size: 2rem; font-weight: 800; color: var(--text-color); letter-spacing: -0.5px; }
.subtitle { color: var(--text-muted); font-size: 1rem; margin-top: 0.2rem; }
.subtitle strong { color: var(--text-color); }

.header-actions { display: flex; gap: 1rem; align-items: center; }

.month-picker { padding: 0.6rem 1rem; border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text-color); border-radius: 0.8rem; font-weight: 600; font-size: 0.95rem; outline: none; cursor: pointer; transition: border-color 0.2s; }
.month-picker:focus { border-color: #8B5CF6; }
.month-picker::-webkit-calendar-picker-indicator { cursor: pointer; filter: invert(0.5); }

.btn-outline { padding: 0.6rem 1.2rem; border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text-color); border-radius: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover { background: var(--input-bg); border-color: #8B5CF6; }

.account-tabs { display: flex; gap: 0.8rem; overflow-x: auto; padding-bottom: 0.5rem; }
.account-tabs::-webkit-scrollbar { height: 4px; }
.account-tabs::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 4px; }

.tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 2rem; border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text-muted); font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
.tab-btn:hover { background: var(--input-bg); color: var(--text-color); }
.tab-btn.active { background: var(--primary-gradient); color: white; border-color: transparent; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3); }

.summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
.card { padding: 1.5rem; display: flex; align-items: center; gap: 1.2rem; transition: transform 0.3s ease; }
.card:hover { transform: translateY(-5px); }
.card-icon { width: 55px; height: 55px; border-radius: 1.2rem; background: rgba(139, 92, 246, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.card-icon.green { background: rgba(16, 185, 129, 0.1); }
.card-icon.red { background: rgba(239, 68, 68, 0.1); }
.card-info h3 { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem; }
.amount { font-size: 1.6rem; font-weight: 800; color: var(--text-color); white-space: nowrap; }
.amount.positive { color: #10B981; }
.amount.negative { color: #EF4444; }

.dashboard-grid { display: grid; gap: 1.5rem; }
.main-grid { grid-template-columns: 1fr 1fr; }
.secondary-grid { grid-template-columns: 2fr 1fr; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.section-header h3 { font-size: 1.2rem; font-weight: 700; color: var(--text-color); }
.badge { background: rgba(139, 92, 246, 0.15); color: #8B5CF6; padding: 0.3rem 0.8rem; border-radius: 2rem; font-size: 0.8rem; font-weight: 600; margin-left: 0.5rem; }
.link-view-all { color: #8B5CF6; font-size: 0.9rem; font-weight: 600; text-decoration: none; }
.link-view-all:hover { text-decoration: underline; }

.empty-message { padding: 2rem; text-align: center; color: var(--text-muted); font-weight: 500; background: var(--input-bg); border-radius: 1rem; border: 1px dashed var(--glass-border); }

.chart-toggle { display: flex; padding: 0.2rem; border-radius: 0.5rem; gap: 0.2rem; }
.chart-toggle button { background: transparent; border: none; padding: 0.4rem 0.6rem; border-radius: 0.4rem; cursor: pointer; font-size: 1.1rem; opacity: 0.5; transition: all 0.2s; }
.chart-toggle button:hover { opacity: 0.8; background: rgba(255, 255, 255, 0.1); }
.chart-toggle button.active { opacity: 1; background: var(--input-bg); box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }

.category-chart { padding: 1.8rem; }
.category-list { display: flex; flex-direction: column; gap: 1.2rem; }
.cat-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.95rem; font-weight: 600; color: var(--text-color); }
.cat-amount small { color: var(--text-muted); font-weight: 500; }
.progress-track { width: 100%; height: 8px; background: var(--input-bg); border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }
.primary-gradient { background: var(--primary-gradient); }

.pie-view { display: flex; align-items: center; gap: 2rem; padding: 1rem 0; }
.donut-container { flex: 1; display: flex; justify-content: center; }
.donut-chart { width: 180px; height: 180px; border-radius: 50%; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: background 0.5s ease; }
.donut-hole { width: 125px; height: 125px; background-color: var(--bg-color); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.05); z-index: 2; }
.donut-total-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
.donut-total-value { font-size: 1.1rem; font-weight: 800; color: var(--text-color); margin-top: 0.2rem; }
.pie-legend { flex: 1.2; display: flex; flex-direction: column; gap: 0.8rem; }
.legend-item { display: flex; align-items: center; gap: 0.8rem; }
.legend-color { width: 12px; height: 12px; border-radius: 50%; }
.legend-info { flex: 1; display: flex; flex-direction: column; }
.legend-name { font-size: 0.9rem; font-weight: 600; color: var(--text-color); }
.legend-percent { font-size: 0.75rem; color: var(--text-muted); }
.legend-amount { font-weight: 700; font-size: 0.95rem; color: var(--text-color); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }

.goals-area { padding: 1.8rem; }
.goals-list { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.goal-item { background: var(--input-bg); padding: 1.2rem; border-radius: 1rem; border: 1px solid var(--glass-border); }
.goal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
.goal-name { font-weight: 700; color: var(--text-color); }
.goal-yield { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 1rem; }
.goal-yield.cdi { color: #8B5CF6; background: rgba(139, 92, 246, 0.1); }
.goal-yield.selic { color: #F59E0B; background: rgba(245, 158, 11, 0.1); }
.goal-amounts { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem; }
.goal-amounts strong { color: var(--text-color); font-size: 1.1rem; }

.indicators-area { padding: 1.8rem; }
.indicators-wrapper { display: flex; flex-direction: column; gap: 1rem; }
.indicator-box { display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; border-radius: 1rem; background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent); border: 1px solid var(--glass-border); }
.ind-label { font-size: 0.95rem; color: var(--text-muted); font-weight: 600; }
.ind-value { font-size: 1.5rem; font-weight: 800; color: #8B5CF6; }
.ind-value small { font-size: 0.8rem; }

.recent-transactions { padding: 1.8rem; }
.transaction-list { display: flex; flex-direction: column; gap: 1rem; }
.transaction-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 1rem; background: var(--input-bg); border: 1px solid transparent; transition: all 0.2s; }
.transaction-item:hover { border-color: var(--glass-border); transform: translateX(5px); }
.tx-icon { width: 45px; height: 45px; background: var(--glass-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.tx-details { flex: 1; }
.tx-desc { font-weight: 600; color: var(--text-color); margin-bottom: 0.2rem; }
.tx-date-cat { font-size: 0.8rem; color: var(--text-muted); }
.tx-amount { font-weight: 700; font-size: 1.1rem; text-align: right; display: flex; flex-direction: column; align-items: flex-end;}
.tx-amount.income { color: #10B981; }
.tx-amount.expense { color: #EF4444; }
.pending-badge { font-size: 0.65rem; background: rgba(245, 158, 11, 0.1); color: #F59E0B; padding: 0.2rem 0.4rem; border-radius: 0.5rem; margin-bottom: 0.2rem; }

@media (max-width: 1200px) { .goals-list { grid-template-columns: 1fr; } .pie-view { flex-direction: column; } .pie-legend { width: 100%; } }
@media (max-width: 1024px) { .main-grid, .secondary-grid { grid-template-columns: 1fr; } .header-actions { flex-direction: column; align-items: flex-end; } }
</style>