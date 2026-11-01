import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from './cart'

export const inr = n => '₹' + Number(n).toLocaleString('en-IN')
const HEX = { maroon: '#8a2b3d', red: '#b3262f', mint: '#7fb59a', navy: '#2b3a67', mustard: '#d49a22', teal: '#1f7a7a', green: '#5f7f5a', pink: '#d98ca3', blue: '#3f6fa5', yellow: '#e3b73b', orange: '#d9772b', purple: '#6e4b8b', black: '#2b2523', white: '#efe6d6' }

// Warli-style women holding hands in a circle dance
export function Warli({ n = 9, className = '' }) {
  return (
    <svg viewBox={`0 0 ${n * 40} 70`} className={className} fill="currentColor" stroke="currentColor" aria-hidden="true">
      <path d={`M0 28H${n * 40}`} strokeWidth="1.6" fill="none" />
      {Array.from({ length: n }, (_, i) => { const x = i * 40 + 20; return (
        <g key={i}><circle cx={x} cy="11" r="6" /><path d={`M${x - 9} 20L${x + 9} 20L${x} 38Z`} /><path d={`M${x - 11} 66L${x + 11} 66L${x} 38Z`} /></g>
      ) })}
    </svg>
  )
}

export function Layout({ children }) {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const cls = ({ isActive }) => `block py-2 md:py-0 ${isActive ? 'text-turmeric' : 'hover:text-turmeric'}`
  const links = [['/', 'Home'], ['/products', 'Shop'], ['/track', 'Track order'], ['/cart', `Cart (${count})`]]
  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative bg-clay-dark text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-display text-2xl font-semibold md:text-3xl">Sakhi <span className="text-turmeric">Fashions</span></Link>
          <button className="rounded border border-paper/40 px-3 py-1 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">☰</button>
          <nav onClick={() => setOpen(false)} className={`${open ? 'block' : 'hidden'} absolute inset-x-0 top-full z-10 bg-clay-dark px-4 pb-3 text-sm font-bold md:static md:flex md:gap-7 md:bg-transparent md:p-0`}>
            {links.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={cls}>{l}</NavLink>)}
          </nav>
        </div>
        <div className="band" />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-clay-dark pb-6 text-center text-sm text-paper/80">
        <div className="band" />
        <Warli n={11} className="mx-auto mt-5 h-12 text-turmeric/70" />
        <p className="mt-3">© {new Date().getFullYear()} Sakhi Fashions · Sarees chosen like a friend would, delivered across India</p>
      </footer>
    </div>
  )
}

export function ProductImage({ product, className = '' }) {
  const url = product.images?.[0]
  if (url) return <img src={url} alt={product.name} loading="lazy" className={`object-cover ${className}`} />
  const hex = HEX[(product.color || '').toLowerCase().split(' ').pop()] || '#b4553a'
  return <div role="img" aria-label={product.name} className={`weave flex items-end ${className}`} style={{ backgroundColor: hex }}><div className="band w-full" /></div>
}

export function ProductCard({ p }) {
  return (
    <Link to={`/products/${p.id}`} className="card group block overflow-hidden">
      <ProductImage product={p} className="aspect-[3/4] w-full" />
      <div className="p-3 sm:p-4">
        <h3 className="text-lg font-semibold leading-tight group-hover:text-clay sm:text-xl">{p.name}</h3>
        <p className="text-sm text-ink/60">{p.fabric} · {p.color}</p>
        <p className="mt-1 font-bold text-clay-dark">{inr(p.price)}</p>
        {p.stock < 1 ? <p className="text-xs font-bold text-red-700">Sold out</p> : p.stock <= 3 && <p className="text-xs font-bold text-clay">Only {p.stock} left</p>}
      </div>
    </Link>
  )
}

export const Loading = () => <p className="p-12 text-center text-ink/60">Unrolling the sarees…</p>
export const ErrorBox = ({ error }) => (
  <div className="m-4 rounded-md border border-red-300 bg-red-50 p-4 text-red-900" role="alert">
    <p>{error.message || String(error)}</p>
    {error.correlationId && <p className="mt-1 text-xs opacity-70">Reference: {error.correlationId}</p>}
  </div>
)
