<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useAccountStore } from "../stores/account";
import { useCategoryStore } from "../stores/category";
import AccountModal from "../components/settings/AccountModal.vue";
import CategoryModal from "../components/settings/CategoryModal.vue";
import AccountItem from "../components/settings/AccountItem.vue";
import CategoryItem from "../components/settings/CategoryItem.vue";

const authStore = useAuthStore();
const accountStore = useAccountStore();
const categoryStore = useCategoryStore();

const activeTab = ref("contas");

onMounted(() => {
  accountStore.fetchAccounts();
  categoryStore.fetchCategories();
});

const isAccountModalOpen = ref(false);
const selectedAccount = ref<any>(null);

const openAccountModal = (account?: any) => {
  selectedAccount.value = account || null;
  isAccountModalOpen.value = true;
};

const confirmDeleteAccount = async (id: number) => {
  if (confirm("Tem certeza que deseja excluir esta conta?")) {
    try {
      await accountStore.deleteAccount(id);
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao excluir conta.");
    }
  }
};

const isCategoryModalOpen = ref(false);
const selectedCategory = ref<any>(null);

const openCategoryModal = (category?: any) => {
  selectedCategory.value = category || null;
  isCategoryModalOpen.value = true;
};

const confirmDeleteCategory = async (id: number) => {
  if (confirm("Tem certeza que deseja excluir esta categoria?")) {
    try {
      await categoryStore.deleteCategory(id);
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro ao excluir categoria.");
    }
  }
};
</script>

<template>
  <div class="settings-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Cadastros e Ajustes</h1>
        <p class="subtitle">Gerencie as configurações base do seu sistema</p>
      </div>
    </div>

    <div class="tabs-header glass-card">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'contas' }"
        @click="activeTab = 'contas'"
      >
        <span class="tab-icon">🏦</span> Minhas Contas
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'categorias' }"
        @click="activeTab = 'categorias'"
      >
        <span class="tab-icon">📁</span> Categorias
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'perfil' }"
        @click="activeTab = 'perfil'"
      >
        <span class="tab-icon">👤</span> Meu Perfil
      </button>
    </div>

    <div class="tab-content glass-card">
      <div v-if="activeTab === 'contas'" class="crud-section animate-fade">
        <div class="section-header">
          <h2>Contas Bancárias e Carteiras</h2>
          <button class="btn-primary" @click="openAccountModal()">+ Nova Conta</button>
        </div>

        <div v-if="accountStore.isLoading" class="loading-text">Carregando contas...</div>

        <div v-else class="crud-list">
          <AccountItem
            v-for="account in accountStore.accounts"
            :key="account.id"
            :account="account"
            @edit="openAccountModal"
            @delete="confirmDeleteAccount"
          />
          <div v-if="accountStore.accounts.length === 0" class="empty-state">
            Nenhuma conta cadastrada.
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'categorias'" class="crud-section animate-fade">
        <div class="section-header">
          <h2>Categorias de Lançamento</h2>
          <button class="btn-primary" @click="openCategoryModal()">
            + Nova Categoria
          </button>
        </div>

        <div v-if="categoryStore.isLoading" class="loading-text">
          Carregando categorias...
        </div>

        <div v-else class="crud-list grid-list">
          <CategoryItem
            v-for="cat in categoryStore.categories"
            :key="cat.id"
            :category="cat"
            @edit="openCategoryModal"
            @delete="confirmDeleteCategory"
          />
          <div
            v-if="categoryStore.categories.length === 0"
            class="empty-state"
            style="grid-column: 1 / -1"
          >
            Nenhuma categoria cadastrada.
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'perfil'" class="crud-section animate-fade">
        <div class="section-header">
          <h2>Detalhes da Conta</h2>
        </div>

        <div class="profile-layout">
          <div class="profile-avatar">
            <img
              :src="
                authStore.user?.profilePictureUrl ||
                'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
                  (authStore.user?.username || 'default')
              "
              alt="Avatar"
            />
          </div>

          <div class="profile-form">
            <div class="input-group">
              <label>Nome de Usuário</label>
              <input
                type="text"
                :value="authStore.user?.username"
                class="styled-input"
                readonly
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <AccountModal
      :is-open="isAccountModalOpen"
      :account="selectedAccount"
      @close="isAccountModalOpen = false"
    />

    <CategoryModal
      :is-open="isCategoryModalOpen"
      :category="selectedCategory"
      @close="isCategoryModalOpen = false"
    />
  </div>
</template>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

.page-header {
  margin-bottom: 0.5rem;
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

.tabs-header {
  display: flex;
  padding: 0.5rem;
  gap: 0.5rem;
  border-radius: 1rem;
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: transparent;
  border: none;
  border-radius: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab-btn:hover {
  background: var(--input-bg);
  color: var(--text-color);
}

.tab-btn.active {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.2);
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-content {
  padding: 2rem;
  min-height: 400px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 1rem;
}

.section-header h2 {
  font-size: 1.4rem;
  color: var(--text-color);
  font-weight: 700;
}

.loading-text {
  text-align: center;
  color: var(--text-muted);
  font-weight: 600;
  padding: 2rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-weight: 500;
}

.crud-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.grid-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.profile-layout {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
}

.profile-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.profile-avatar img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 4px solid var(--glass-border);
  background: var(--input-bg);
  object-fit: cover;
}

.profile-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  max-width: 400px;
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
}

.styled-input:focus {
  border-color: #8b5cf6;
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

@media (max-width: 768px) {
  .profile-layout {
    flex-direction: column;
    align-items: center;
  }
  .profile-form {
    max-width: 100%;
    width: 100%;
  }
}
</style>
