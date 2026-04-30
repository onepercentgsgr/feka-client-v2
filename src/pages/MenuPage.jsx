import { useState } from 'react'
import { useCommerce } from '../hooks/useCommerce'
import SplashScreen from '../components/SplashScreen'
import Header from '../components/Header'
import MenuList from '../components/MenuList'

export default function MenuPage() {
  const { commerceId, table, settings, categories, products, loading, error } = useCommerce()
  const [cart, setCart] = useState([])

  function addToCart(product) {
    setCart(prev => [...prev, product])
    // vibración leve en móvil
    try { if (navigator.vibrate) navigator.vibrate(40) } catch (_) {}
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
        cartCount={cart.length}
        onCartOpen={() => {}}
        onSearchOpen={() => {}}
      />

      <MenuList
        categories={categories}
        products={products}
        onAdd={addToCart}
      />
    </div>
  )
}
