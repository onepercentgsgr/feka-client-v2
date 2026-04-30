import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import MenuPage from './pages/MenuPage'
import ToastContainer from './components/Toast'

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<MenuPage />} />
      </Routes>
      <ToastContainer />
    </CartProvider>
  )
}

export default App
