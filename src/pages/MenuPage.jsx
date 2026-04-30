import { useState } from 'react'
import { useCommerce } from '../hooks/useCommerce'
import { useCart } from '../context/CartContext'
import SplashScreen from '../components/SplashScreen'
import Header from '../components/Header'
import MenuList from '../components/MenuList'
import CartModal from '../components/CartModal'
import FloatingCartBtn from '../components/FloatingCartBtn'

export default function MenuPage() {
  const { commerceId, table, settings, categories, products, loading, error } = useCommerce()
  const { addItem, totalItems } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  function handleOrder() {
    // TODO: flujo de confirmación de pedido
    alert('¡Pedido en camino! (próximamente)')
  }

  if (!commerceId) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>
      <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📱</p>
      <p>Escaneá el QR del comercio para ver el menú.</p>
    </div>
  )

  if (loading) return <SplashScreen />

  if (error) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#e53935' }}>
      <p style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</p>
      <p>{error}</p>
    </div>
  )

  return (
    <div>
      <Header
        settings={settings}
        table={table}
        cartCount={totalItems}
        onCartOpen={() => setCartOpen(true)}
        onSearchOpen={() => {}}
      />

      <MenuList
        categories={categories}
        products={products}
        onAdd={addItem}
      />

      <FloatingCartBtn onClick={() => setCartOpen(true)} />

      {cartOpen && (
        <CartModal
          onClose={() => setCartOpen(false)}
          onOrder={handleOrder}
        />
      )}
    </div>
  )
}
