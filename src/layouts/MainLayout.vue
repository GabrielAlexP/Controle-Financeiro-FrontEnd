<script setup lang="ts">
import Sidebar from "../components/layout/Sidebar.vue";
import Header from "../components/layout/Header.vue";
</script>

<template>
  <div class="app-layout">
    <Sidebar />

    <div class="main-container">
      <Header />

      <main class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
}

.main-container {
  flex: 1;
  margin-left: 260px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.content-area {
  flex: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
