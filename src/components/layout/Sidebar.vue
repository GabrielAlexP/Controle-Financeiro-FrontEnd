<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: "📊" },
  { name: "Transações", path: "/transacoes", icon: "💸" },
  { name: "Cartões", path: "/cartoes", icon: "💳" },
  { name: "Caixinhas & CDI", path: "/metas", icon: "🎯" },
  { name: "Cadastros", path: "/cadastros", icon: "⚙️" },
];

const handleLogout = async () => {
  await authStore.logout();
  window.location.href = "/";
};
</script>

<template>
  <aside class="sidebar glass-card">
    <div class="logo-container">
      <h2>FinanceApp</h2>
    </div>

    <nav class="nav-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path.startsWith(item.path) }"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="text">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button @click="handleLogout" class="logout-btn">
        <span class="icon">🚪</span> Sair
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  border-right: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.logo-container {
  padding: 2rem 1.5rem;
  text-align: center;
}

.logo-container h2 {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}

.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 0.5rem;
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.nav-item.active {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
}

.sidebar-footer {
  padding: 1.5rem 1rem;
  border-top: 1px solid var(--glass-border);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  background: transparent;
  border: none;
  color: #ef4444;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}
</style>
