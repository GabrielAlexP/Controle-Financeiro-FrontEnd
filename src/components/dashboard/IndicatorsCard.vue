<script setup lang="ts">
defineProps<{
  selic: number;
  cdi: number;
}>();
</script>

<template>
  <div class="indicators-area glass-card">
    <div class="section-header">
      <h3>Rendimentos</h3>
    </div>
    <div class="indicators-wrapper">
      <div class="indicator-box">
        <span class="ind-label">Selic</span>
        <span class="ind-value">{{ selic }}% <small>a.a</small></span>
      </div>
      <div class="indicator-box">
        <span class="ind-label">CDI</span>
        <span class="ind-value">{{ cdi }}% <small>a.a</small></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.indicators-area {
  padding: 1.8rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.section-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
}
.indicators-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.indicator-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent);
  border: 1px solid var(--glass-border);
  transition: transform 0.2s;
}
.indicator-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
.ind-label {
  font-size: 0.95rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.ind-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #8b5cf6;
}
.ind-value small {
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
