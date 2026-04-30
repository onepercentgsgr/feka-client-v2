import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([]) // [{ product, qty }]

  const addItem = useCallback((product) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
        return next
      }
      return [...prev, { product, qty: 1 }]
    })
    try { if (navigator.vibrate) navigator.vibrate(40) } catch (_) {}
  }, [])

  const removeItem = useCallback((productId) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.product.id === productId)
      if (idx < 0) return prev
      const next = [...prev]
      if (next[idx].qty > 1) {
        next[idx] = { ...next[idx], qty: next[idx].qty - 1 }
      } else {
        next.splice(idx, 1)
      }
      return next
    })
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
