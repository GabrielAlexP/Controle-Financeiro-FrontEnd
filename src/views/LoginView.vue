<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '../components/ThemeToggle.vue'
import api from '../services/api'

const router = useRouter()

const isLoginMode = ref(true)
const username = ref('')
const password = ref('')
const profilePic = ref('')

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    if (isLoginMode.value) {
      // 1. TENTATIVA DE LOGIN
      await api.post('/auth/login', {
        username: username.value,
        password: password.value
      })

      router.push('/dashboard')

    } else {
      await api.post('/auth/register', {
        username: username.value,
        password: password.value,
        profilePictureUrl: profilePic.value || undefined
      })

      successMessage.value = 'Conta criada com sucesso! Por favor, faça login.'
      isLoginMode.value = true
      password.value = ''
    }
  } catch (error: any) {
    if (error.response && error.response.data) {
      const data = error.response.data

      if (data.error) {
        errorMessage.value = data.error
      } else {
        errorMessage.value = Object.values(data)[0] as string
      }
    } else {
      errorMessage.value = 'Erro de conexão com o servidor.'
    }
  } finally {
    isLoading.value = false
  }
}

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  username.value = ''
  password.value = ''
  profilePic.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}
</script>

<template>
  <div class="login-container">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <div class="theme-toggle-position">
      <ThemeToggle />
    </div>

    <main class="glass-card login-box">
      <div class="header">
        <h1>FinanceApp</h1>
        <p>{{ isLoginMode ? 'Bem-vindo de volta.' : 'Comece a controlar seu dinheiro.' }}</p>
      </div>

      <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <Transition name="slide-fade" mode="out-in">
        <form v-if="isLoginMode" @submit.prevent="handleSubmit" class="login-form" key="login">
          <div class="input-group">
            <label for="username">Usuário</label>
            <input type="text" id="username" v-model="username" placeholder="Digite seu usuário" required
              :disabled="isLoading" />
          </div>

          <div class="input-group">
            <label for="password">Senha</label>
            <input type="password" id="password" v-model="password" placeholder="Sua senha" required
              :disabled="isLoading" />
          </div>

          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Processando...' : 'Entrar' }}
          </button>

          <p class="toggle-text">
            Ainda não tem uma conta?
            <span @click="!isLoading && toggleMode()" class="link" :class="{ disabled: isLoading }">Registre-se</span>
          </p>
        </form>

        <form v-else @submit.prevent="handleSubmit" class="login-form" key="register">
          <div class="input-group">
            <label for="reg-username">Novo Usuário</label>
            <input type="text" id="reg-username" v-model="username" placeholder="Escolha um nome de usuário" required
              :disabled="isLoading" />
          </div>

          <div class="input-group">
            <label for="reg-password">Criar Senha</label>
            <input type="password" id="reg-password" v-model="password" placeholder="Crie uma senha forte" required
              :disabled="isLoading" />
          </div>

          <div class="input-group">
            <label for="profile-pic">Foto de Perfil (Opcional)</label>
            <input type="url" id="profile-pic" v-model="profilePic" placeholder="URL da sua foto"
              :disabled="isLoading" />
          </div>

          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Criando Conta...' : 'Criar Conta' }}
          </button>

          <p class="toggle-text">
            Já possui uma conta?
            <span @click="!isLoading && toggleMode()" class="link" :class="{ disabled: isLoading }">Faça Login</span>
          </p>
        </form>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.theme-toggle-position {
  position: absolute;
  top: 2.5rem;
  right: 2.5rem;
  z-index: 10;
}

.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
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

.login-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 3rem 2rem;
  margin: 1rem;
}

.header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.input-group input {
  padding: 0.8rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--glass-border);
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.input-group input:focus {
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.btn-primary {
  margin-top: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 0.75rem;
  background: var(--primary-gradient);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.toggle-text {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

.toggle-text .link {
  color: #8B5CF6;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.toggle-text .link:hover:not(.disabled) {
  color: #3B82F6;
  text-decoration: underline;
}

.toggle-text .link.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.alert {
  padding: 0.8rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  text-align: center;
  animation: fadeIn 0.3s ease-in;
}

.alert-error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.alert-success {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10B981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>