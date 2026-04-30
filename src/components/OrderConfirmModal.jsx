import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { placeOrder } from '../services/orderService'
import { showToast } from './Toast'
import styles from './OrderConfirmModal.module.css'

export default function OrderConfirmModal({ commerceId, table, settings, user, onClose, onSuccess }) {
  const { items, totalPrice, clearCart } = useCart()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleConfirm() {
    if (loading) return
    setLoading(true)
    try {
      const docRef = await placeOrder({ commerceId, table, cartItems: items, notes, settings, user })
      clearCart()
      onSuccess({ orderId: docRef.id, table, total: totalPrice })
    } catch (e) {
      const msg = e.message === 'TIMEOUT'
        ? 'No llegó la respuesta. Verificá tu conexión y reintentá.'
        : 'No se pudo enviar el pedido. Intentá de nuevo.'
      showToast(msg, 'error')
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}>
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title}>Confirmá tu pedido</span>
          <button className={styles.closeBtn} onClick={onClose} disabled={loading}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Resumen de items */}
          <div className={styles.summaryBox}>
            {items.map(({ product, qty }) => (
              <div key={product.id} className={styles.summaryRow}>
                <span>{qty}× {product.name}</span>
                <span>${(product.price * qty).toLocaleString('es-AR')}</span>
              </div>
            ))}
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>${totalPrice.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Nota opcional */}
          <p className={styles.label}>Nota para la cocina (opcional)</p>
          <textarea
            className={styles.textarea}
            placeholder="Ej: sin cebolla, alergia a mariscos…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={300}
            disabled={loading}
          />

          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={loading || items.length === 0}
          >
            {loading ? 'Enviando pedido…' : '🍽️ Confirmar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
