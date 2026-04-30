import styles from './SplashScreen.module.css'

export default function SplashScreen() {
  return (
    <div className={styles.splash}>
      <div className={styles.logo}>
        <img src="/feka_logo.png" alt="FEKA" onError={e => { e.target.style.display = 'none' }} />
      </div>
      <div className={styles.bar}>
        <div className={styles.barInner} />
      </div>
      <p className={styles.tagline}>FEKA</p>
    </div>
  )
}
