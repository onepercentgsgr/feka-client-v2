import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as fbSignOut } from 'firebase/auth'
import { auth } from '../services/firebase'

const provider = new GoogleAuthProvider()

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = cargando, null = no logueado

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null))
    return unsub
  }, [])

  async function signIn() {
    try {
      await signInWithPopup(auth, provider)
    } catch (e) {
      // Si cierra el popup, no es un error crítico
      if (e.code !== 'auth/popup-closed-by-user') throw e
    }
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  return { user, authLoading: user === undefined, signIn, signOut }
}
