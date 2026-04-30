import { useState } from 'react'
import styles from './SplashScreen.module.css'

export default function SplashScreen({ commerceId }) {
  // Intentamos mostrar el logo del comercio cacheado en localStorage
  const cachedLogo = commerceId
    ? localStorage.getItem(`feka_logo_${commerceId}`)
    : null

  const [logoSrc, setLogoSrc] = useState(cachedLogo || '/feka_logo.png')

  return (
    <div className={styles.splash}>
      <div className={styles.logo}>
        <img
          src={logoSrc}
          alt="FEKA"
          onError={() => {
            if (logoSrc !== '/feka_logo.png') setLogoSrc('/feka_logo.png')
          }}
        />
      </div>
      <div className={styles.bar}>
        <div className={styles.barInner} />
      </div>
      <p className={styles.tagline}>FEKA</p>
    </div>
  )
}
