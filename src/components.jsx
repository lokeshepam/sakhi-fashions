import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCart } from './cart'
import { getProduct } from './api'

export const inr = n => '₹' + Number(n).toLocaleString('en-IN')
const HEX = { maroon: '#8a2b3d', red: '#b3262f', mint: '#7fb59a', navy: '#2b3a67', mustard: '#d49a22', teal: '#1f7a7a', green: '#5f7f5a', pink: '#d98ca3', blue: '#3f6fa5', yellow: '#e3b73b', orange: '#d9772b', purple: '#6e4b8b', black: '#2b2523', white: '#efe6d6' }

// Warli-style women holding hands; sway makes them gently dance
export function Warli({ n = 9, className = '', sway = false }) {
  return (
    <svg viewBox={`0 0 ${n * 40} 70`} className={className} fill="currentColor" stroke="currentColor" aria-hidden="true">
      <path d={`M0 28H${n * 40}`} strokeWidth="1.4" fill="none" />
      {Array.from({ length: n }, (_, i) => { const x = i * 40 + 20; return (
        <g key={i} className={sway ? 'sway' : ''} style={{ animationDelay: `${i * 0.18}s` }}><circle cx={x} cy="11" r="6" /><path d={`M${x - 9} 20L${x + 9} 20L${x} 38Z`} /><path d={`M${x - 11} 66L${x + 11} 66L${x} 38Z`} /></g>
      ) })}
    </svg>
  )
}

function CartLink({ count }) {
  return (
    <Link to="/cart" className="font-semibold" aria-label={`Cart, ${count} items`}>Cart
      {count > 0 && <span key={count} className="pop ml-1.5 inline-block min-w-5 rounded-full bg-clay px-1.5 text-center text-xs text-paper">{count}</span>}
    </Link>
  )
}

export function Layout({ children }) {
  const { count } = useCart()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const links = [['/', 'Home'], ['/products', 'Shop'], ['/track', 'Track order']]
  const item = ({ isActive }) => `link ${isActive ? 'link-on' : ''}`
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-clay/15 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight">Sakhi<span className="text-clay">.</span> <span className="font-normal text-ink/55">Fashions</span></Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
            {links.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={item}>{l}</NavLink>)}
            <CartLink count={count} />
          </nav>
          <div className="flex items-center gap-4 text-sm md:hidden">
            <CartLink count={count} />
            <button className="rounded-lg border border-clay/30 px-3 py-1" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">☰</button>
          </div>
        </div>
        {open && <nav onClick={() => setOpen(false)} className="fade-up flex flex-col gap-3 border-t border-clay/15 px-4 py-3 font-semibold md:hidden">
          {links.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'text-clay' : '')}>{l}</NavLink>)}</nav>}
      </header>
      <main key={pathname} className="fade-up flex-1">{children}</main>
      <footer className="border-t border-clay/15 py-8 text-center text-sm text-ink/60">
        <Warli n={9} className="mx-auto mb-3 h-8 text-clay/50" />
        <p>© {new Date().getFullYear()} Sakhi Fashions · Handpicked sarees, delivered across India</p>
      </footer>
    </div>
  )
}

export function ProductImage({ product, className = '' }) {
  const url = product.images?.[0]
  if (url) return <img src={url} alt={product.name} loading="lazy" className={`object-cover ${className}`} />
  const hex = HEX[(product.color || '').toLowerCase().split(' ').pop()] || '#b4553a'
  return <div role="img" aria-label={product.name} className={`weave ${className}`} style={{ backgroundColor: hex }} />
}

export function ProductCard({ p, i = 0 }) {
  return (
    <Link to={`/products/${p.id}`} onMouseEnter={() => getProduct(p.id).catch(() => {})} onFocus={() => getProduct(p.id).catch(() => {})}
      className="card lift fade-up group block overflow-hidden" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
      <div className="overflow-hidden"><ProductImage product={p} className="aspect-[3/4] w-full transition duration-500 group-hover:scale-105" /></div>
      <div className="p-3 sm:p-4">
        <h3 className="text-lg font-semibold leading-tight sm:text-xl">{p.name}</h3>
        <p className="text-sm text-ink/55">{p.fabric} · {p.color}</p>
        <p className="mt-1 font-bold text-clay">{inr(p.price)}</p>
        {p.stock < 1 ? <p className="text-xs font-bold text-red-700">Sold out</p> : p.stock <= 3 && <p className="text-xs font-bold text-clay">Only {p.stock} left</p>}
      </div>
    </Link>
  )
}

export const Loading = () => <p className="p-12 text-center text-ink/60">Unrolling the sarees…</p>
export const Skeleton = ({ n = 4 }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4" aria-busy="true" aria-label="Loading sarees">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="card animate-pulse overflow-hidden"><div className="aspect-[3/4] bg-clay/15" /><div className="space-y-2 p-4"><div className="h-4 w-3/4 rounded bg-clay/15" /><div className="h-3 w-1/2 rounded bg-clay/10" /></div></div>
    ))}
  </div>
)
export const ErrorBox = ({ error }) => (
  <div className="m-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900" role="alert">
    <p>{error.message || String(error)}</p>
    {error.correlationId && <p className="mt-1 text-xs opacity-70">Reference: {error.correlationId}</p>}
  </div>
)
