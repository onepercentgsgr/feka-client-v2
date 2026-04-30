import styles from './BottomNav.module.css'

const TABS = [
  { id: 'menu',         emoji: '🏠', label: 'Menú'     },
  { id: 'orders',       emoji: '🧾', label: 'Pedidos'  },
  { id: 'reservations', emoji: '📅', label: 'Reservas' },
  { id: 'waiter',       emoji: '🙋‍♂️', label: '¡Mozo!'  },
]

export default function BottomNav({ active = 'menu', onTab }) {
  return (
    <nav className={styles.nav}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.item} ${active === tab.id ? styles.active : ''}`}
          onClick={() => onTab?.(tab.id)}
          aria-label={tab.label}
        >
          <span className={styles.emoji}>{tab.emoji}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
