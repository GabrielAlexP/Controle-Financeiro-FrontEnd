import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useCardStore = defineStore('card', () => {
  const cards = ref<any[]>([])
  const isLoading = ref(false)

  const fetchCards = async () => {
    isLoading.value = true
    try {
      const res = await api.get('/cartoes')
      cards.value = res.data
    } finally {
      isLoading.value = false
    }
  }

  const createCard = async (data: any) => {
    const res = await api.post('/cartoes', data)
    cards.value.push(res.data)
  }

  const updateCard = async (id: number, data: any) => {
    const res = await api.put(`/cartoes/${id}`, data)
    const index = cards.value.findIndex(c => c.id === id)
    if (index !== -1) cards.value[index] = res.data
  }

  const deleteCard = async (id: number) => {
    await api.delete(`/cartoes/${id}`)
    cards.value = cards.value.filter(c => c.id !== id)
  }

  const payBill = async (cardId: number, month: string) => {
    await api.post(`/transacoes/pagar-fatura/${cardId}?month=${month}`)
  }

  return { cards, isLoading, fetchCards, createCard, updateCard, deleteCard, payBill }
})