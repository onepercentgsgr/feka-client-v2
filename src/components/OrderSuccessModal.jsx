import styles from './OrderSuccessModal.module.css'

export default function OrderSuccessModal({ orderId, table, total, onClose }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.emoji}>🎉</div>
        <h2 className={styles.title}>¡Pedido enviado!</h2>
        <p className={styles.sub}>
          Tu pedido fue recibido. El equipo lo está preparando.
        </p>
        {table && (
          <div className={styles.tableBadge}>Mesa {table}</div>
        )}
        <p style={{ fontSize: '0.8rem', color: '#bbb', marginBottom: 20 }}>
          Total: ${total.toLocaleString('es-AR')}
        </p>
        <button className={styles.btn} onClick={onClose}>
          Volver al menú
        </button>
      </div>
    </div>
  )
}
