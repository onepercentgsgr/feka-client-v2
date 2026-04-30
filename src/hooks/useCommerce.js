import { useEffect, useState } from 'react'
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'

function getParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    commerceId: p.get('commerce') || p.get('qr') || null,
    table: p.get('table') || null,
  }
}

function applyTheme(settings) {
  const color = settings?.primaryColor || '#FF7043'
  document.documentElement.style.setProperty('--primary', color)
  const meta = document.getElementById('meta-theme-color')
  if (meta) meta.content = color
}

export function useCommerce() {
  const { commerceId, table } = getParams()
  const [settings,   setSettings]   = useState(null)
  const [categories, setCategories] = useState([])
  const [products,   setProducts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  // Commerce settings (real-time)
  useEffect(() => {
    if (!commerceId) { setLoading(false); return }

    const unsub = onSnapshot(
      doc(db, 'feka_users_public', commerceId),
      snap => {
        if (snap.exists()) {
          const data = snap.data()
          setSettings(data)
          applyTheme(data)
        } else {
          setError('Comercio no encontrado')
        }
        setLoading(false)
      },
      () => { setError('Error al conectar'); setLoading(false) }
    )
    return unsub
  }, [commerceId])

  // Categories (real-time)
  useEffect(() => {
    if (!commerceId) return
    const unsub = onSnapshot(
      query(collection(db, 'feka_users', commerceId, 'menu_categories'), orderBy('order', 'asc')),
      snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return unsub
  }, [commerceId])

  // Products (real-time)
  useEffect(() => {
    if (!commerceId) return
    const unsub = onSnapshot(
      collection(db, 'feka_users', commerceId, 'menu_products'),
      snap => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return unsub
  }, [commerceId])

  return { commerceId, table, settings, categories, products, loading, error }
}
