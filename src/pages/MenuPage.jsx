import { useState, useCallback, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
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
import PaymentModal from '../components/PaymentModal'
import SideDrawer from '../components/SideDrawer'
import WaiterModal from '../components/WaiterModal'
import OrdersView from './OrdersView'
import ReservationsView from './ReservationsView'

export default function MenuPage() {
  const { commerceId, table, settings, categories, products, loading, error, commissionRate } = useCommerce()
  const { addItem } = useCart()
  const { user, signIn, signOut } = useAuth()

  const [activeTab,    setActiveTab]    = useState('menu')
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [cartOpen,     setCartOpen]     = useState(false)
  const [confirmOpen,  setConfirmOpen]  = useState(false)
  const [successData,  setSuccessData]  = useState(null)
  const [waiterOpen,   setWaiterOpen]   = useState(false)
  const [paymentData,  setPaymentData]  = useState(null)   // { orderId, total }
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)

  // Badge: trackear pedidos activos en tiempo real
  useEffect(() => {
    if (!commerceId) return
    try {
      const stored = JSON.parse(localStorage.getItem('feka_active_orders') || '[]')
      const mine = stored.filter(o => o.commerceId === commerceId)
      if (!mine.length) { setActiveOrdersCount(0); return }

      const counts = {}
      const unsubs = mine.map(({ id }) => {
        return onSnapshot(
          doc(db, 'feka_users', commerceId, 'orders', id),
          snap => {
            if (snap.exists()) {
              const st = snap.data().status || ''
              counts[id] = (st === 'requested' || st === 'preparing') ? 1 : 0
            } else {
              counts[id] = 0
            }
            setActiveOrdersCount(Object.values(counts).reduce((a, b) => a + b, 0))
          },
          () => { counts[id] = 0 }
        )
      })
      return () => unsubs.forEach(u => u())
    } catch (_) {}
  }, [commerceId])

  // Back button cierra modales en orden
  useBackButton(drawerOpen,   useCallback(() => setDrawerOpen(false),  []))
  useBackButton(cartOpen,     useCallback(() => setCartOpen(false),    []))
  useBackButton(confirmOpen,  useCallback(() => setConfirmOpen(false), []))
  useBackButton(waiterOpen,   useCallback(() => setWaiterOpen(false),  []))
  useBackButton(!!paymentData, useCallback(() => setPaymentData(null), []))

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

  function handleTab(tab) {
    if (tab === 'waiter') {
      if (!commerceId) return
      setWaiterOpen(true)
      return
    }
    setActiveTab(tab)
    setFilterOpen(false)
    setSearchOpen(false)
    setSearchQuery('')
  }

  async function handleWaiterConfirm(message) {
    setWaiterOpen(false)
    try {
      await callWaiter({ commerceId, table, user, message })
      showToast('🙋‍♂️ ¡Mozo en camino!', 'success')
    } catch (e) {
      showToast('No se pudo llamar al mozo', 'error')
    }
  }

  function handleOrderSuccess(data) {
    setConfirmOpen(false)
    setCartOpen(false)
    setSuccessData(data)
    setActiveOrdersCount(c => c + 1)
  }

  // Cuando el usuario elige "Pagar Ahora" en el modal de confirmación
  function handlePayNow(data) {
    setConfirmOpen(false)
    setCartOpen(false)
    setPaymentData(data)    // { orderId, table, total }
    setActiveOrdersCount(c => c + 1)
  }

  function handleViewOrders() {
    setSuccessData(null)
    setPaymentData(null)
    setActiveTab('orders')
  }

  // ── Estados especiales ─────────────────────────────────

  if (!commerceId) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>
      <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📱</p>
      <p>Escaneá el QR del comercio para ver el menú.</p>
    </div>
  )

  if (loading) return <SplashScreen commerceId={commerceId} />

  if (error) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#e53935' }}>
      <p style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</p>
      <p>{error}</p>
    </div>
  )

  // ── Contenido principal según tab activo ───────────────
  function renderContent() {
    if (activeTab === 'orders') {
      return (
        <OrdersView
          commerceId={commerceId}
          onBack={() => setActiveTab('menu')}
        />
      )
    }
    if (activeTab === 'reservations') {
      return (
        <ReservationsView
          commerceId={commerceId}
          user={user}
          settings={settings}
          onBack={() => setActiveTab('menu')}
        />
      )
    }
    // Menú (default)
    return (
      <>
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
          commissionRate={commissionRate}
        />
        <CartFooter onOpen={() => setCartOpen(true)} />
      </>
    )
  }

  return (
    <div>
      <Header
        settings={settings}
        table={table}
        onMenuOpen={() => setDrawerOpen(true)}
        onFilterOpen={handleFilterOpen}
        onSearchOpen={handleSearchOpen}
      />

      {renderContent()}

      {/* Navegación inferior — siempre visible */}
      <BottomNav active={activeTab} onTab={handleTab} activeOrdersCount={activeOrdersCount} />

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
            setActiveTab('menu')
            setTimeout(() => {
              const el = document.getElementById(`cat-${catId}`)
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 50)
          }}
        />
      )}

      {waiterOpen && (
        <WaiterModal
          onClose={() => setWaiterOpen(false)}
          onConfirm={handleWaiterConfirm}
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
          onPayNow={handlePayNow}
        />
      )}

      {successData && (
        <OrderSuccessModal
          orderId={successData.orderId}
          table={successData.table}
          total={successData.total}
          onClose={() => setSuccessData(null)}
          onViewOrders={handleViewOrders}
        />
      )}

      {paymentData && (
        <PaymentModal
          orderId={paymentData.orderId}
          total={paymentData.total}
          commerceId={commerceId}
          settings={settings}
          onClose={() => setPaymentData(null)}
          onViewOrders={handleViewOrders}
        />
      )}
    </div>
  )
}
