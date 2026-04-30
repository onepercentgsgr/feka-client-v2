import { Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
    </Routes>
  )
}

export default App
