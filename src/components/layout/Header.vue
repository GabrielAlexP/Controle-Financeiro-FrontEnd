<script setup lang="ts">
import { useAuthStore } from "../../stores/auth";
import ThemeToggle from "../shared/ThemeToggle.vue";

const authStore = useAuthStore();
</script>

<template>
  <header class="top-header glass-card">
    <div class="welcome-message">
      <h2>Olá, {{ authStore.user?.username || "Usuário" }}!</h2>
      <p>Acompanhe suas finanças hoje.</p>
    </div>

    <div class="header-actions">
      <ThemeToggle />

      <div class="user-profile">
        <img
          :src="
            authStore.user?.profilePictureUrl ||
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
              (authStore.user?.username || 'default')
          "
          alt="Foto de perfil"
          class="avatar"
        />
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  margin-bottom: 2rem;
  border-radius: 1rem;
}

.welcome-message h2 {
  font-size: 1.5rem;
  margin-bottom: 0.2rem;
  color: var(--text-color);
}

.welcome-message p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: 2px solid #8b5cf6;
  object-fit: cover;
}
</style>
