import { ref } from 'vue'
import seedUsers from '../data/users.json'
import { hashPassword } from '../utils/security.js'

const USERS_KEY = 'gm_users'
const SESSION_KEY = 'gm_current_user'

// BR (C.1) Authentication: currentUser is shared reactive state so any
// component can check who (if anyone) is logged in.
export const currentUser = ref(null)

function loadUsers() {
  const stored = localStorage.getItem(USERS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      return []
    }
  }
  return null
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Seed the user store the first time the app runs. Seed passwords are
// hashed immediately (BR C.4) rather than ever being written to
// localStorage in plain text.
async function ensureSeeded() {
  const existing = loadUsers()
  if (existing) return existing

  const seeded = []
  for (const u of seedUsers) {
    const passwordHash = await hashPassword(u.seedPassword)
    seeded.push({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      passwordHash
    })
  }
  saveUsers(seeded)
  return seeded
}

export function restoreSession() {
  const stored = localStorage.getItem(SESSION_KEY)
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored)
    } catch (e) {
      currentUser.value = null
    }
  }
}

// BR (C.2) Role-based authentication: role is stored per-user and
// returned as part of the session, so components can branch on
// currentUser.value.role (e.g. 'Teacher' vs 'Volunteer').
export async function register({ username, password, displayName, role }) {
  const users = await ensureSeeded()

  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('That username is already taken.')
  }

  const passwordHash = await hashPassword(password)
  const newUser = {
    id: Date.now(),
    username,
    displayName,
    role,
    passwordHash
  }
  users.push(newUser)
  saveUsers(users)

  const { passwordHash: _omit, ...publicUser } = newUser
  currentUser.value = publicUser
  localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser))
  return publicUser
}

export async function login({ username, password }) {
  const users = await ensureSeeded()
  const passwordHash = await hashPassword(password)

  const match = users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.passwordHash === passwordHash
  )

  if (!match) {
    throw new Error('Incorrect username or password.')
  }

  const { passwordHash: _omit, ...publicUser } = match
  currentUser.value = publicUser
  localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser))
  return publicUser
}

export function logout() {
  currentUser.value = null
  localStorage.removeItem(SESSION_KEY)
}
