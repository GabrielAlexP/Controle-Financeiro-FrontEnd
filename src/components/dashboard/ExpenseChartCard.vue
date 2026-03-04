<script setup lang="ts">
import { ref, computed } from "vue";
import { useFinanceStore } from "../../stores/finance";

const props = defineProps<{
  expenses: any[];
  totalExpense: number;
}>();

const financeStore = useFinanceStore();
const chartViewType = ref<"bars" | "pie">("bars");

const pieChartStyle = computed(() => {
  let gradientStrings: string[] = [];
  let currentStart = 0;

  if (props.expenses.length === 0) {
    return { background: "conic-gradient(#e2e8f0 0% 100%)" };
  }

  for (const cat of props.expenses) {
    const end = currentStart + cat.percent;
    gradientStrings.push(`${cat.color} ${currentStart}% ${end}%`);
    currentStart = end;
  }

  return { background: `conic-gradient(${gradientStrings.join(", ")})` };
});

const getCategoryIcon = (categoryId: number) => {
  const cat = financeStore.categories.find((c) => c.id === categoryId);
  return cat ? cat.icon : "📌";
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
};
</script>

<template>
  <div class="category-chart glass-card">
    <div class="section-header">
      <div>
        <h3>Onde seu dinheiro foi</h3>
      </div>
      <div class="chart-toggle glass-card">
        <button
          :class="{ active: chartViewType === 'bars' }"
          @click="chartViewType = 'bars'"
        >
          📊
        </button>
        <button
          :class="{ active: chartViewType === 'pie' }"
          @click="chartViewType = 'pie'"
        >
          🍩
        </button>
      </div>
    </div>

    <div v-if="expenses.length === 0" class="empty-message">
      Nenhuma despesa neste mês.
    </div>

    <Transition name="fade" mode="out-in" v-else>
      <div v-if="chartViewType === 'bars'" class="category-list" key="bars">
        <div class="cat-item" v-for="cat in expenses" :key="cat.id">
          <div class="cat-header">
            <span class="cat-name">{{ getCategoryIcon(cat.id) }} {{ cat.name }}</span>
            <span class="cat-amount"
              >{{ formatCurrency(cat.amount) }} <small>({{ cat.percent }}%)</small></span
            >
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: cat.percent + '%', backgroundColor: cat.color }"
            ></div>
          </div>
        </div>
      </div>

      <div v-else class="pie-view" key="pie">
        <div class="donut-container">
          <div class="donut-chart" :style="pieChartStyle">
            <div class="donut-hole">
              <span class="donut-total-label">Total</span>
              <span class="donut-total-value">{{ formatCurrency(totalExpense) }}</span>
            </div>
          </div>
        </div>
        <div class="pie-legend">
          <div class="legend-item" v-for="cat in expenses" :key="cat.id">
            <div class="legend-color" :style="{ backgroundColor: cat.color }"></div>
            <div class="legend-info">
              <span class="legend-name">{{ cat.name }}</span>
              <span class="legend-percent">{{ cat.percent }}%</span>
            </div>
            <span class="legend-amount">{{ formatCurrency(cat.amount) }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.category-chart {
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
.empty-message {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-weight: 500;
  background: var(--input-bg);
  border-radius: 1rem;
  border: 1px dashed var(--glass-border);
  margin: auto 0;
}
.chart-toggle {
  display: flex;
  padding: 0.2rem;
  border-radius: 0.5rem;
  gap: 0.2rem;
}
.chart-toggle button {
  background: transparent;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 0.4rem;
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.5;
  transition: all 0.2s;
}
.chart-toggle button:hover {
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.1);
}
.chart-toggle button.active {
  opacity: 1;
  background: var(--input-bg);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.category-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.cat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
}
.cat-amount small {
  color: var(--text-muted);
  font-weight: 500;
}
.progress-track {
  width: 100%;
  height: 8px;
  background: var(--input-bg);
  border-radius: 10px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 1s ease-out;
}
.pie-view {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 0;
  margin: auto 0;
}
.donut-container {
  flex: 1;
  display: flex;
  justify-content: center;
}
.donut-chart {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: background 0.5s ease;
}
.donut-hole {
  width: 125px;
  height: 125px;
  background-color: var(--bg-color);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 2;
}
.donut-total-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
}
.donut-total-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-color);
  margin-top: 0.2rem;
}
.pie-legend {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.legend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.legend-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}
.legend-percent {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.legend-amount {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-color);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
@media (max-width: 1200px) {
  .pie-view {
    flex-direction: column;
  }
  .pie-legend {
    width: 100%;
  }
}
</style>
