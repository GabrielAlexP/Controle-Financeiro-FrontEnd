import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import CardsView from '../views/CardsView.vue'
import GoalsView from '../views/GoalsView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        { path: 'dashboard', name: 'dashboard', component: DashboardView },
        { path: 'transacoes', name: 'transactions', component: TransactionsView },
        { path: 'cartoes', name: 'cards', component: CardsView },
        { path: 'metas', name: 'goals', component: GoalsView },
        { path: 'cadastros', name: 'settings', component: SettingsView }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.user) {
    await authStore.fetchUser()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/')
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router