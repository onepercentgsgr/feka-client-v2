import { useState, useCallback } from 'react'
import { useCommerce } from '../hooks/useCommerce'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { useBackButton } from '../hooks/useBackButton'
import { callWaiter } from '../services/orderService'
import { showToast } from '../components/Toast'

import SplashScreen from '../components/SplashScreen'
import Header from '../components/Header'
import MenuList from '../components/MenuList'
import CartFooter from '../components/CartFooter'
import BottomNav from '../components/BottomNav'
import CategoryFilterBar from '../components/CategoryFilterBar'
import InlineSearchBar from '../components/InlineSearchBar'
import CartModal from '../components/CartModal'
import OrderConfirmModal from '../components/OrderConfirmModal'
import OrderSuccessModal from '../components/OrderSuccessModal'
import SideDrawer from '../components/SideDrawer'

export default function MenuPage() {
  const { commerceId, table, settings, categories, products, loading, error } = useCommerce()
  const { addItem } = useCart()
  const { user, signIn, signOut } = useAuth()

  const [activeTab,   setActiveTab]   = useState('menu')
  const [filterOpen,  setFilterOpen]  = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [cartOpen,    setCartOpen]    = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successData, setSuccessData] = useState(null)

  // Back button cierra modales en orden
  useBackButton(drawerOpen,  useCallback(() => setDrawerOpen(false), []))
  useBackButton(cartOpen,    useCallback(() => setCartOpen(false), []))
  useBackButton(confirmOpen, useCallback(() => setConfirmOpen(false), []))

  // Cierra filter si abre búsqueda y viceversa
  function handleFilterOpen() {
    setSearchOpen(false)
    setSearchQuery('')
    setFilterOpen(v => !v)
  }
  function handleSearchOpen() {
    setFilterOpen(false)
    setSearchOpen(v => !v)
    if (searchOpen) setSearchQuery('')
  }

  async function handleTab(tab) {
    if (tab === 'waiter') {
      if (!commerceId) return
      try {
        await callWaiter({ commerceId, table, user })
        showToast('🙋‍♂️ ¡Mozo en camino!', 'success')
      } catch (e) {
        showToast('No se pudo llamar al mozo', 'error')
      }
      return
    }
    setActiveTab(tab)
    if (tab !== 'menu') {
      showToast('Próximamente disponible 🔜', 'info')
      setActiveTab('menu')
    }
  }

  function handleOrderSuccess(data) {
    setConfirmOpen(false)
    setCartOpen(false)
    setSuccessData(data)
  }

  // ── Estados especiales ─────────────────────────────────

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
        onMenuOpen={() => setDrawerOpen(true)}
        onFilterOpen={handleFilterOpen}
        onSearchOpen={handleSearchOpen}
      />

      {filterOpen && (
        <CategoryFilterBar
          categories={categories}
          onSelect={() => setFilterOpen(false)}
        />
      )}

      {searchOpen && (
        <InlineSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClose={() => setSearchOpen(false)}
        />
      )}

      <MenuList
        categories={categories}
        products={products}
        onAdd={addItem}
        searchQuery={searchQuery}
      />

      {/* Barra de carrito (arriba del bottom nav) */}
      <CartFooter onOpen={() => setCartOpen(true)} />

      {/* Navegación inferior */}
      <BottomNav active={activeTab} onTab={handleTab} />

      {/* ── Modales / Drawer ── */}
      {drawerOpen && (
        <SideDrawer
          settings={settings}
          categories={categories}
          user={user}
          onClose={() => setDrawerOpen(false)}
          onSignIn={signIn}
          onSignOut={signOut}
          onCategoryClick={(catId) => {
            const el = document.getElementById(`cat-${catId}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
      )}

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
    </div>
  )
}
