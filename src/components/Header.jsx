import styles from './Header.module.css'

export default function Header({
  settings,
  table,
  onMenuOpen,
  onFilterOpen,
  onSearchOpen,
}) {
  const logo = settings?.config?.logo || settings?.logoUrl || settings?.logo || null
  const name = settings?.config?.businessName || settings?.displayName || settings?.name || 'Menú'

  return (
    <header className={styles.header}>

      {/* IZQUIERDA: hamburguesa + badge mesa */}
      <div className={styles.left}>
        <button className={styles.iconBtn} onClick={onMenuOpen} aria-label="Menú">
          <span className={styles.burger} />
          <span className={styles.burger} />
          <span className={styles.burger} />
        </button>

        {table && (
          <div className={styles.mesaBadge}>
            <span>🍽️</span>
            <span>Mesa {table}</span>
          </div>
        )}
      </div>

      {/* CENTRO: logo o nombre */}
      <div className={styles.center}>
        {logo
          ? <img src={logo} alt={name} className={styles.logo} />
          : <span className={styles.name}>{name}</span>
        }
      </div>

      {/* DERECHA: filtro + búsqueda */}
      <div className={styles.right}>
        <button className={styles.iconBtn} onClick={onFilterOpen} aria-label="Categorías">
          {/* funnel icon */}
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </button>

        <button className={styles.iconBtn} onClick={onSearchOpen} aria-label="Buscar">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
