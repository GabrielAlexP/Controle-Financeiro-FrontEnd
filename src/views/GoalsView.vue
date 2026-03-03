<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGoalStore } from '../stores/goal'
import { useFinanceStore } from '../stores/finance'
import GoalModal from '../components/GoalModal.vue'
import GoalTransactionModal from '../components/GoalTransactionModal.vue'

const goalStore = useGoalStore()
const financeStore = useFinanceStore()

const isCreateModalOpen = ref(false)
const isTransactionModalOpen = ref(false)
const selectedGoal = ref<any>(null)
const transactionType = ref<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT')

onMounted(async () => {
  await goalStore.fetchGoals()
  if (financeStore.indicators.CDI === 0) {
    await financeStore.fetchAllData()
  }
})

const openDeposit = (goal: any) => {
  selectedGoal.value = goal
  transactionType.value = 'DEPOSIT'
  isTransactionModalOpen.value = true
}

const openWithdraw = (goal: any) => {
  selectedGoal.value = goal
  transactionType.value = 'WITHDRAW'
  isTransactionModalOpen.value = true
}

const handleDelete = async (id: number) => {
  if (confirm('Tem certeza que deseja excluir esta caixinha?')) {
    await goalStore.deleteGoal(id)
  }
}

const selectedRateType = ref<'CDI' | 'SELIC'>('CDI')

const activeAnnualRate = computed(() => {
  return selectedRateType.value === 'CDI' 
    ? financeStore.indicators.CDI 
    : financeStore.indicators.SELIC
})

const activeMonthlyRate = computed(() => {
  return (Math.pow(1 + (activeAnnualRate.value / 100), 1 / 12) - 1)
})

const calcTab = ref<'time' | 'futureValue' | 'deposit'>('time')
const calcTarget = ref<number | null>(null)
const calcDeposit = ref<number | null>(null)
const calcMonths = ref<number | null>(null)

const calcResult = computed(() => {
  const FV = calcTarget.value || 0
  const PMT = calcDeposit.value || 0
  const n = calcMonths.value || 0
  const i = activeMonthlyRate.value

  if (calcTab.value === 'time') {
    if (FV <= 0 || PMT <= 0) return { main: '0 meses', invested: 0, yieldVal: 0 }
    
    const monthsExact = Math.log((FV * i) / PMT + 1) / Math.log(1 + i)
    const totalMonths = Math.ceil(monthsExact)
    const totalInvested = PMT * totalMonths
    const totalYield = FV - totalInvested
    
    return { main: `${totalMonths} meses`, invested: totalInvested, yieldVal: totalYield > 0 ? totalYield : 0 }
  } 
  else if (calcTab.value === 'futureValue') {
    if (PMT <= 0 || n <= 0) return { main: 'R$ 0,00', invested: 0, yieldVal: 0 }
    
    const futureValue = PMT * ((Math.pow(1 + i, n) - 1) / i)
    const totalInvested = PMT * n
    const totalYield = futureValue - totalInvested

    return { main: formatCurrency(futureValue), invested: totalInvested, yieldVal: totalYield }
  } 
  else {
    if (FV <= 0 || n <= 0) return { main: 'R$ 0,00 /mês', invested: 0, yieldVal: 0 }
    
    const depositRequired = (FV * i) / (Math.pow(1 + i, n) - 1)
    const totalInvested = depositRequired * n
    const totalYield = FV - totalInvested

    return { main: `${formatCurrency(depositRequired)} /mês`, invested: totalInvested, yieldVal: totalYield }
  }
})

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const calcProgress = (current: number, target: number) => {
  if (!target || target === 0) return 100
  const percent = (current / target) * 100
  return percent > 100 ? 100 : percent
}
</script>

<template>
  <div class="goals-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Rendimentos & Metas</h1>
        <p class="subtitle">Controle suas caixinhas bancárias e títulos públicos</p>
      </div>
      <button class="btn-primary" @click="isCreateModalOpen = true">+ Novo Investimento</button>
    </div>

    <div v-if="goalStore.isLoading" class="loading-state">
      Carregando caixinhas...
    </div>

    <div v-else-if="goalStore.goals.length === 0" class="empty-state glass-card">
      <div class="empty-icon">🎯</div>
      <h2>Nenhuma caixinha criada</h2>
      <p>Organize seu dinheiro por objetivos e veja render com a taxa real do CDI ou SELIC.</p>
      <button class="btn-primary mt-3" @click="isCreateModalOpen = true">+ Criar a primeira</button>
    </div>

    <div v-else class="goals-grid">
      <div v-for="goal in goalStore.goals" :key="goal.id" class="goal-card glass-card">
        <div class="goal-header">
          <div class="icon-title">
            <span class="icon">{{ goal.yieldType === 'SELIC' ? '🏛️' : '🎯' }}</span>
            <div class="title-bank">
              <h3>{{ goal.name }}</h3>
              <span class="bank-name">{{ goal.institution || 'Geral' }}</span>
            </div>
          </div>
          <span v-if="goal.yieldType !== 'NONE'" class="rate-badge" :class="goal.yieldType.toLowerCase()">
            Rende {{ goal.yieldType }}
          </span>
        </div>
        
        <div class="goal-amounts">
          <p class="current">{{ formatCurrency(goal.currentAmount) }}</p>
          <p class="target" v-if="goal.targetAmount">de {{ formatCurrency(goal.targetAmount) }}</p>
        </div>

        <div class="progress-container" v-if="goal.targetAmount">
          <div class="progress-track">
            <div class="progress-fill primary-gradient" :style="{ width: calcProgress(goal.currentAmount, goal.targetAmount) + '%' }"></div>
          </div>
          <p class="progress-text">{{ calcProgress(goal.currentAmount, goal.targetAmount).toFixed(1) }}% alcançado</p>
        </div>

        <div class="yield-info" v-if="goal.yieldType !== 'NONE'">
          <span>Juros acumulados:</span>
          <span class="yield-value">+ {{ formatCurrency(goal.yieldAmount) }}</span>
        </div>

        <div class="goal-actions">
          <button class="btn-action deposit" @click="openDeposit(goal)">Adicionar</button>
          <button class="btn-action withdraw" @click="openWithdraw(goal)" :disabled="goal.currentAmount <= 0">Resgatar</button>
          <button class="btn-action delete" @click="handleDelete(goal.id)" :disabled="goal.currentAmount > 0" title="Só é possível excluir caixinhas zeradas">🗑️</button>
        </div>
      </div>
    </div>

    <div class="calculator-section glass-card">
      <div class="calc-header">
        <div class="calc-title">
          <h2>Simulador de Juros Compostos</h2>
          <p>Descubra o poder do tempo no seu dinheiro com taxas reais atualizadas do Bacen</p>
        </div>
        
        <div class="rate-selector">
          <button :class="{ active: selectedRateType === 'CDI' }" @click="selectedRateType = 'CDI'">
            CDI ({{ financeStore.indicators.CDI }}% a.a)
          </button>
          <button :class="{ active: selectedRateType === 'SELIC' }" @click="selectedRateType = 'SELIC'">
            SELIC ({{ financeStore.indicators.SELIC }}% a.a)
          </button>
        </div>
      </div>

      <div class="calc-tabs">
        <button :class="{ active: calcTab === 'time' }" @click="calcTab = 'time'">Quanto Tempo?</button>
        <button :class="{ active: calcTab === 'futureValue' }" @click="calcTab = 'futureValue'">Quanto Terei?</button>
        <button :class="{ active: calcTab === 'deposit' }" @click="calcTab = 'deposit'">Quanto Depositar?</button>
      </div>

      <div class="calc-body">
        <div class="calc-inputs">
          <div class="input-group" v-if="calcTab === 'time' || calcTab === 'deposit'">
            <label>Qual é o seu objetivo final?</label>
            <div class="input-wrapper">
              <span class="prefix">R$</span>
              <input type="number" v-model="calcTarget" placeholder="Ex: 50000" />
            </div>
          </div>

          <div class="input-group" v-if="calcTab === 'time' || calcTab === 'futureValue'">
            <label>Quanto você vai depositar por mês?</label>
            <div class="input-wrapper">
              <span class="prefix">R$</span>
              <input type="number" v-model="calcDeposit" placeholder="Ex: 500" />
            </div>
          </div>

          <div class="input-group" v-if="calcTab === 'futureValue' || calcTab === 'deposit'">
            <label>Em quanto tempo? (Meses)</label>
            <div class="input-wrapper">
              <span class="prefix">🗓️</span>
              <input type="number" v-model="calcMonths" placeholder="Ex: 24" />
            </div>
          </div>
        </div>

        <div class="calc-result glass-card">
          <p class="result-label">
            {{ calcTab === 'time' ? 'Tempo Necessário' : calcTab === 'futureValue' ? 'Patrimônio Final' : 'Aporte Mensal' }}
          </p>
          <div class="result-value">
            <span class="highlight">{{ calcResult.main }}</span>
          </div>

          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span class="dot invested"></span>
              <div class="b-info">
                <span class="b-label">Total Investido (Do seu bolso)</span>
                <span class="b-value">{{ formatCurrency(calcResult.invested) }}</span>
              </div>
            </div>
            <div class="breakdown-item">
              <span class="dot yield"></span>
              <div class="b-info">
                <span class="b-label">Total em Juros (Seu dinheiro trabalhando)</span>
                <span class="b-value yield-text">+ {{ formatCurrency(calcResult.yieldVal) }}</span>
              </div>
            </div>
          </div>
          
          <p class="result-disclaimer">*Cálculo estimado em juros compostos com taxa real de {{ activeAnnualRate }}% a.a fixa.</p>
        </div>
      </div>
    </div>

    <GoalModal :is-open="isCreateModalOpen" @close="isCreateModalOpen = false" />
    <GoalTransactionModal :is-open="isTransactionModalOpen" :goal="selectedGoal" :type="transactionType" @close="isTransactionModalOpen = false" />
  </div>
</template>

<style scoped>
.goals-container { display: flex; flex-direction: column; gap: 2rem; padding-bottom: 2rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; }
.page-title { font-size: 2rem; font-weight: 800; color: var(--text-color); }
.subtitle { color: var(--text-muted); font-size: 1rem; margin-top: 0.2rem; }
.btn-primary { padding: 0.8rem 1.5rem; border: none; border-radius: 0.75rem; background: var(--primary-gradient); color: white; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }

.loading-state { text-align: center; padding: 3rem; color: var(--text-muted); font-size: 1.2rem; font-weight: 600; }
.empty-state { text-align: center; padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.empty-icon { font-size: 4rem; opacity: 0.5; }
.empty-state h2 { color: var(--text-color); font-size: 1.5rem; }
.empty-state p { color: var(--text-muted); max-width: 400px; line-height: 1.5; }
.mt-3 { margin-top: 1rem; }

.goals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
.goal-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; transition: transform 0.2s; border: 1px solid var(--glass-border); }
.goal-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }

.goal-header { display: flex; justify-content: space-between; align-items: flex-start; }
.icon-title { display: flex; align-items: center; gap: 0.8rem; }
.icon { font-size: 1.8rem; background: var(--input-bg); padding: 0.5rem; border-radius: 0.8rem; border: 1px solid var(--glass-border); }
.title-bank { display: flex; flex-direction: column; }
.title-bank h3 { font-size: 1.1rem; color: var(--text-color); font-weight: 700; line-height: 1.2; }
.bank-name { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

.rate-badge { font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.6rem; border-radius: 2rem; border: 1px solid; }
.rate-badge.cdi { background: rgba(139, 92, 246, 0.1); color: #8B5CF6; border-color: rgba(139, 92, 246, 0.3); }
.rate-badge.selic { background: rgba(245, 158, 11, 0.1); color: #F59E0B; border-color: rgba(245, 158, 11, 0.3); }

.goal-amounts { display: flex; flex-direction: column; margin-top: 0.5rem; }
.current { font-size: 1.8rem; font-weight: 800; color: var(--text-color); }
.target { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }

.progress-container { display: flex; flex-direction: column; gap: 0.5rem; }
.progress-track { width: 100%; height: 8px; background: var(--input-bg); border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }
.primary-gradient { background: var(--primary-gradient); }
.progress-text { font-size: 0.8rem; color: var(--text-muted); text-align: right; font-weight: 600; }

.yield-info { padding: 0.8rem 0; border-top: 1px dashed var(--glass-border); border-bottom: 1px dashed var(--glass-border); display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
.yield-info span { color: var(--text-muted); font-weight: 500; }
.yield-value { color: #10B981 !important; font-weight: 700; }

.goal-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.btn-action { flex: 1; padding: 0.6rem; border-radius: 0.6rem; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
.btn-action:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-action.deposit { background: rgba(16, 185, 129, 0.1); color: #10B981; border-color: rgba(16, 185, 129, 0.2); }
.btn-action.deposit:hover:not(:disabled) { background: #10B981; color: white; }
.btn-action.withdraw { background: rgba(59, 130, 246, 0.1); color: #3B82F6; border-color: rgba(59, 130, 246, 0.2); }
.btn-action.withdraw:hover:not(:disabled) { background: #3B82F6; color: white; }
.btn-action.delete { flex: 0 0 45px; background: rgba(239, 68, 68, 0.1); color: #EF4444; border-color: rgba(239, 68, 68, 0.2); font-size: 1rem; }
.btn-action.delete:hover:not(:disabled) { background: #EF4444; color: white; }

.calculator-section { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; margin-top: 1rem; border: 1px solid var(--glass-border); }
.calc-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.calc-title h2 { font-size: 1.5rem; color: var(--text-color); font-weight: 800; }
.calc-title p { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.3rem; }

.rate-selector { display: flex; background: var(--input-bg); border-radius: 0.8rem; padding: 0.3rem; border: 1px solid var(--glass-border); }
.rate-selector button { flex: 1; background: transparent; border: none; padding: 0.6rem 1rem; font-weight: 600; color: var(--text-muted); border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
.rate-selector button.active { background: var(--glass-bg); color: var(--text-color); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

.calc-tabs { display: flex; gap: 1rem; border-bottom: 2px solid var(--glass-border); padding-bottom: 0.5rem; overflow-x: auto; }
.calc-tabs button { background: none; border: none; padding: 0.5rem 1rem; font-size: 1rem; font-weight: 600; color: var(--text-muted); cursor: pointer; position: relative; transition: color 0.3s; white-space: nowrap; }
.calc-tabs button.active { color: #8B5CF6; }
.calc-tabs button.active::after { content: ''; position: absolute; bottom: -7px; left: 0; width: 100%; height: 3px; background: #8B5CF6; border-radius: 3px 3px 0 0; }

.calc-body { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
.calc-inputs { display: flex; flex-direction: column; gap: 1.5rem; padding-top: 1rem; }
.input-group { display: flex; flex-direction: column; gap: 0.5rem; }
.input-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-color); }
.input-wrapper { display: flex; align-items: center; background: var(--input-bg); border: 1px solid var(--glass-border); border-radius: 0.8rem; overflow: hidden; transition: border-color 0.3s; }
.input-wrapper:focus-within { border-color: #8B5CF6; }
.prefix { padding: 0.8rem 1rem; background: rgba(0,0,0,0.05); color: var(--text-muted); font-weight: 600; border-right: 1px solid var(--glass-border); }
.input-wrapper input { flex: 1; padding: 0.8rem 1rem; border: none; background: transparent; color: var(--text-color); font-size: 1rem; outline: none; }

.calc-result { padding: 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent); border: 1px solid rgba(139, 92, 246, 0.2); }
.result-label { font-size: 1rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px; }
.result-value { margin-bottom: 2rem; }
.highlight { font-size: 2.5rem; font-weight: 800; color: #8B5CF6; }

.breakdown-grid { width: 100%; display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid var(--glass-border); padding-top: 1.5rem; margin-bottom: 1.5rem; }
.breakdown-item { display: flex; align-items: flex-start; gap: 0.8rem; text-align: left; }
.dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 0.3rem; }
.dot.invested { background-color: #3B82F6; }
.dot.yield { background-color: #10B981; }

.b-info { display: flex; flex-direction: column; }
.b-label { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
.b-value { font-size: 1.1rem; color: var(--text-color); font-weight: 700; }
.yield-text { color: #10B981; }

.result-disclaimer { font-size: 0.75rem; color: var(--text-muted); margin-top: auto; }

@media (max-width: 900px) { .calc-body { grid-template-columns: 1fr; gap: 2rem; } }
</style>