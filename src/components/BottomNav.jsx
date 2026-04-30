import styles from './BottomNav.module.css'

const TABS = [
  { id: 'menu',         emoji: '🏠', label: 'Menú'     },
  { id: 'orders',       emoji: '🧾', label: 'Pedidos'  },
  { id: 'reservations', emoji: '📅', label: 'Reservas' },
  { id: 'waiter',       emoji: '🙋‍♂️', label: '¡Mozo!'  },
]

export default function BottomNav({ active = 'menu', onTab, activeOrdersCount = 0 }) {
  return (
    <nav className={styles.nav}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.item} ${active === tab.id ? styles.active : ''}`}
          onClick={() => onTab?.(tab.id)}
          aria-label={tab.label}
        >
          <span className={styles.emojiWrap}>
            <span className={styles.emoji}>{tab.emoji}</span>
            {tab.id === 'orders' && activeOrdersCount > 0 && (
              <span className={styles.badge}>{activeOrdersCount}</span>
            )}
          </span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
