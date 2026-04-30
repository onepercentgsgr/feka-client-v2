import { useCart } from '../context/CartContext'
import styles from './FloatingCartBtn.module.css'

export default function FloatingCartBtn({ onClick }) {
  const { totalItems, totalPrice } = useCart()

  if (totalItems === 0) return null

  return (
    <button className={styles.btn} onClick={onClick} aria-label="Ver carrito">
      <span className={styles.icon}>🛒</span>
      <span className={styles.badge}>{totalItems}</span>
      <span>Ver pedido</span>
      <span className={styles.price}>${totalPrice.toLocaleString('es-AR')}</span>
    </button>
  )
}
