<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useGoalStore } from "../stores/goal";
import { useFinanceStore } from "../stores/finance";

import GoalModal from "../components/goals/GoalModal.vue";
import GoalTransactionModal from "../components/goals/GoalTransactionModal.vue";
import GoalsListCard from "../components/shared/GoalsListCard.vue";
import CompoundInterestCalculator from "../components/goals/CompoundInterestCalculator.vue";

const goalStore = useGoalStore();
const financeStore = useFinanceStore();

const isCreateModalOpen = ref(false);
const isTransactionModalOpen = ref(false);
const selectedGoal = ref<any>(null);
const transactionType = ref<"DEPOSIT" | "WITHDRAW">("DEPOSIT");

onMounted(async () => {
  await goalStore.fetchGoals();
  if (financeStore.indicators.CDI === 0) {
    await financeStore.fetchAllData();
  }
});

const openDeposit = (goal: any) => {
  selectedGoal.value = goal;
  transactionType.value = "DEPOSIT";
  isTransactionModalOpen.value = true;
};

const openWithdraw = (goal: any) => {
  selectedGoal.value = goal;
  transactionType.value = "WITHDRAW";
  isTransactionModalOpen.value = true;
};

const handleDelete = async (id: number) => {
  if (confirm("Tem certeza que deseja excluir esta caixinha?")) {
    await goalStore.deleteGoal(id);
  }
};
</script>

<template>
  <div class="goals-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Rendimentos & Metas</h1>
        <p class="subtitle">Controle suas caixinhas bancárias e títulos públicos</p>
      </div>
      <button class="btn-primary" @click="isCreateModalOpen = true">
        + Novo Investimento
      </button>
    </div>

    <div v-if="goalStore.isLoading" class="loading-state">Carregando caixinhas...</div>

    <div v-else-if="goalStore.goals.length === 0" class="empty-state glass-card">
      <div class="empty-icon">🎯</div>
      <h2>Nenhuma caixinha criada</h2>
      <p>
        Organize seu dinheiro por objetivos e veja render com a taxa real do CDI ou SELIC.
      </p>
      <button class="btn-primary mt-3" @click="isCreateModalOpen = true">
        + Criar a primeira
      </button>
    </div>

    <GoalsListCard
      v-else
      :goals="goalStore.goals"
      :show-actions="true"
      @deposit="openDeposit"
      @withdraw="openWithdraw"
      @delete="handleDelete"
    />

    <CompoundInterestCalculator
      :cdi="financeStore.indicators.CDI"
      :selic="financeStore.indicators.SELIC"
    />

    <GoalModal :is-open="isCreateModalOpen" @close="isCreateModalOpen = false" />

    <GoalTransactionModal
      :is-open="isTransactionModalOpen"
      :goal="selectedGoal"
      :type="transactionType"
      @close="isTransactionModalOpen = false"
    />
  </div>
</template>

<style scoped>
.goals-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-color);
}
.subtitle {
  color: var(--text-muted);
  font-size: 1rem;
  margin-top: 0.2rem;
}
.btn-primary {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  background: var(--primary-gradient);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  font-size: 1.2rem;
  font-weight: 600;
}
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}
.empty-state h2 {
  color: var(--text-color);
  font-size: 1.5rem;
}
.empty-state p {
  color: var(--text-muted);
  max-width: 400px;
  line-height: 1.5;
}
.mt-3 {
  margin-top: 1rem;
}
</style>
