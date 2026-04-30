import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

// Lee ?commerce=xxx de la URL
function getCommerceId() {
  const p = new URLSearchParams(window.location.search)
  return p.get('commerce') || p.get('qr') || null
}

export default function MenuPage() {
  const [commerce, setCommerce] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const commerceId = getCommerceId()

  useEffect(() => {
    if (!commerceId) { setLoading(false); return }

    getDoc(doc(db, 'feka_users', commerceId))
      .then(snap => {
        if (snap.exists()) setCommerce(snap.data())
        else setError('Comercio no encontrado')
      })
      .catch(() => setError('Error al cargar el menú'))
      .finally(() => setLoading(false))
  }, [commerceId])

  if (!commerceId) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
      Escaneá el QR del comercio para ver el menú.
    </div>
  )

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
      Cargando menú...
    </div>
  )

  if (error) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#e53935' }}>
      {error}
    </div>
  )

  return (
    <div style={{ padding: '20px', fontFamily: 'var(--font)' }}>
      <h1 style={{ color: 'var(--primary)' }}>
        {commerce?.businessName || commerce?.displayName || 'Menú'}
      </h1>
      <p style={{ color: '#888', marginTop: '8px' }}>
        — Menú en construcción —
      </p>
    </div>
  )
}
