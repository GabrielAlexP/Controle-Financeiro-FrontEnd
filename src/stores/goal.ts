import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useGoalStore = defineStore('goal', () => {
  const goals = ref<any[]>([])
  const isLoading = ref(false)

  const fetchGoals = async () => {
    isLoading.value = true
    try {
      const res = await api.get('/caixinhas')
      goals.value = res.data
    } finally {
      isLoading.value = false
    }
  }

  const createGoal = async (data: any) => {
    const res = await api.post('/caixinhas', data)
    goals.value.push(res.data)
  }

  const deleteGoal = async (id: number) => {
    await api.delete(`/caixinhas/${id}`)
    goals.value = goals.value.filter(g => g.id !== id)
  }

  const updateGoalAmount = async (id: number, newAmount: number) => {
    try {
      const res = await api.put(`/caixinhas/${id}`, { currentAmount: newAmount })
      const index = goals.value.findIndex(g => g.id === id)
      if (index !== -1) goals.value[index] = res.data
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        const index = goals.value.findIndex(g => g.id === id)
        if (index !== -1) {
          goals.value[index].currentAmount = newAmount
        }
      } else {
        throw err
      }
    }
  }

  return { goals, isLoading, fetchGoals, createGoal, deleteGoal, updateGoalAmount }
})