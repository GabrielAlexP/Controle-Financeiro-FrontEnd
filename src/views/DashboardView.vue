<script setup lang="ts">
</script>

<template>
  <div class="dashboard-container">
    <h1 class="page-title">Resumo Financeiro</h1>

    <div class="summary-cards">
      <div class="card glass-card balance">
        <h3>Saldo Atual</h3>
        <p class="amount">R$ 0,00</p>
      </div>
      <div class="card glass-card income">
        <h3>Receitas</h3>
        <p class="amount positive">+ R$ 0,00</p>
      </div>
      <div class="card glass-card expense">
        <h3>Despesas</h3>
        <p class="amount negative">- R$ 0,00</p>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="chart-area glass-card">
        <h3>Fluxo de Caixa</h3>
        <div class="placeholder-box">
          <p>O gráfico entrará aqui no futuro</p>
        </div>
      </div>

      <div class="recent-transactions glass-card">
        <h3>Últimas Transações</h3>
        <div class="placeholder-box">
          <p>Lista resumida entrará aqui</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-title {
  font-size: 1.8rem;
  color: var(--text-color);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card h3 {
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: 500;
}

.amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
}

.amount.positive {
  color: #10B981;
}

.amount.negative {
  color: #EF4444;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.chart-area,
.recent-transactions {
  padding: 1.5rem;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.placeholder-box {
  flex: 1;
  border: 2px dashed var(--glass-border);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.02);
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>