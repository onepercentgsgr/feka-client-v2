import styles from './MenuList.module.css'

function sanitize(str) {
  return String(str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function ProductCard({ product, onAdd }) {
  const price = product.price || 0
  const hasImg = !!product.imgUrl
  const isAvailable = product.active !== false

  return (
    <div className={styles.card}>
      {hasImg && (
        <div className={styles.cardImg}>
          <img src={product.imgUrl} alt={product.name} loading="lazy" />
        </div>
      )}
      <div className={styles.cardBody}>
        <p className={styles.cardName}>{product.name}</p>
        {product.description && (
          <p className={styles.cardDesc}>{product.description}</p>
        )}
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>${price.toLocaleString('es-AR')}</span>
          {isAvailable
            ? <button className={styles.addBtn} onClick={() => onAdd(product)}>+ Agregar</button>
            : <span className={styles.unavailable}>No disponible</span>
          }
        </div>
      </div>
    </div>
  )
}

export default function MenuList({ categories, products, onAdd }) {
  if (!categories.length && !products.length) {
    return <p className={styles.empty}>El menú está vacío por ahora.</p>
  }

  // Si hay categorías: agrupar productos por categoría
  if (categories.length > 0) {
    return (
      <div className={styles.container}>
        {categories.map(cat => {
          const catProducts = products.filter(p =>
            p.categoryId === cat.id && p.active !== false
          )
          if (!catProducts.length) return null
          return (
            <section key={cat.id} className={styles.category}>
              <h2 className={styles.categoryTitle}>{cat.name}</h2>
              <div className={styles.grid}>
                {catProducts.map(p => (
                  <ProductCard key={p.id} product={p} onAdd={onAdd} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  // Sin categorías: lista plana
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {products.filter(p => p.active !== false).map(p => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} />
        ))}
      </div>
    </div>
  )
}
