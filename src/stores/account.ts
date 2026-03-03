import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<any[]>([])
  
  const fetchAccounts = async () => {
    const res = await api.get('/contas')
    accounts.value = res.data
  }

  const createAccount = async (data: any) => {
    const res = await api.post('/contas', data)
    accounts.value.push(res.data)
  }

  const updateAccount = async (id: number, data: any) => {
    const res = await api.put(`/contas/${id}`, data)
    const index = accounts.value.findIndex(a => a.id === id)
    if (index !== -1) accounts.value[index] = res.data
  }

  const deleteAccount = async (id: number) => {
    await api.delete(`/contas/${id}`)
    accounts.value = accounts.value.filter(a => a.id !== id)
  }

  return { accounts, fetchAccounts, createAccount, updateAccount, deleteAccount }
})