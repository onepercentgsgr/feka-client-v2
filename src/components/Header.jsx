import styles from './Header.module.css'

export default function Header({ settings, table, cartCount = 0, onCartOpen, onSearchOpen }) {
  const logo  = settings?.logoUrl || settings?.logo || null
  const name  = settings?.businessName || settings?.displayName || 'Menú'

  return (
    <header className={styles.header}>
      {/* Logo / Nombre */}
      <div className={styles.left}>
        {logo
          ? <img src={logo} alt={name} className={styles.logo} />
          : <span className={styles.name}>{name}</span>
        }
      </div>

      {/* Mesa (centro) */}
      {table && (
        <div className={styles.center}>
          <span className={styles.tableBadge}>Mesa {table}</span>
        </div>
      )}

      {/* Acciones (derecha) */}
      <div className={styles.right}>
        <button className={styles.iconBtn} onClick={onSearchOpen} aria-label="Buscar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        <button className={styles.cartBtn} onClick={onCartOpen} aria-label="Carrito">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
        </button>
      </div>
    </header>
  )
}
