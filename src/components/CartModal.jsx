import { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import styles from './CartModal.module.css'

function ItemRow({ item }) {
  const { addItem, removeItem } = useCart()
  const { product, qty } = item
  const unitPrice = product.price || 0

  return (
    <div className={styles.item}>
      {product.imgUrl
        ? <img className={styles.itemImg} src={product.imgUrl} alt={product.name} loading="lazy" />
        : <div className={styles.itemNoImg}>🍽️</div>
      }
      <div className={styles.itemInfo}>
        <p className={styles.itemName}>{product.name}</p>
        {product._variantLabel && (
          <p className={styles.itemVariant}>{product._variantLabel}</p>
        )}
        <p className={styles.itemUnit}>${unitPrice.toLocaleString('es-AR')} c/u</p>
      </div>
      <div className={styles.itemControls}>
        <button
          className={`${styles.qtyBtn} ${styles.qtyMinus}`}
          onClick={() => removeItem(product.id)}
          aria-label="Quitar uno"
        >−</button>
        <span className={styles.qtyNum}>{qty}</span>
        <button
          className={styles.qtyBtn}
          onClick={() => addItem(product)}
          aria-label="Agregar uno"
        >+</button>
      </div>
    </div>
  )
}

export default function CartModal({ onClose, onOrder }) {
  const { items, totalItems, totalPrice } = useCart()

  // cerrar con Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Carrito">
        <div className={styles.handle} />

        <div className={styles.header}>
          <span className={styles.title}>Tu pedido{totalItems > 0 ? ` (${totalItems})` : ''}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar carrito">✕</button>
        </div>

        {items.length === 0
          ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🛒</span>
              <span className={styles.emptyText}>Tu carrito está vacío</span>
            </div>
          )
          : (
            <div className={styles.list}>
              {items.map(item => (
                <ItemRow key={item.product.id} item={item} />
              ))}
            </div>
          )
        }

        <div className={styles.footer}>
          {items.length > 0 && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalPrice}>${totalPrice.toLocaleString('es-AR')}</span>
            </div>
          )}
          <button
            className={styles.orderBtn}
            onClick={onOrder}
            disabled={items.length === 0}
            style={items.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
          >
            {items.length === 0 ? 'Agregá productos al pedido' : 'Confirmar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
