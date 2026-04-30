import { useEffect, useRef } from 'react'
import styles from './InlineSearchBar.module.css'

export default function InlineSearchBar({ value, onChange, onClose }) {
  const inputRef = useRef()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <input
          ref={inputRef}
          type="search"
          className={styles.input}
          placeholder="Buscar en el menú..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <button className={styles.close} onClick={() => { onChange(''); onClose() }}>✕</button>
      </div>
    </div>
  )
}
