import { Routes, Route } from 'react-router-dom'
import { Layout } from './components'
import { Home, Products, ProductDetail, Cart, Checkout, Confirmation, Track } from './pages'
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:id" element={<Confirmation />} />
        <Route path="/track" element={<Track />} />
        <Route path="*" element={<p className="p-16 text-center">Page not found.</p>} />
      </Routes>
    </Layout>
  )
}
