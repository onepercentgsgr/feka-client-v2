import { useState, useCallback, useRef } from 'react'
import { useCommerce } from '../hooks/useCommerce'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { useBackButton } from '../hooks/useBackButton'
import SplashScreen from '../components/SplashScreen'
import Header from '../components/Header'
import MenuList from '../components/MenuList'
import CartModal from '../components/CartModal'
import FloatingCartBtn from '../components/FloatingCartBtn'
import OrderConfirmModal from '../components/OrderConfirmModal'
import OrderSuccessModal from '../components/OrderSuccessModal'
import SearchModal from '../components/SearchModal'
import SideDrawer from '../components/SideDrawer'

export default function MenuPage() {
  const { commerceId, table, settings, categories, products, loading, error } = useCommerce()
  const { addItem, totalItems } = useCart()
  const { user, signIn, signOut } = useAuth()

  const [cartOpen, setCartOpen]       = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successData, setSuccessData] = useState(null) // { orderId, table, total }
  const [searchOpen, setSearchOpen]   = useState(false)
  const [drawerOpen, setDrawerOpen]   = useState(false)

  // Back button cierra el modal/drawer más reciente
  useBackButton(cartOpen,    useCallback(() => setCartOpen(false), []))
  useBackButton(confirmOpen, useCallback(() => setConfirmOpen(false), []))
  useBackButton(searchOpen,  useCallback(() => setSearchOpen(false), []))
  useBackButton(drawerOpen,  useCallback(() => setDrawerOpen(false), []))

  // Ref para scroll a categoría desde el drawer
  const categoryRefs = useRef({})

  function handleCategoryScroll(catId) {
    const el = document.getElementById(`cat-${catId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleOrderSuccess(data) {
    setConfirmOpen(false)
    setCartOpen(false)
    setSuccessData(data)
  }

  // ── Estados especiales ──────────────────────────────────────

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
        onSearchOpen={() => setSearchOpen(true)}
        onMenuOpen={() => setDrawerOpen(true)}
      />

      <MenuList
        categories={categories}
        products={products}
        onAdd={addItem}
      />

      <FloatingCartBtn onClick={() => setCartOpen(true)} />

      {/* ── Modales ── */}
      {cartOpen && (
        <CartModal
          onClose={() => setCartOpen(false)}
          onOrder={() => { setCartOpen(false); setConfirmOpen(true) }}
        />
      )}

      {confirmOpen && (
        <OrderConfirmModal
          commerceId={commerceId}
          table={table}
          settings={settings}
          user={user}
          onClose={() => setConfirmOpen(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {successData && (
        <OrderSuccessModal
          orderId={successData.orderId}
          table={successData.table}
          total={successData.total}
          onClose={() => setSuccessData(null)}
        />
      )}

      {searchOpen && (
        <SearchModal
          products={products}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {drawerOpen && (
        <SideDrawer
          settings={settings}
          categories={categories}
          user={user}
          onClose={() => setDrawerOpen(false)}
          onSignIn={signIn}
          onSignOut={signOut}
          onCategoryClick={handleCategoryScroll}
        />
      )}
    </div>
  )
}
