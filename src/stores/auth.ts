import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: number; username: string; profilePictureUrl: string | null } | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      user.value = response.data
    } catch (error) {
      user.value = null
    }
  }

  const clearUser = () => {
    user.value = null
  }

  return { user, isAuthenticated, fetchUser, clearUser }
})