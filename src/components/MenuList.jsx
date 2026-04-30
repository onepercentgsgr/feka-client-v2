import styles from './MenuList.module.css'

function ProductCard({ product, onAdd }) {
  const price = product.price || 0
  const hasImg = !!product.imgUrl
  const isAvailable = product.active !== false
    && product.available !== false
    && product.outOfStock !== true

  return (
    <div className={styles.card}>

      {/* Imagen 75×75 a la izquierda */}
      {hasImg && (
        <div className={styles.cardImg}>
          <img src={product.imgUrl} alt={product.name} loading="lazy" />
        </div>
      )}

      {/* Nombre + descripción en el centro */}
      <div className={styles.cardBody}>
        <p className={styles.cardName}>{product.name}</p>
        {product.description && (
          <p className={styles.cardDesc}>{product.description}</p>
        )}
      </div>

      {/* Precio + botón a la derecha */}
      <div className={styles.cardAction}>
        <span className={styles.cardPrice}>${price.toLocaleString('es-AR')}</span>
        {isAvailable
          ? <button className={styles.addBtn} onClick={() => onAdd(product)}>+ Agregar</button>
          : <span className={styles.unavailable}>Sin stock</span>
        }
      </div>
    </div>
  )
}

function sortByOrder(arr) {
  return [...arr].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
}

export default function MenuList({ categories, products, onAdd }) {
  const activeProducts = products.filter(
    p => p.active !== false && p.available !== false && p.outOfStock !== true
  )

  if (!categories.length && !activeProducts.length) {
    return <p className={styles.empty}>El menú está vacío por ahora.</p>
  }

  // Con categorías: agrupar y ordenar
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
                  <ProductCard key={p.id} product={p} onAdd={onAdd} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  // Sin categorías: lista plana ordenada
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {sortByOrder(activeProducts).map(p => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} />
        ))}
      </div>
    </div>
  )
}
