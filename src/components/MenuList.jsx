import { useState, useCallback } from 'react'
import styles from './MenuList.module.css'
import ImageViewer from './ImageViewer'

/** Aplica el markup de comisión exactamente igual que V1 */
function applyRate(price, rate) {
  if (!rate || rate <= 0) return price
  return Math.ceil(price * (1 + rate / 100) / 10) * 10
}

/** Animación de pelotita voladora hacia el carrito */
function spawnFlyDot(originEl) {
  if (!originEl) return
  const rect = originEl.getBoundingClientRect()
  const startX = rect.left + rect.width / 2
  const startY = rect.top  + rect.height / 2

  const dot = document.createElement('div')
  dot.className = 'fly-dot-global'
  dot.style.cssText = `
    position: fixed;
    left: ${startX}px;
    top: ${startY}px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--primary, #FF7043);
    z-index: 9999;
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: left 0.55s cubic-bezier(.4,0,.2,1),
                top  0.55s cubic-bezier(.4,0,.2,1),
                opacity 0.55s ease,
                transform 0.55s ease;
  `
  document.body.appendChild(dot)

  // destino: centro-derecho del bottom, donde está el ícono del carrito
  const endX = window.innerWidth  - 48
  const endY = window.innerHeight - 38

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dot.style.left    = `${endX}px`
      dot.style.top     = `${endY}px`
      dot.style.opacity = '0'
      dot.style.transform = 'translate(-50%,-50%) scale(0.3)'
    })
  })

  setTimeout(() => dot.remove(), 620)
}

function ProductCard({ product, onAdd, rate }) {
  const [viewerUrl, setViewerUrl] = useState(null)

  const isAvailable = product.active !== false
    && product.available !== false
    && product.outOfStock !== true

  const hasImg      = !!product.imgUrl
  const hasVariants = product.hasVariations && Array.isArray(product.variations) && product.variations.length > 0
  const vStock      = product.variationStock || {}

  const displayPrice = applyRate(product.price || 0, rate)

  const handleAdd = useCallback((e) => {
    spawnFlyDot(e.currentTarget)
    onAdd({ ...product, price: displayPrice, basePrice: product.price || 0 })
  }, [product, displayPrice, onAdd])

  const handleVariantAdd = useCallback((variant, e) => {
    spawnFlyDot(e.currentTarget)
    const vPrice = applyRate(variant.price || 0, rate)
    onAdd({
      id: `${product.id}__${variant.name}`,
      name: product.name,
      price: vPrice,
      basePrice: variant.price || 0,
      imgUrl: product.imgUrl || '',
      description: product.description || '',
      _variantLabel: variant.name,
    })
  }, [product, rate, onAdd])

  return (
    <>
      <div className={styles.card}>

        {/* Imagen 75×75 con badge de zoom */}
        {hasImg && (
          <div
            className={styles.cardImg}
            onClick={() => setViewerUrl(product.imgUrl)}
            role="button"
            aria-label="Ver imagen ampliada"
          >
            <img src={product.imgUrl} alt={product.name} loading="eager" />
            <span className={styles.zoomBadge}>🔍</span>
          </div>
        )}

        {/* Nombre + descripción en el centro */}
        <div className={styles.cardBody}>
          <p className={styles.cardName}>{product.name}</p>
          {product.description && (
            <p className={styles.cardDesc}>{product.description}</p>
          )}

          {/* Variantes inline */}
          {hasVariants && isAvailable && (
            <div className={styles.variants}>
              {product.variations.map(v => {
                const vPrice = applyRate(v.price || 0, rate)
                const vOut   = vStock[v.name]?.outOfStock === true
                return vOut ? (
                  <span key={v.name} className={styles.variantDisabled}>
                    {v.name} — Sin stock
                  </span>
                ) : (
                  <button
                    key={v.name}
                    className={styles.variantBtn}
                    onClick={(e) => handleVariantAdd(v, e)}
                  >
                    {v.name} ${vPrice.toLocaleString('es-AR')}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Precio + botón (solo sin variaciones) */}
        {!hasVariants && (
          <div className={styles.cardAction}>
            <span className={styles.cardPrice}>${displayPrice.toLocaleString('es-AR')}</span>
            {isAvailable
              ? <button className={styles.addBtn} onClick={handleAdd}>+ Agregar</button>
              : <span className={styles.unavailable}>Sin stock</span>
            }
          </div>
        )}

        {hasVariants && !isAvailable && (
          <div className={styles.cardAction}>
            <span className={styles.unavailable}>Sin stock</span>
          </div>
        )}
      </div>

      {/* Viewer de imagen a pantalla completa */}
      {viewerUrl && (
        <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
    </>
  )
}

function sortByOrder(arr) {
  return [...arr].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
}

export default function MenuList({ categories, products, onAdd, searchQuery = '', commissionRate = 0 }) {
  const rate = commissionRate

  const activeProducts = products.filter(
    p => p.active !== false && p.available !== false && p.outOfStock !== true
  )

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    const filtered = sortByOrder(activeProducts.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    ))
    if (!filtered.length) {
      return <p className={styles.empty}>Sin resultados para "{searchQuery}"</p>
    }
    return (
      <div className={styles.container}>
        <div className={styles.grid}>
          {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={onAdd} rate={rate} />)}
        </div>
      </div>
    )
  }

  if (!categories.length && !activeProducts.length) {
    return <p className={styles.empty}>El menú está vacío por ahora.</p>
  }

  if (categories.length > 0) {
    return (
      <div className={styles.container}>
        {categories.map(cat => {
          const catProducts = sortByOrder(
            activeProducts.filter(p => p.categoryId === cat.id)
          )
          if (!catProducts.length) return null
          return (
            <section key={cat.id} id={`cat-${cat.id}`} className={styles.category}>
              <h2 className={styles.categoryTitle}>{cat.name}</h2>
              <div className={styles.grid}>
                {catProducts.map(p => (
                  <ProductCard key={p.id} product={p} onAdd={onAdd} rate={rate} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {sortByOrder(activeProducts).map(p => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} rate={rate} />
        ))}
      </div>
    </div>
  )
}
