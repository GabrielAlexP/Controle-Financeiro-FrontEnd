<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { useAccountStore } from '../stores/account'
import { useCategoryStore } from '../stores/category'
import { useCardStore } from '../stores/card'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['close'])

const transactionStore = useTransactionStore()
const accountStore = useAccountStore()
const categoryStore = useCategoryStore()
const cardStore = useCardStore()

const getLocalDateString = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const form = ref({
    type: 'EXPENSE',
    amount: null as number | null,
    description: '',
    categoryId: null as number | null,
    accountId: null as number | null,
    paymentMethod: 'ACCOUNT',
    creditCardId: null as number | null,
    transactionDate: getLocalDateString(),
    isPaid: true,
    isFixed: false,
    isInstallment: false,
    installments: 2
})

const errorMsg = ref('')
const loading = ref(false)

onMounted(async () => {
    if (cardStore.cards.length === 0) {
        await cardStore.fetchCards()
    }
})

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        errorMsg.value = ''
        form.value = {
            type: 'EXPENSE',
            amount: null,
            description: '',
            categoryId: categoryStore.categories.length > 0 ? categoryStore.categories[0].id : null,
            accountId: accountStore.accounts.length > 0 ? accountStore.accounts[0].id : null,
            paymentMethod: 'ACCOUNT',
            creditCardId: cardStore.cards.length > 0 ? cardStore.cards[0].id : null,
            transactionDate: getLocalDateString(),
            isPaid: true,
            isFixed: false,
            isInstallment: false,
            installments: 2
        }
    }
})

watch(() => form.value.paymentMethod, (newMethod) => {
    if (newMethod === 'CREDIT_CARD' && form.value.creditCardId) {
        const selectedCard = cardStore.cards.find(c => c.id === form.value.creditCardId)
        if (selectedCard) {
            form.value.accountId = selectedCard.accountId
        }
    }
})

watch(() => form.value.creditCardId, (newCardId) => {
    if (form.value.paymentMethod === 'CREDIT_CARD' && newCardId) {
        const selectedCard = cardStore.cards.find(c => c.id === newCardId)
        if (selectedCard) {
            form.value.accountId = selectedCard.accountId
        }
    }
})

const filteredCategories = computed(() => {
    return categoryStore.categories.filter(c => c.type === form.value.type)
})

const handleSubmit = async () => {
    errorMsg.value = ''
    loading.value = true
    try {
        const payload = {
            accountId: form.value.accountId,
            creditCardId: form.value.type === 'EXPENSE' && form.value.paymentMethod === 'CREDIT_CARD' ? form.value.creditCardId : null,
            categoryId: form.value.categoryId,
            amount: form.value.amount,
            type: form.value.type,
            description: form.value.description,
            transactionDate: form.value.transactionDate,
            isPaid: form.value.isPaid,
            isFixed: form.value.isFixed,
            installments: form.value.isInstallment ? form.value.installments : 1
        }

        await transactionStore.createTransaction(payload)
        emit('close')
    } catch (error: any) {
        if (error.response && error.response.data) {
            errorMsg.value = error.response.data.error || Object.values(error.response.data)[0] as string || 'Erro ao salvar.'
        } else {
            errorMsg.value = 'Erro de conexão.'
        }
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-content glass-card animate-fade">
            <h2>Nova Transação</h2>

            <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

            <div class="type-selector">
                <button class="type-btn" :class="{ active: form.type === 'EXPENSE' }"
                    @click="form.type = 'EXPENSE'">Despesa</button>
                <button class="type-btn" :class="{ active: form.type === 'INCOME' }"
                    @click="form.type = 'INCOME'">Receita</button>
            </div>

            <form @submit.prevent="handleSubmit" class="modal-form">
                <div class="grid-2-cols">
                    <div class="input-group">
                        <label>Valor (R$)</label>
                        <input type="number" step="0.01" v-model="form.amount" required class="styled-input"
                            :disabled="loading" />
                    </div>
                    <div class="input-group">
                        <label>Data</label>
                        <input type="date" v-model="form.transactionDate" required class="styled-input"
                            :disabled="loading" />
                    </div>
                </div>

                <div class="input-group">
                    <label>Descrição</label>
                    <input type="text" v-model="form.description" class="styled-input"
                        placeholder="Ex: Mercado, Uber..." :disabled="loading" />
                </div>

                <div class="input-group">
                    <label>Categoria</label>
                    <select v-model="form.categoryId" required class="styled-input" :disabled="loading">
                        <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                            {{ cat.icon }} {{ cat.name }}
                        </option>
                    </select>
                </div>

                <div class="input-group" v-if="form.type === 'EXPENSE'">
                    <label>Forma de Pagamento</label>
                    <div class="payment-methods">
                        <label class="radio-label">
                            <input type="radio" value="ACCOUNT" v-model="form.paymentMethod" :disabled="loading" />
                            Saldo em Conta
                        </label>
                        <label class="radio-label" v-if="cardStore.cards.length > 0">
                            <input type="radio" value="CREDIT_CARD" v-model="form.paymentMethod" :disabled="loading" />
                            Cartão de Crédito
                        </label>
                    </div>
                </div>

                <div class="input-group" v-if="form.type === 'EXPENSE' && form.paymentMethod === 'CREDIT_CARD'">
                    <label>Selecione o Cartão</label>
                    <select v-model="form.creditCardId" required class="styled-input" :disabled="loading">
                        <option v-for="card in cardStore.cards" :key="card.id" :value="card.id">
                            💳 {{ card.name }}
                        </option>
                    </select>
                </div>

                <div class="input-group" v-if="form.paymentMethod === 'ACCOUNT' || form.type === 'INCOME'">
                    <label>Conta Vinculada</label>
                    <select v-model="form.accountId" required class="styled-input" :disabled="loading">
                        <option v-for="acc in accountStore.accounts" :key="acc.id" :value="acc.id">
                            🏦 {{ acc.name }}
                        </option>
                    </select>
                </div>

                <div class="checkbox-group mt-2">
                    <label class="check-label">
                        <input type="checkbox" v-model="form.isPaid" :disabled="loading" />
                        <span class="checkmark"></span>
                        Já foi pago?
                    </label>

                    <label class="check-label" v-if="form.type === 'EXPENSE'">
                        <input type="checkbox" v-model="form.isFixed" :disabled="loading" />
                        <span class="checkmark"></span>
                        É uma despesa fixa mensal?
                    </label>

                    <label class="check-label" v-if="form.type === 'EXPENSE'">
                        <input type="checkbox" v-model="form.isInstallment" :disabled="loading" />
                        <span class="checkmark"></span>
                        Repetir lançamento (Parcelado / Meses)?
                    </label>
                </div>

                <div class="input-group" v-if="form.isInstallment">
                    <label>Quantidade de Meses/Parcelas</label>
                    <input type="number" min="2" max="48" v-model="form.installments" required class="styled-input"
                        :disabled="loading" />
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-outline" @click="emit('close')"
                        :disabled="loading">Cancelar</button>
                    <button type="submit" class="btn-primary"
                        :disabled="loading || !form.categoryId || !form.accountId">
                        {{ loading ? 'Processando...' : 'Lançar' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
}

.modal-content {
    background: var(--glass-bg);
    padding: 2rem;
    border-radius: 1.5rem;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--glass-border);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-content h2 {
    margin-bottom: 1rem;
    color: var(--text-color);
    font-size: 1.5rem;
}

.type-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: var(--input-bg);
    padding: 0.3rem;
    border-radius: 0.8rem;
}

.type-btn {
    flex: 1;
    padding: 0.6rem;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-weight: 600;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.type-btn.active {
    background: var(--glass-bg);
    color: var(--text-color);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.modal-form {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
}

.grid-2-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
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

.styled-input {
    padding: 0.8rem 1rem;
    border: 1px solid var(--glass-border);
    background: var(--input-bg);
    color: var(--text-color);
    border-radius: 0.75rem;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
}

.styled-input:focus {
    border-color: #8B5CF6;
}

.payment-methods {
    display: flex;
    gap: 1.5rem;
    padding: 0.5rem 0;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-color);
    font-weight: 500;
    cursor: pointer;
    font-size: 0.95rem;
}

.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    background: var(--input-bg);
    padding: 1rem;
    border-radius: 0.8rem;
    border: 1px solid var(--glass-border);
}

.check-label {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--text-color);
    font-weight: 500;
    cursor: pointer;
    font-size: 0.95rem;
    position: relative;
}

.check-label input {
    opacity: 0;
    position: absolute;
    cursor: pointer;
}

.checkmark {
    height: 20px;
    width: 20px;
    background-color: var(--glass-bg);
    border: 2px solid var(--glass-border);
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.check-label:hover input~.checkmark {
    border-color: #8B5CF6;
}

.check-label input:checked~.checkmark {
    background-color: #8B5CF6;
    border-color: #8B5CF6;
}

.check-label input:checked~.checkmark:after {
    content: '';
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    display: block;
    margin-bottom: 2px;
}

.mt-2 {
    margin-top: 0.5rem;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
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

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-outline {
    padding: 0.8rem 1.5rem;
    border: 1px solid var(--glass-border);
    background: transparent;
    color: var(--text-color);
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-outline:hover:not(:disabled) {
    background: var(--input-bg);
}

.btn-outline:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.alert-error {
    background-color: rgba(239, 68, 68, 0.1);
    color: #EF4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 0.8rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 1rem;
    text-align: center;
}

.animate-fade {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>