<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  cdi: number;
  selic: number;
}>();

const selectedRateType = ref<"CDI" | "SELIC">("CDI");

const activeAnnualRate = computed(() => {
  return selectedRateType.value === "CDI" ? props.cdi : props.selic;
});

const activeMonthlyRate = computed(() => {
  return Math.pow(1 + activeAnnualRate.value / 100, 1 / 12) - 1;
});

const calcTab = ref<"time" | "futureValue" | "deposit">("time");

const calcTarget = ref<number | null>(null);
const calcDeposit = ref<number | null>(null);
const calcMonths = ref<number | null>(null);

const targetDisplay = ref("");
const depositDisplay = ref("");

const onTargetInput = (e: Event) => {
  const el = e.target as HTMLInputElement;
  let val = el.value.replace(/\D/g, "");
  if (!val) {
    targetDisplay.value = "";
    calcTarget.value = null;
    return;
  }
  const num = parseInt(val, 10) / 100;
  calcTarget.value = num;
  targetDisplay.value = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const onDepositInput = (e: Event) => {
  const el = e.target as HTMLInputElement;
  let val = el.value.replace(/\D/g, "");
  if (!val) {
    depositDisplay.value = "";
    calcDeposit.value = null;
    return;
  }
  const num = parseInt(val, 10) / 100;
  calcDeposit.value = num;
  depositDisplay.value = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const calcResult = computed(() => {
  const FV = calcTarget.value || 0;
  const PMT = calcDeposit.value || 0;
  const n = calcMonths.value || 0;
  const i = activeMonthlyRate.value;

  if (calcTab.value === "time") {
    if (FV <= 0 || PMT <= 0) return { main: "0 meses", invested: 0, yieldVal: 0 };

    const monthsExact = Math.log((FV * i) / PMT + 1) / Math.log(1 + i);
    const totalMonths = Math.ceil(monthsExact);
    const totalInvested = PMT * totalMonths;
    const totalYield = FV - totalInvested;

    return {
      main: `${totalMonths} meses`,
      invested: totalInvested,
      yieldVal: totalYield > 0 ? totalYield : 0,
    };
  } else if (calcTab.value === "futureValue") {
    if (PMT <= 0 || n <= 0) return { main: "R$ 0,00", invested: 0, yieldVal: 0 };

    const futureValue = PMT * ((Math.pow(1 + i, n) - 1) / i);
    const totalInvested = PMT * n;
    const totalYield = futureValue - totalInvested;

    return {
      main: formatCurrency(futureValue),
      invested: totalInvested,
      yieldVal: totalYield,
    };
  } else {
    if (FV <= 0 || n <= 0) return { main: "R$ 0,00 /mês", invested: 0, yieldVal: 0 };

    const depositRequired = (FV * i) / (Math.pow(1 + i, n) - 1);
    const totalInvested = depositRequired * n;
    const totalYield = FV - totalInvested;

    return {
      main: `${formatCurrency(depositRequired)} /mês`,
      invested: totalInvested,
      yieldVal: totalYield,
    };
  }
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
</script>

<template>
  <div class="calculator-section glass-card">
    <div class="calc-header">
      <div class="calc-title">
        <h2>Simulador de Juros Compostos</h2>
        <p>
          Descubra o poder do tempo no seu dinheiro com taxas reais atualizadas do Bacen
        </p>
      </div>

      <div class="rate-selector">
        <button
          :class="{ active: selectedRateType === 'CDI' }"
          @click="selectedRateType = 'CDI'"
        >
          CDI ({{ cdi }}% a.a)
        </button>
        <button
          :class="{ active: selectedRateType === 'SELIC' }"
          @click="selectedRateType = 'SELIC'"
        >
          SELIC ({{ selic }}% a.a)
        </button>
      </div>
    </div>

    <div class="calc-tabs">
      <button :class="{ active: calcTab === 'time' }" @click="calcTab = 'time'">
        Quanto Tempo?
      </button>
      <button
        :class="{ active: calcTab === 'futureValue' }"
        @click="calcTab = 'futureValue'"
      >
        Quanto Terei?
      </button>
      <button :class="{ active: calcTab === 'deposit' }" @click="calcTab = 'deposit'">
        Quanto Depositar?
      </button>
    </div>

    <div class="calc-body">
      <div class="calc-inputs">
        <div class="input-group" v-if="calcTab === 'time' || calcTab === 'deposit'">
          <label>Qual é o seu objetivo final?</label>
          <div class="input-wrapper">
            <span class="prefix">R$</span>
            <input
              type="text"
              inputmode="numeric"
              :value="targetDisplay"
              @input="onTargetInput"
              placeholder="Ex: 50.000,00"
            />
          </div>
        </div>

        <div class="input-group" v-if="calcTab === 'time' || calcTab === 'futureValue'">
          <label>Quanto você vai depositar por mês?</label>
          <div class="input-wrapper">
            <span class="prefix">R$</span>
            <input
              type="text"
              inputmode="numeric"
              :value="depositDisplay"
              @input="onDepositInput"
              placeholder="Ex: 500,00"
            />
          </div>
        </div>

        <div
          class="input-group"
          v-if="calcTab === 'futureValue' || calcTab === 'deposit'"
        >
          <label>Em quanto tempo? (Meses)</label>
          <div class="input-wrapper">
            <span class="prefix">🗓️</span>
            <input type="number" v-model="calcMonths" placeholder="Ex: 24" />
          </div>
        </div>
      </div>

      <div class="calc-result glass-card">
        <p class="result-label">
          {{
            calcTab === "time"
              ? "Tempo Necessário"
              : calcTab === "futureValue"
              ? "Patrimônio Final"
              : "Aporte Mensal"
          }}
        </p>
        <div class="result-value">
          <span class="highlight">{{ calcResult.main }}</span>
        </div>

        <div class="breakdown-grid">
          <div class="breakdown-item">
            <span class="dot invested"></span>
            <div class="b-info">
              <span class="b-label">Total Investido (Do seu bolso)</span>
              <span class="b-value">{{ formatCurrency(calcResult.invested) }}</span>
            </div>
          </div>
          <div class="breakdown-item">
            <span class="dot yield"></span>
            <div class="b-info">
              <span class="b-label">Total em Juros (Seu dinheiro trabalhando)</span>
              <span class="b-value yield-text"
                >+ {{ formatCurrency(calcResult.yieldVal) }}</span
              >
            </div>
          </div>
        </div>

        <p class="result-disclaimer">
          *Cálculo estimado em juros compostos com taxa real de {{ activeAnnualRate }}%
          a.a fixa.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calculator-section {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 1rem;
  border: 1px solid var(--glass-border);
}
.calc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.calc-title h2 {
  font-size: 1.5rem;
  color: var(--text-color);
  font-weight: 800;
}
.calc-title p {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 0.3rem;
}

.rate-selector {
  display: flex;
  background: var(--input-bg);
  border-radius: 0.8rem;
  padding: 0.3rem;
  border: 1px solid var(--glass-border);
}
.rate-selector button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.6rem 1rem;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.rate-selector button.active {
  background: var(--glass-bg);
  color: var(--text-color);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.calc-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 2px solid var(--glass-border);
  padding-bottom: 0.5rem;
  overflow-x: auto;
}
.calc-tabs button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
  white-space: nowrap;
}
.calc-tabs button.active {
  color: #8b5cf6;
}
.calc-tabs button.active::after {
  content: "";
  position: absolute;
  bottom: -7px;
  left: 0;
  width: 100%;
  height: 3px;
  background: #8b5cf6;
  border-radius: 3px 3px 0 0;
}

.calc-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}
.calc-inputs {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1rem;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}
.input-wrapper {
  display: flex;
  align-items: center;
  background: var(--input-bg);
  border: 1px solid var(--glass-border);
  border-radius: 0.8rem;
  overflow: hidden;
  transition: border-color 0.3s;
}
.input-wrapper:focus-within {
  border-color: #8b5cf6;
}
.prefix {
  padding: 0.8rem 1rem;
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-muted);
  font-weight: 600;
  border-right: 1px solid var(--glass-border);
}
.input-wrapper input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 1rem;
  outline: none;
}

.calc-result {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent);
  border: 1px solid rgba(139, 92, 246, 0.2);
}
.result-label {
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.result-value {
  margin-bottom: 2rem;
}
.highlight {
  font-size: 2.5rem;
  font-weight: 800;
  color: #8b5cf6;
}

.breakdown-grid {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-top: 1px solid var(--glass-border);
  padding-top: 1.5rem;
  margin-bottom: 1.5rem;
}
.breakdown-item {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  text-align: left;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 0.3rem;
}
.dot.invested {
  background-color: #3b82f6;
}
.dot.yield {
  background-color: #10b981;
}

.b-info {
  display: flex;
  flex-direction: column;
}
.b-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}
.b-value {
  font-size: 1.1rem;
  color: var(--text-color);
  font-weight: 700;
}
.yield-text {
  color: #10b981;
}

.result-disclaimer {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: auto;
}

@media (max-width: 900px) {
  .calc-body {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
