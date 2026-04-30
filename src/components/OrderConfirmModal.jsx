import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { placeOrder } from '../services/orderService'
import { showToast } from './Toast'
import styles from './OrderConfirmModal.module.css'

export default function OrderConfirmModal({ commerceId, table, settings, user, onClose, onSuccess, onPayNow }) {
  const { items, totalPrice, clearCart } = useCart()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [payNowLoading, setPayNowLoading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function doPlace(payNow) {
    if (payNow) setPayNowLoading(true)
    else setLoading(true)
    try {
      const docRef = await placeOrder({ commerceId, table, cartItems: items, notes, settings, user })
      clearCart()
      if (payNow) {
        onPayNow?.({ orderId: docRef.id, table, total: totalPrice })
      } else {
        onSuccess({ orderId: docRef.id, table, total: totalPrice })
      }
    } catch (e) {
      const msg = e.message === 'TIMEOUT'
        ? 'No llegó la respuesta. Verificá tu conexión y reintentá.'
        : 'No se pudo enviar el pedido. Intentá de nuevo.'
      showToast(msg, 'error')
      setLoading(false)
      setPayNowLoading(false)
    }
  }

  const disabled = loading || payNowLoading || items.length === 0

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget && !loading && !payNowLoading) onClose() }}>
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title}>Confirmá tu pedido</span>
          <button className={styles.closeBtn} onClick={onClose} disabled={disabled}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Resumen */}
          <div className={styles.summaryBox}>
            {items.map(({ product, qty }) => (
              <div key={product.id} className={styles.summaryRow}>
                <span>{qty}× {product.name}{product._variantLabel ? ` (${product._variantLabel})` : ''}</span>
                <span>${(product.price * qty).toLocaleString('es-AR')}</span>
              </div>
            ))}
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>${totalPrice.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Nota */}
          <p className={styles.label}>Nota para la cocina (opcional)</p>
          <textarea
            className={styles.textarea}
            placeholder="Ej: sin cebolla, alergia a mariscos…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={300}
            disabled={disabled}
          />

          {/* Confirmar y Pagar Ahora */}
          <button
            className={styles.payNowBtn}
            onClick={() => doPlace(true)}
            disabled={disabled}
          >
            {payNowLoading ? 'Enviando pedido…' : '💸 Confirmar y Pagar Ahora'}
          </button>

          {/* Confirmar y pagar luego */}
          <button
            className={styles.confirmBtn}
            onClick={() => doPlace(false)}
            disabled={disabled}
          >
            {loading ? 'Enviando pedido…' : 'Confirmar y Abonar luego'}
          </button>
        </div>
      </div>
    </div>
  )
}
