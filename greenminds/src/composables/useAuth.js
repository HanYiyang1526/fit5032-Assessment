import { ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

// BR (D.1) External authentication: Firebase Auth owns credentials and
// sessions (passwords never touch our code or localStorage). currentUser
// is shared reactive state so any component can check who is logged in.
export const currentUser = ref(null)

// False until Firebase has told us whether a session exists, so the UI
// does not flash the logged-out state on page refresh.
export const authReady = ref(false)

// BR (C.2) Role-based authentication: the role lives in Firestore at
// users/{uid}. Firestore security rules only allow 'Teacher' or
// 'Volunteer' on self-registration; 'Admin' must be granted in the console.
async function loadProfile(firebaseUser) {
  const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
  const profile = snap.exists() ? snap.data() : {}
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: profile.displayName || firebaseUser.displayName || firebaseUser.email,
    role: profile.role || null
  }
}

let listening = false

export function initAuth() {
  if (listening) return
  listening = true
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      currentUser.value = null
    } else if (!currentUser.value || currentUser.value.id !== firebaseUser.uid) {
      // During register() this fires before the profile doc exists;
      // register() sets currentUser itself once the doc is written.
      currentUser.value = await loadProfile(firebaseUser)
    }
    authReady.value = true
  })
}

const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection.'
}

function friendlyError(err) {
  return new Error(ERROR_MESSAGES[err.code] || 'Something went wrong. Please try again.')
}

export async function register({ email, password, displayName, role }) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName })
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName,
      role,
      createdAt: serverTimestamp()
    })
    currentUser.value = { id: user.uid, email, displayName, role }
    return currentUser.value
  } catch (err) {
    throw friendlyError(err)
  }
}

export async function login({ email, password }) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    currentUser.value = await loadProfile(user)
    return currentUser.value
  } catch (err) {
    throw friendlyError(err)
  }
}

export async function logout() {
  await signOut(auth)
  currentUser.value = null
}
