<script setup lang="ts">
</script>

<template>
    <div class="transactions-container">
        <div class="page-header">
            <h1 class="page-title">Transações</h1>
            <button class="btn-primary new-transaction-btn">
                + Nova Transação
            </button>
        </div>

        <div class="filters-bar glass-card">
            <div class="filter-group">
                <label>Mês</label>
                <select class="placeholder-input">
                    <option>Março / 2026</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Tipo</label>
                <select class="placeholder-input">
                    <option>Todos</option>
                </select>
            </div>
            <div class="filter-group search">
                <label>Buscar</label>
                <input type="text" placeholder="Nome da transação..." class="placeholder-input" />
            </div>
        </div>

        <div class="table-container glass-card">
            <div class="placeholder-box">
                <p>A tabela de transações com paginação entrará aqui</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.transactions-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-title {
    font-size: 1.8rem;
    color: var(--text-color);
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
}

.filters-bar {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-group.search {
    flex: 1;
    min-width: 200px;
}

.filter-group label {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 500;
}

.placeholder-input {
    padding: 0.7rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--glass-border);
    background: var(--input-bg);
    color: var(--text-color);
    outline: none;
}

.table-container {
    padding: 1.5rem;
    min-height: 400px;
    display: flex;
    flex-direction: column;
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
</style>