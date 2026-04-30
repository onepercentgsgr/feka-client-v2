import styles from './CategoryFilterBar.module.css'

export default function CategoryFilterBar({ categories, onSelect }) {
  function handleClick(catId) {
    const el = document.getElementById(`cat-${catId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    onSelect?.()
  }

  if (!categories.length) return null

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={styles.chip}
            onClick={() => handleClick(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
