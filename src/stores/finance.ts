import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { useAccountStore } from './account'
import { useCategoryStore } from './category'
import { useGoalStore } from './goal'
import { useTransactionStore } from './transaction'
import { useCardStore } from './card'

export const useFinanceStore = defineStore('finance', () => {
  const accountStore = useAccountStore()
  const categoryStore = useCategoryStore()
  const goalStore = useGoalStore()
  const transactionStore = useTransactionStore()
  const cardStore = useCardStore()

  const indicators = ref({ SELIC: 0, CDI: 0, SELIC_DIARIA: 0, CDI_DIARIA: 0 })
  const isLoading = ref(false)

  const fetchAllData = async () => {
    isLoading.value = true
    try {
      await Promise.all([
        accountStore.fetchAccounts(),
        categoryStore.fetchCategories(),
        goalStore.fetchGoals(),
        transactionStore.fetchTransactions(),
        cardStore.fetchCards(),
        api.get('/indicadores').then(res => indicators.value = res.data)
      ])
    } finally {
      isLoading.value = false
    }
  }

  const totalBalance = computed(() => {
    return accountStore.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  })

  const currentMonthSummary = computed(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let income = 0
    let expense = 0

    transactionStore.transactions.forEach(tx => {
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

  const accounts = computed(() => accountStore.accounts)
  const categories = computed(() => categoryStore.categories)
  const goals = computed(() => goalStore.goals)
  const transactions = computed(() => transactionStore.transactions)

  return {
    accounts, transactions, categories, goals, indicators, isLoading,
    fetchAllData, totalBalance, currentMonthSummary
  }
})