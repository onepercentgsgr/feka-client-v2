import { useCart } from '../context/CartContext'
import styles from './CartFooter.module.css'

export default function CartFooter({ onOpen }) {
  const { items, totalItems, totalPrice } = useCart()
  if (totalItems === 0) return null

  return (
    <div className={styles.footer}>
      <div>
        <div className={styles.label}>Total Pedido</div>
        <div className={styles.total}>${totalPrice.toLocaleString('es-AR')}</div>
      </div>
      <button className={styles.btn} onClick={onOpen}>
        Finalizar pedido ({totalItems})
      </button>
    </div>
  )
}
