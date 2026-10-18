import { onBeforeUnmount, ref } from 'vue'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

// BR (F.1) Admin dashboard data: live list of all user profiles from
// Firestore. Security rules only let an Admin read other users' documents,
// so this is safe to call from the client.
export function useUsers() {
  const users = ref([])
  const loading = ref(true)
  const error = ref('')

  const unsubscribe = onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      users.value = snapshot.docs.map((doc) => {
        const data = doc.data()
        const created = data.createdAt?.toDate?.() ?? null
        return {
          id: doc.id,
          displayName: data.displayName || '',
          email: data.email || '',
          role: data.role || 'Unknown',
          createdAt: created,
          joined: created ? created.toISOString().slice(0, 10) : ''
        }
      })
      loading.value = false
    },
    (err) => {
      error.value =
        err.code === 'permission-denied'
          ? 'You do not have permission to view users.'
          : 'Could not load users. Please try again later.'
      loading.value = false
    }
  )

  onBeforeUnmount(unsubscribe)

  return { users, loading, error }
}
