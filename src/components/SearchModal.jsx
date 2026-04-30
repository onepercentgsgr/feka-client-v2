import { useState, useRef, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import styles from './SearchModal.module.css'
// Reutilizamos el CSS de la tarjeta de producto del MenuList
import menuStyles from './MenuList.module.css'

function ProductCard({ product, onAdd }) {
  const price = product.price || 0
  return (
    <div className={menuStyles.card}>
      {product.imgUrl && (
        <div className={menuStyles.cardImg}>
          <img src={product.imgUrl} alt={product.name} loading="lazy" />
        </div>
      )}
      <div className={menuStyles.cardBody}>
        <p className={menuStyles.cardName}>{product.name}</p>
        {product.description && (
          <p className={menuStyles.cardDesc}>{product.description}</p>
        )}
        <div className={menuStyles.cardFooter}>
          <span className={menuStyles.cardPrice}>${price.toLocaleString('es-AR')}</span>
          {product.active !== false
            ? <button className={menuStyles.addBtn} onClick={() => onAdd(product)}>+ Agregar</button>
            : <span className={menuStyles.unavailable}>No disponible</span>
          }
        </div>
      </div>
    </div>
  )
}

export default function SearchModal({ products, onClose }) {
  const { addItem } = useCart()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleKey(e) {
    if (e.key === 'Escape') onClose()
  }

  const q = query.trim().toLowerCase()
  const results = q
    ? products.filter(p =>
        p.active !== false &&
        (p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      )
    : []

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.searchBar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            placeholder="Buscar en el menú…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
        </div>

        <div className={styles.list}>
          {!q && (
            <p className={styles.hint}>Escribí el nombre de un plato<br />para buscarlo en el menú.</p>
          )}
          {q && results.length === 0 && (
            <p className={styles.empty}>No encontramos "{query}" en el menú.</p>
          )}
          {results.map(p => (
            <ProductCard key={p.id} product={p} onAdd={prod => { addItem(prod); onClose() }} />
          ))}
        </div>
      </div>
    </div>
  )
}
