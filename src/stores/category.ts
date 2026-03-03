import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<any[]>([])

  const fetchCategories = async () => {
    const res = await api.get('/categorias')
    categories.value = res.data
  }

  const createCategory = async (data: any) => {
    const res = await api.post('/categorias', data)
    categories.value.push(res.data)
  }

  const updateCategory = async (id: number, data: any) => {
    const res = await api.put(`/categorias/${id}`, data)
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) categories.value[index] = res.data
  }

  const deleteCategory = async (id: number) => {
    await api.delete(`/categorias/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)
  }

  return { categories, fetchCategories, createCategory, updateCategory, deleteCategory }
})