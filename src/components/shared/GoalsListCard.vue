<script setup lang="ts">
defineProps<{
  goals: any[];
  showActions?: boolean;
}>();

const emit = defineEmits(["deposit", "withdraw", "delete"]);

const calcProgress = (current: number, target: number) => {
  if (!target || target === 0) return 100;
  const percent = (current / target) * 100;
  return percent > 100 ? 100 : percent;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
};
</script>

<template>
  <div class="goals-area glass-card" :class="{ 'as-grid': showActions }">
    <div class="section-header" v-if="!showActions">
      <h3>Caixinhas</h3>
      <router-link to="/metas" class="link-view-all">Ver detalhes</router-link>
    </div>

    <div class="goals-list">
      <div
        class="goal-item"
        :class="{ 'glass-card interactive': showActions }"
        v-for="goal in goals"
        :key="goal.id"
      >
        <div class="goal-header">
          <div class="icon-title" v-if="showActions">
            <span class="icon">{{ goal.yieldType === "SELIC" ? "🏛️" : "🎯" }}</span>
            <div class="title-bank">
              <h3>{{ goal.name }}</h3>
              <span class="bank-name">{{ goal.institution || "Geral" }}</span>
            </div>
          </div>
          <span class="goal-name" v-else>🎯 {{ goal.name }}</span>

          <span
            v-if="goal.yieldType !== 'NONE'"
            class="goal-yield"
            :class="goal.yieldType.toLowerCase()"
          >
            {{
              showActions
                ? `Rende ${goal.yieldType}`
                : `+ ${formatCurrency(goal.yieldAmount)}`
            }}
          </span>
        </div>

        <p class="goal-amounts">
          <strong :class="{ 'large-amount': showActions }">{{
            formatCurrency(goal.currentAmount)
          }}</strong>
          <span v-if="goal.targetAmount">de {{ formatCurrency(goal.targetAmount) }}</span>
        </p>

        <div class="progress-container" v-if="goal.targetAmount">
          <div class="progress-track">
            <div
              class="progress-fill primary-gradient"
              :style="{
                width: calcProgress(goal.currentAmount, goal.targetAmount) + '%',
              }"
            ></div>
          </div>
          <p class="progress-text" v-if="showActions">
            {{ calcProgress(goal.currentAmount, goal.targetAmount).toFixed(1) }}%
            alcançado
          </p>
        </div>

        <div class="yield-info" v-if="showActions && goal.yieldType !== 'NONE'">
          <span>Juros acumulados:</span>
          <span class="yield-value">+ {{ formatCurrency(goal.yieldAmount) }}</span>
        </div>

        <div class="goal-actions" v-if="showActions">
          <button class="btn-action deposit" @click="emit('deposit', goal)">
            Adicionar
          </button>
          <button
            class="btn-action withdraw"
            @click="emit('withdraw', goal)"
            :disabled="goal.currentAmount <= 0"
          >
            Resgatar
          </button>
          <button
            class="btn-action delete"
            @click="emit('delete', goal.id)"
            :disabled="goal.currentAmount > 0"
            title="Excluir"
          >
            🗑️
          </button>
        </div>
      </div>

      <div v-if="goals.length === 0" class="empty-message">Sem caixinhas ativas.</div>
    </div>
  </div>
</template>

<style scoped>
.goals-area {
  padding: 1.8rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.goals-area.as-grid {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
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
.link-view-all {
  color: #8b5cf6;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}
.link-view-all:hover {
  text-decoration: underline;
}

.goals-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
.goals-area.as-grid .goals-list {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
}

.goal-item {
  background: var(--input-bg);
  padding: 1.2rem;
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.goal-item.interactive {
  padding: 1.5rem;
  transition: transform 0.2s;
}
.goal-item.interactive:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.icon-title {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.icon {
  font-size: 1.8rem;
  background: var(--input-bg);
  padding: 0.5rem;
  border-radius: 0.8rem;
  border: 1px solid var(--glass-border);
}
.title-bank {
  display: flex;
  flex-direction: column;
}
.title-bank h3 {
  font-size: 1.1rem;
  color: var(--text-color);
  font-weight: 700;
  line-height: 1.2;
}
.bank-name {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}
.goal-name {
  font-weight: 700;
  color: var(--text-color);
}

.goal-yield {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.3rem 0.6rem;
  border-radius: 1rem;
  white-space: nowrap;
  border: 1px solid;
}
.goal-yield.cdi {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}
.goal-yield.selic {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.goal-amounts {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.goal-amounts strong {
  color: var(--text-color);
  font-size: 1.1rem;
}
.goal-amounts strong.large-amount {
  font-size: 1.8rem;
  font-weight: 800;
  display: block;
  margin-top: 0.5rem;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
.primary-gradient {
  background: var(--primary-gradient);
}
.progress-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: right;
  font-weight: 600;
}

.yield-info {
  padding: 0.8rem 0;
  border-top: 1px dashed var(--glass-border);
  border-bottom: 1px dashed var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
.yield-info span {
  color: var(--text-muted);
  font-weight: 500;
}
.yield-value {
  color: #10b981 !important;
  font-weight: 700;
}

.goal-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.btn-action {
  flex: 1;
  padding: 0.6rem;
  border-radius: 0.6rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-action.deposit {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}
.btn-action.deposit:hover:not(:disabled) {
  background: #10b981;
  color: white;
}
.btn-action.withdraw {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.2);
}
.btn-action.withdraw:hover:not(:disabled) {
  background: #3b82f6;
  color: white;
}
.btn-action.delete {
  flex: 0 0 45px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
  font-size: 1rem;
}
.btn-action.delete:hover:not(:disabled) {
  background: #ef4444;
  color: white;
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
  grid-column: 1 / -1;
}
</style>
