<script setup>
import { reactive, ref } from 'vue'
import { login, register } from '../composables/useAuth.js'

const emit = defineEmits(['navigate'])

const mode = ref('login') // 'login' | 'register'

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({
  email: '',
  displayName: '',
  password: '',
  confirmPassword: '',
  role: 'Teacher'
})

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const loginError = ref('')
const registerErrors = reactive({
  email: '',
  displayName: '',
  password: '',
  confirmPassword: ''
})

async function handleLogin() {
  loginError.value = ''
  if (!loginForm.email.trim() || !loginForm.password) {
    loginError.value = 'Please enter both an email and password.'
    return
  }
  try {
    await login({ email: loginForm.email.trim(), password: loginForm.password })
    emit('navigate', 'home')
  } catch (err) {
    loginError.value = err.message
  }
}

// BR (C.4) client-side validation on the registration form: required
// fields, a well-formed email, and a password confirmation match
// check are all validated before any data is sent to the auth logic.
function validateRegister() {
  registerErrors.email = ''
  registerErrors.displayName = ''
  registerErrors.password = ''
  registerErrors.confirmPassword = ''
  let valid = true

  if (!EMAIL_PATTERN.test(registerForm.email.trim())) {
    registerErrors.email = 'Please enter a valid email address.'
    valid = false
  }
  if (!registerForm.displayName.trim()) {
    registerErrors.displayName = 'Please enter your full name.'
    valid = false
  }
  if (!registerForm.password || registerForm.password.length < 6) {
    registerErrors.password = 'Password must be at least 6 characters.'
    valid = false
  }
  if (registerForm.confirmPassword !== registerForm.password) {
    registerErrors.confirmPassword = 'Passwords do not match.'
    valid = false
  }
  return valid
}

const registerFailure = ref('')

async function handleRegister() {
  registerFailure.value = ''
  if (!validateRegister()) return

  try {
    await register({
      email: registerForm.email.trim(),
      displayName: registerForm.displayName,
      password: registerForm.password,
      role: registerForm.role
    })
    emit('navigate', 'home')
  } catch (err) {
    registerFailure.value = err.message
  }
}
</script>

<template>
  <section class="container my-5" style="max-width: 480px;">
    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <ul class="nav nav-tabs mb-4">
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: mode === 'login' }"
              href="#"
              @click.prevent="mode = 'login'"
            >
              Login
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: mode === 'register' }"
              href="#"
              @click.prevent="mode = 'register'"
            >
              Register
            </a>
          </li>
        </ul>

        <form v-if="mode === 'login'" novalidate @submit.prevent="handleLogin">
          <div class="alert alert-danger py-2" v-if="loginError">{{ loginError }}</div>
          <div class="mb-3">
            <label for="login-email" class="form-label">Email</label>
            <input
              id="login-email"
              v-model="loginForm.email"
              type="email"
              autocomplete="email"
              class="form-control"
            />
          </div>
          <div class="mb-3">
            <label for="login-password" class="form-label">Password</label>
            <input
              id="login-password"
              v-model="loginForm.password"
              type="password"
              autocomplete="current-password"
              class="form-control"
            />
          </div>
          <button type="submit" class="btn btn-gm-primary w-100">Login</button>
        </form>

        <form v-else novalidate @submit.prevent="handleRegister">
          <div class="alert alert-danger py-2" v-if="registerFailure">
            {{ registerFailure }}
          </div>

          <div class="mb-3">
            <label for="register-email" class="form-label">Email</label>
            <input
              id="register-email"
              v-model="registerForm.email"
              type="email"
              autocomplete="email"
              class="form-control"
              :class="{ 'is-invalid': registerErrors.email }"
            />
            <div class="invalid-feedback" v-if="registerErrors.email">
              {{ registerErrors.email }}
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Full name</label>
            <input
              v-model="registerForm.displayName"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': registerErrors.displayName }"
            />
            <div class="invalid-feedback" v-if="registerErrors.displayName">
              {{ registerErrors.displayName }}
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">I am a...</label>
            <select v-model="registerForm.role" class="form-select">
              <option value="Teacher">Teacher</option>
              <option value="Volunteer">Volunteer</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Password</label>
            <input
              v-model="registerForm.password"
              type="password"
              class="form-control"
              :class="{ 'is-invalid': registerErrors.password }"
            />
            <div class="invalid-feedback" v-if="registerErrors.password">
              {{ registerErrors.password }}
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Confirm password</label>
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              class="form-control"
              :class="{ 'is-invalid': registerErrors.confirmPassword }"
            />
            <div class="invalid-feedback" v-if="registerErrors.confirmPassword">
              {{ registerErrors.confirmPassword }}
            </div>
          </div>

          <button type="submit" class="btn btn-gm-primary w-100">Create account</button>
        </form>
      </div>
    </div>
  </section>
</template>
