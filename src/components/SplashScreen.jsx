import { useState } from 'react'
import styles from './SplashScreen.module.css'

const PARTICLES = [
  { w:3, h:3, color:'#D4AA40', bottom:'6%',  left:'14%', dur:'9s',   delay:'0.3s',  drift:'28px'  },
  { w:2, h:2, color:'#F0D060', bottom:'18%', left:'32%', dur:'12s',  delay:'1.4s',  drift:'-22px' },
  { w:4, h:4, color:'#C89020', bottom:'4%',  left:'52%', dur:'8s',   delay:'0s',    drift:'16px'  },
  { w:2, h:2, color:'#D4AA40', bottom:'22%', left:'70%', dur:'13s',  delay:'2.2s',  drift:'-30px' },
  { w:3, h:3, color:'#E8C840', bottom:'9%',  left:'84%', dur:'10s',  delay:'0.9s',  drift:'12px'  },
  { w:2, h:2, color:'#D4AA40', bottom:'14%', left:'6%',  dur:'11s',  delay:'3.1s',  drift:'24px'  },
  { w:3, h:3, color:'#F0D060', bottom:'28%', left:'92%', dur:'9.5s', delay:'1.7s',  drift:'-18px' },
  { w:2, h:2, color:'#C89020', bottom:'20%', left:'46%', dur:'14s',  delay:'4.2s',  drift:'38px'  },
]

export default function SplashScreen({ commerceId }) {
  const cachedLogo = commerceId
    ? localStorage.getItem(`feka_logo_${commerceId}`)
    : null

  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <div className={styles.splash}>
      {/* Floating golden particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className={styles.particle}
          style={{
            width: p.w, height: p.h, background: p.color,
            bottom: p.bottom, left: p.left,
            animationDuration: p.dur, animationDelay: p.delay,
            '--drift': p.drift,
          }}
        />
      ))}

      {/* Logo + expanding rings */}
      <div className={styles.logoWrap}>
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.ring} />

        {cachedLogo && !logoFailed ? (
          <img
            src={cachedLogo}
            alt="Logo"
            className={styles.logo}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <div className={styles.logoFallback}>🍽️</div>
        )}
      </div>

      <p className={styles.tagline}>FEKA</p>

      {/* Gold shimmer bar */}
      <div className={styles.barWrap}>
        <div className={styles.bar} />
      </div>
    </div>
  )
}
