import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: number; username: string; profilePictureUrl: string | null; isOnboarded: boolean } | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      user.value = response.data
    } catch (error) {
      user.value = null
    }
  }

  const completeOnboarding = async (data?: { accountName: string; initialBalance: number }) => {
    await api.put('/auth/onboard', data || {})
    if (user.value) {
      user.value.isOnboarded = true
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
    } finally {
      user.value = null
    }
  }

  return { user, isAuthenticated, fetchUser, completeOnboarding, logout }
})