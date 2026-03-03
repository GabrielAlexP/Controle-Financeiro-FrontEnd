import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useFinanceStore = defineStore('finance', () => {
  const accounts = ref<any[]>([])
  const transactions = ref<any[]>([])
  const categories = ref<any[]>([])
  const goals = ref<any[]>([])
  const indicators = ref({ SELIC: 0, CDI: 0, SELIC_DIARIA: 0, CDI_DIARIA: 0 })
  const isLoading = ref(false)

  const fetchAllData = async () => {
    isLoading.value = true
    try {
      const [accRes, txRes, catRes, goalRes, indRes] = await Promise.all([
        api.get('/contas'),
        api.get('/transacoes'),
        api.get('/categorias'),
        api.get('/caixinhas'),
        api.get('/indicadores')
      ])

      accounts.value = accRes.data
      transactions.value = txRes.data
      categories.value = catRes.data
      goals.value = goalRes.data
      indicators.value = indRes.data
    } catch (error) {
      console.error("Erro ao buscar dados da API:", error)
    } finally {
      isLoading.value = false
    }
  }

  const totalBalance = computed(() => {
    return accounts.value.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  })

  const currentMonthSummary = computed(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let income = 0
    let expense = 0

    transactions.value.forEach(tx => {
      const txDate = new Date(tx.transactionDate)

      if (txDate.getMonth() === currentMonth && 
          txDate.getFullYear() === currentYear && 
          tx.isPaid) {
        
        if (tx.type === 'INCOME') income += tx.amount
        if (tx.type === 'EXPENSE') expense += tx.amount
      }
    })

    return { income, expense, netIncome: income - expense }
  })

  return { 
    accounts, transactions, categories, goals, indicators, isLoading, 
    fetchAllData, totalBalance, currentMonthSummary 
  }
})