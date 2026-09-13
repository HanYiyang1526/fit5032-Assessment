<script setup>
import { reactive, ref } from 'vue'
import { login, register } from '../composables/useAuth.js'

const emit = defineEmits(['navigate'])

const mode = ref('login') // 'login' | 'register'

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({
  username: '',
  displayName: '',
  password: '',
  confirmPassword: '',
  role: 'Teacher'
})

const loginError = ref('')
const registerErrors = reactive({
  username: '',
  displayName: '',
  password: '',
  confirmPassword: ''
})

async function handleLogin() {
  loginError.value = ''
  if (!loginForm.username.trim() || !loginForm.password) {
    loginError.value = 'Please enter both a username and password.'
    return
  }
  try {
    await login({ username: loginForm.username, password: loginForm.password })
    emit('navigate', 'home')
  } catch (err) {
    loginError.value = err.message
  }
}

// BR (C.4) client-side validation on the registration form: required
// fields, a minimum username length, and a password confirmation match
// check are all validated before any data is sent to the auth logic.
function validateRegister() {
  registerErrors.username = ''
  registerErrors.displayName = ''
  registerErrors.password = ''
  registerErrors.confirmPassword = ''
  let valid = true

  if (!registerForm.username.trim() || registerForm.username.trim().length < 4) {
    registerErrors.username = 'Username must be at least 4 characters.'
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
      username: registerForm.username,
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
            <label class="form-label">Username</label>
            <input v-model="loginForm.username" type="text" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input v-model="loginForm.password" type="password" class="form-control" />
          </div>
          <button type="submit" class="btn btn-gm-primary w-100">Login</button>
          <p class="text-muted small mt-3 mb-0">
            Demo accounts: <code>sarah.teacher / Teacher123</code> (Teacher)
            or <code>priya.volunteer / Volunteer123</code> (Volunteer)
          </p>
        </form>

        <form v-else novalidate @submit.prevent="handleRegister">
          <div class="alert alert-danger py-2" v-if="registerFailure">
            {{ registerFailure }}
          </div>

          <div class="mb-3">
            <label class="form-label">Username</label>
            <input
              v-model="registerForm.username"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': registerErrors.username }"
            />
            <div class="invalid-feedback" v-if="registerErrors.username">
              {{ registerErrors.username }}
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
