import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import MenuPage from './pages/MenuPage'

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<MenuPage />} />
      </Routes>
    </CartProvider>
  )
}

export default App
