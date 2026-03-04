import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import { useAccountStore } from './account'

export const useTransactionStore = defineStore('transaction', () => {
    const transactions = ref<any[]>([])
    const isLoading = ref(false)

    const fetchTransactions = async () => {
        isLoading.value = true
        try {
            const res = await api.get('/transacoes')
            transactions.value = res.data
        } finally {
            isLoading.value = false
        }
    }

    const createTransaction = async (data: any) => {
        await api.post('/transacoes', data)
        await fetchTransactions()
        const accountStore = useAccountStore()
        await accountStore.fetchAccounts()
    }

    const deleteTransaction = async (id: number) => {
        await api.delete(`/transacoes/${id}`)
        await fetchTransactions()
        const accountStore = useAccountStore()
        await accountStore.fetchAccounts()
    }

    return { transactions, isLoading, fetchTransactions, createTransaction, deleteTransaction }
})