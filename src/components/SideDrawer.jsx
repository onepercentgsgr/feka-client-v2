import { useEffect } from 'react'
import styles from './SideDrawer.module.css'

export default function SideDrawer({ settings, categories, user, onClose, onSignIn, onSignOut, onCategoryClick }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleCategoryClick(catId) {
    onCategoryClick?.(catId)
    onClose()
  }

  const hours = settings?.config?.openingHours || settings?.openingHours || settings?.hours || ''
  const instagram = settings?.config?.instagram || settings?.instagram || settings?.instagramUrl || ''
  const whatsapp = settings?.config?.whatsapp || settings?.whatsapp || settings?.whatsappNumber || ''

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label="Información del comercio">

        {/* Hero */}
        <div className={styles.hero}>
          <button className={styles.heroClose} onClick={onClose} aria-label="Cerrar">✕</button>
          {(settings?.config?.logo || settings?.logoUrl) && (
            <img className={styles.heroLogo}
              src={settings.config?.logo || settings.logoUrl}
              alt={settings.config?.businessName || settings.displayName || 'Menú'}
            />
          )}
          <h2 className={styles.heroName}>{settings?.config?.businessName || settings?.displayName || settings?.name || 'Menú'}</h2>
          {hours && <p className={styles.heroHours}>{hours}</p>}
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* Social */}
          {(instagram || whatsapp) && (
            <>
              <div className={styles.socialRow}>
                {instagram && (
                  <a
                    className={`${styles.socialLink} ${styles.instagram}`}
                    href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@','')}`}
                    target="_blank" rel="noopener noreferrer"
                  >
                    📸 Instagram
                  </a>
                )}
                {whatsapp && (
                  <a
                    className={`${styles.socialLink} ${styles.whatsapp}`}
                    href={`https://wa.me/${whatsapp.replace(/\D/g,'')}`}
                    target="_blank" rel="noopener noreferrer"
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>
              <hr className={styles.divider} />
            </>
          )}

          {/* Categories nav */}
          {categories.length > 0 && (
            <div>
              <p className={styles.sectionTitle}>Secciones del menú</p>
              <div className={styles.catList}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={styles.catItem}
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FEKA promo footer */}
        <div className={styles.fekaPromo}>
          <a
            href="https://feka.click"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.fekaPromoLink}
          >
            <span className={styles.fekaPromoText}>
              ¿Tenés un comercio?
              <strong> Carta digital con IA, gratis</strong> →
            </span>
            <span className={styles.fekaPromoBadge}>feka.click</span>
          </a>
        </div>

        {/* User section */}
        <div className={styles.userSection}>
          {user ? (
            <div className={styles.userRow}>
              {user.photoURL
                ? <img className={styles.avatar} src={user.photoURL} alt={user.displayName} />
                : <div className={styles.avatarPlaceholder}>👤</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.userName}>{user.displayName || 'Cliente'}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
              <button className={styles.logoutBtn} onClick={onSignOut} title="Cerrar sesión">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          ) : (
            <button className={styles.loginBtn} onClick={() => { onSignIn(); onClose() }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Iniciar sesión con Google
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
