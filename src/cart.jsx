import { createContext, useContext, useEffect, useState } from 'react'
const Ctx = createContext(null)
export const useCart = () => useContext(Ctx)
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sakhi-cart')) || [] } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem('sakhi-cart', JSON.stringify(items)) } catch {} }, [items])
  const add = (product, qty = 1) => setItems(p => {
    const f = p.find(i => i.product.id === product.id)
    return f ? p.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i) : [...p, { product, qty }]
  })
  const setQty = (id, qty) => setItems(p => p.map(i => i.product.id === id ? { ...i, qty: Math.max(1, qty) } : i))
  const remove = id => setItems(p => p.filter(i => i.product.id !== id))
  const clear = () => setItems([])
  const count = items.reduce((s, i) => s + i.qty, 0)
  const total = items.reduce((s, i) => s + i.qty * i.product.price, 0)
  return <Ctx.Provider value={{ items, add, setQty, remove, clear, count, total }}>{children}</Ctx.Provider>
}
