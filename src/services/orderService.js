import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { signInAnonymously } from 'firebase/auth'
import { db, auth } from './firebase'

/**
 * Convierte los items del CartContext al formato que espera Firestore/Admin.
 * cartItems: [{ product: { id, name, price, description }, qty }]
 */
function buildItems(cartItems) {
  return cartItems.map(({ product, qty }) => ({
    productId: product.id || '',
    name: product.name || '',
    price: product.price || 0,
    qty,
    description: product.description || '',
    basePrice: product.price || 0,
  }))
}

/**
 * Graba un pedido en feka_users/{commerceId}/orders
 * Devuelve el docRef con el id del pedido.
 */
export async function placeOrder({ commerceId, table, cartItems, notes, settings, user }) {
  const items = buildItems(cartItems)
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  if (total <= 0) throw new Error('El carrito está vacío')

  // Comisión FEKA (inclusiva, misma lógica que el original)
  const rate = settings?.commissionRate ?? 1
  const commission = Math.round((total / (1 + rate / 100)) * (rate / 100))

  // Si no hay sesión activa, autenticamos anónimamente (Firestore requiere auth para crear pedidos)
  let activeUser = user || auth.currentUser
  if (!activeUser) {
    const cred = await signInAnonymously(auth)
    activeUser = cred.user
  }

  const userId   = activeUser ? activeUser.uid  : _guestId()
  const userName = (user && user.displayName) ? user.displayName : 'Invitado'

  const payload = {
    ...(table ? { table } : {}),
    items,
    total,
    commission,
    fekaCommissionAmount: commission,
    fekaCommissionRate: rate,
    status: 'requested',
    paymentStatus: 'awaiting_payment',
    commissionStatus: 'pending',
    clientId: userId,
    clientName: userName,
    notes: notes || '',
    createdAt: serverTimestamp(),
  }

  // Timeout de 15 segundos
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), 15000)
  )

  const docRef = await Promise.race([
    addDoc(collection(db, 'feka_users', commerceId, 'orders'), payload),
    timeout,
  ])

  // Guardar en localStorage para tracking
  try {
    const stored = JSON.parse(localStorage.getItem('feka_active_orders') || '[]')
    stored.push({ id: docRef.id, commerceId, date: Date.now() })
    localStorage.setItem('feka_active_orders', JSON.stringify(stored))
  } catch (_) {}

  // Tracking cross-device si está logueado
  if (user) {
    updateDoc(doc(db, 'feka_clients', user.uid), {
      merchants: arrayUnion(commerceId),
      lastOrderAt: new Date().toISOString(),
    }).catch(() => {})
  }

  return docRef
}

// ID de sesión anónima persistente (igual al original)
let _cachedGuestId = null
function _guestId() {
  if (_cachedGuestId) return _cachedGuestId
  try {
    let id = localStorage.getItem('feka_guest_id')
    if (!id) {
      id = 'guest_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('feka_guest_id', id)
    }
    _cachedGuestId = id
    return id
  } catch (_) {
    return 'guest_anon'
  }
}
