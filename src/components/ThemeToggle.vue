<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})

const toggleTheme = () => {
  const htmlElement = document.documentElement
  htmlElement.classList.toggle('dark')
  isDark.value = htmlElement.classList.contains('dark')
}
</script>

<template>
  <div class="wall-switch-plate" @click="toggleTheme" title="Acender/Apagar as luzes">
    <div class="wall-switch-button" :class="{ 'is-dark-mode': isDark }">
      <div class="switch-ridge"></div>
    </div>
  </div>
</template>

<style scoped>

.wall-switch-plate {
  width: 40px;
  height: 70px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  perspective: 200px; 
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.wall-switch-plate:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.6);
}

.wall-switch-button {
  width: 20px;
  height: 40px;
  background: linear-gradient(to bottom, #f1f5f9, #94a3b8);
  border-radius: 4px;

  box-shadow: 
    0 6px 4px -2px rgba(0, 0, 0, 0.4),
    inset 0 2px 2px rgba(255, 255, 255, 0.9),
    inset 0 -2px 2px rgba(0, 0, 0, 0.3);

  transform: rotateX(25deg);
  transform-style: preserve-3d;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  
  display: flex;
  align-items: center;
  justify-content: center;
}

.switch-ridge {
  width: 12px;
  height: 2px;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.wall-switch-button.is-dark-mode {
  background: linear-gradient(to bottom, #475569, #1e293b);
  box-shadow: 
    0 -6px 4px -2px rgba(0, 0, 0, 0.6),
    inset 0 -2px 2px rgba(255, 255, 255, 0.2),
    inset 0 2px 2px rgba(0, 0, 0, 0.5);
    
  transform: rotateX(-25deg);
}

.is-dark-mode .switch-ridge {
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>