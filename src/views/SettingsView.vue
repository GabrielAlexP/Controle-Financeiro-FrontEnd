<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('contas')
</script>

<template>
  <div class="settings-container">
    <div class="tabs-header glass-card">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'contas' }" 
        @click="activeTab = 'contas'"
      >
        🏦 Minhas Contas
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'categorias' }" 
        @click="activeTab = 'categorias'"
      >
        📁 Categorias
      </button>
    </div>

    <div class="tab-content glass-card">
      <div v-if="activeTab === 'contas'">
        <h2>Gerenciar Contas</h2>
        <p>Aqui faremos o CRUD (Listar, Criar, Editar, Excluir) das suas contas bancárias.</p>
        </div>

      <div v-if="activeTab === 'categorias'">
        <h2>Gerenciar Categorias</h2>
        <p>Aqui você definirá as categorias de despesas e receitas, e suas respectivas cores.</p>
        </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tabs-header {
  display: flex;
  padding: 0.5rem;
  gap: 0.5rem;
  border-radius: 1rem;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: transparent;
  border: none;
  border-radius: 0.75rem;
  color: var(--text-color);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(139, 92, 246, 0.1);
}

.tab-btn.active {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
}

.tab-content {
  padding: 2rem;
  min-height: 400px;
  border-radius: 1rem;
}
</style>