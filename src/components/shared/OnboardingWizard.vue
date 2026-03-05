<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth";
import { useFinanceStore } from "../../stores/finance";

const authStore = useAuthStore();
const financeStore = useFinanceStore();

const accountName = ref("");
const initialBalance = ref<number | null>(null);
const balanceDisplay = ref("");
const loading = ref(false);

const onBalanceInput = (e: Event) => {
    const el = e.target as HTMLInputElement;
    let val = el.value.replace(/\D/g, "");
    if (!val) {
        balanceDisplay.value = "";
        initialBalance.value = null;
        return;
    }
    const num = parseInt(val, 10) / 100;
    initialBalance.value = num;
    balanceDisplay.value = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

const submit = async () => {
    loading.value = true;
    try {
        await authStore.completeOnboarding({
            accountName: accountName.value,
            initialBalance: initialBalance.value || 0,
        });
        await financeStore.fetchAllData();
    } finally {
        loading.value = false;
    }
};

const skip = async () => {
    loading.value = true;
    try {
        await authStore.completeOnboarding();
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="wizard-overlay">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>

        <div class="wizard-card glass-card animate-fade-up">
            <div class="icon-header">🎉</div>
            <h2>Bem-vindo ao FinanceApp!</h2>
            <p class="subtitle">
                Para começarmos com o pé direito, que tal adicionar sua conta bancária principal?
            </p>

            <form @submit.prevent="submit" class="wizard-form">
                <div class="input-group">
                    <label>Nome da Conta</label>
                    <input type="text" v-model="accountName" class="styled-input"
                        placeholder="Ex: Nubank, Itaú, Carteira..." required :disabled="loading" />
                </div>

                <div class="input-group">
                    <label>Saldo Atual (R$)</label>
                    <input type="text" inputmode="numeric" :value="balanceDisplay" @input="onBalanceInput"
                        class="styled-input" placeholder="Ex: 1.500,00" required :disabled="loading" />
                </div>

                <div class="actions">
                    <button type="submit" class="btn-primary" :disabled="loading || !accountName">
                        {{ loading ? "Salvando..." : "Começar" }}
                    </button>
                    <button type="button" class="btn-outline" @click="skip" :disabled="loading">
                        Pular por enquanto
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.wizard-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--bg-color);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 1rem;
    overflow: hidden;
}

.blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 0;
}

.blob-1 {
    width: 400px;
    height: 400px;
    background: var(--blob-1);
    top: -100px;
    left: -100px;
    animation: float 8s ease-in-out infinite;
}

.blob-2 {
    width: 500px;
    height: 500px;
    background: var(--blob-2);
    bottom: -150px;
    right: -100px;
    animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0) scale(1);
    }

    50% {
        transform: translateY(30px) scale(1.1);
    }
}

.wizard-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 450px;
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-radius: 1.5rem;
}

.icon-header {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 2s infinite;
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}

h2 {
    font-size: 1.8rem;
    color: var(--text-color);
    font-weight: 800;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: var(--text-muted);
    font-size: 1rem;
    margin-bottom: 2rem;
    line-height: 1.5;
}

.wizard-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
}

.input-group label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color);
}

.styled-input {
    padding: 1rem;
    border: 1px solid var(--glass-border);
    background: var(--input-bg);
    color: var(--text-color);
    border-radius: 0.8rem;
    font-size: 1rem;
    outline: none;
    transition: all 0.3s;
}

.styled-input:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 1rem;
}

.btn-primary {
    padding: 1rem;
    border: none;
    border-radius: 0.8rem;
    background: var(--primary-gradient);
    color: white;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.2s;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-outline {
    padding: 1rem;
    border: 1px solid var(--glass-border);
    background: transparent;
    color: var(--text-muted);
    border-radius: 0.8rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-outline:hover:not(:disabled) {
    background: var(--input-bg);
    color: var(--text-color);
}

.animate-fade-up {
    animation: fadeUp 0.5s ease-out forwards;
}

@keyframes fadeUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>