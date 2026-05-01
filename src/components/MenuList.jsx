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

/** Chips de filtros dietarios del producto */
const DIETARY_LABELS = {
  vegan:        '🌱 Vegano',
  vegetarian:   '🥗 Vegetariano',
  gluten_free:  '🌾🚫 Sin TACC',
  lactose_free: '🥛🚫 Sin lactosa',
}

function DietaryChips({ dietary }) {
  if (!dietary?.length) return null
  return (
    <div className={styles.dietChips}>
      {dietary.map(d => DIETARY_LABELS[d]
        ? <span key={d} className={styles.dietChip}>{DIETARY_LABELS[d]}</span>
        : null
      )}
    </div>
  )
}

function ProductCard({ product, onAdd, rate, activeDietFilters, showDietaryChips }) {
  const [viewerUrl, setViewerUrl] = useState(null)
  const [videoOpen, setVideoOpen]   = useState(false)

  const isAvailable = product.active !== false
    && product.available !== false
    && product.outOfStock !== true

  const hasImg      = !!product.imgUrl
  const hasVideo    = !!product.videoUrl
  const hasVariants = product.hasVariations && Array.isArray(product.variations) && product.variations.length > 0
  const vStock      = product.variationStock || {}
  const stock       = product.stock ?? null   // stock real si existe en el doc

  const displayPrice = applyRate(product.price || 0, rate)

  // Badge de stock bajo (≤3 unidades)
  const lowStockBadge = (stock !== null && stock > 0 && stock <= 3)
    ? <div className={styles.lowStock}>⏳ Solo quedan {stock}</div>
    : null

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

  // Filtrado dietario: si hay filtros activos y el producto no coincide, ocultar
  if (activeDietFilters && activeDietFilters.size > 0) {
    const productDietary = new Set(product.dietary || [])
    const matches = [...activeDietFilters].every(f => productDietary.has(f))
    if (!matches) return null
  }

  return (
    <>
      <div className={styles.card}>

        {/* Media: video si existe, si no imagen */}
        {hasVideo ? (
          <div className={styles.cardImg} onClick={() => setVideoOpen(true)}>
            {hasImg
              ? <img src={product.imgUrl} alt={product.name} loading="eager" />
              : <div className={styles.videoPlaceholder}>▶</div>
            }
            <span className={styles.playBadge}>▶</span>
          </div>
        ) : hasImg ? (
          <div
            className={styles.cardImg}
            onClick={() => setViewerUrl(product.imgUrl)}
            role="button"
            aria-label="Ver imagen ampliada"
          >
            <img src={product.imgUrl} alt={product.name} loading="eager" />
            <span className={styles.zoomBadge}>🔍</span>
          </div>
        ) : null}

        {/* Nombre + descripción en el centro */}
        <div className={styles.cardBody}>
          <p className={styles.cardName}>{product.name}</p>
          {product.description && (
            <p className={styles.cardDesc}>{product.description}</p>
          )}

          {/* Chips dietarios — solo cuando el filtro está abierto o hay filtros activos */}
          {showDietaryChips && <DietaryChips dietary={product.dietary} />}

          {/* Badge stock bajo */}
          {lowStockBadge}

          {/* Variantes inline */}
          {hasVariants && isAvailable && (
            <div className={styles.variants}>
              {product.variations.map(v => {
                const vPrice = applyRate(v.price || 0, rate)
                const vOut   = vStock[v.name]?.outOfStock === true
                const vStock2 = v.stock ?? null
                const vLow   = vStock2 !== null && vStock2 > 0 && vStock2 <= 3
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
                    {vLow && <span className={styles.variantLowStock}> ⏳{vStock2}</span>}
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

      {/* Viewer de video a pantalla completa */}
      {videoOpen && (
        <div className={styles.videoOverlay} onClick={() => setVideoOpen(false)}>
          <video
            src={product.videoUrl}
            autoPlay
            loop
            controls
            playsInline
            className={styles.videoFull}
            onClick={e => e.stopPropagation()}
          />
          <button className={styles.videoCloseBtn} onClick={() => setVideoOpen(false)}>✕</button>
        </div>
      )}
    </>
  )
}

function sortByOrder(arr) {
  return [...arr].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
}

export default function MenuList({ categories, products, onAdd, searchQuery = '', commissionRate = 0, activeDietFilters, showDietaryChips = false }) {
  const rate = commissionRate

  const activeProducts = products.filter(
    p => p.active !== false && p.available !== false
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
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onAdd={onAdd}
              rate={rate}
              activeDietFilters={activeDietFilters}
              showDietaryChips={showDietaryChips}
            />
          ))}
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
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={onAdd}
                    rate={rate}
                    activeDietFilters={activeDietFilters}
                    showDietaryChips={showDietaryChips}
                  />
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
          <ProductCard
            key={p.id}
            product={p}
            onAdd={onAdd}
            rate={rate}
            activeDietFilters={activeDietFilters}
            showDietaryChips={showDietaryChips}
          />
        ))}
      </div>
    </div>
  )
}
