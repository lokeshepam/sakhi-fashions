import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getCategories, getProducts, getProduct, createOrder, getOrder, recentOrders, rememberOrder } from './api'
import { useCart } from './cart'
import { inr, ProductCard, ProductImage, Loading, Skeleton, ErrorBox, Warli } from './components'

// Stale-while-revalidate: show the last good result instantly, refresh in the background.
function useFetch(fn, deps, key) {
  const read = () => { try {
    if (!key) return null
    const v = JSON.parse(localStorage.getItem('sakhi-c:' + key))
    if (v || !key.startsWith('p:')) return v
    return (JSON.parse(localStorage.getItem('sakhi-c:products:')) || []).find(x => String(x.id) === key.slice(2)) || null
  } catch { return null } }
  const [s, set] = useState(() => { const d = read(); return { data: d, error: null, loading: !d } })
  useEffect(() => {
    let live = true
    const d = read()
    set({ data: d, error: null, loading: !d })
    fn().then(data => {
      if (!live) return
      set({ data, error: null, loading: false })
      if (key) try { localStorage.setItem('sakhi-c:' + key, JSON.stringify(data)) } catch { /* storage full or blocked */ }
    }).catch(error => live && set(x => x.data ? { ...x, loading: false } : { data: null, error, loading: false }))
    return () => { live = false }
  }, deps)
  return s
}

export function Home() {
  const { data, loading, error } = useFetch(getProducts, [], 'products:')
  const cats = useFetch(getCategories, [], 'categories')
  const d = ms => ({ animationDelay: ms + 'ms' })
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-14 text-center sm:pt-24">
        <p className="fade-up text-sm font-bold uppercase tracking-[.3em] text-clay">Sakhi Fashions</p>
        <h1 className="fade-up mx-auto mt-5 max-w-3xl text-5xl font-bold leading-[1.05] sm:text-7xl" style={d(100)}>Sarees with a <span className="mark">story</span> to tell.</h1>
        <p className="fade-up mx-auto mt-5 max-w-md text-lg text-ink/70" style={d(200)}>Handpicked silk, cotton and bridal weaves, like the ones in your grandmother’s trunk.</p>
        <Link to="/products" className="btn fade-up mt-8" style={d(300)}>Explore the collection</Link>
        <Warli n={15} sway className="mx-auto mt-14 h-12 w-full max-w-3xl text-clay/80" />
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="mr-2 font-display text-2xl">Shop by weave</span>
          {(cats.data || []).map(c => <Link key={c.id} to={`/products?category=${encodeURIComponent(c.name)}`} className="chip">{c.name}</Link>)}
        </div>
        {loading ? <Skeleton /> : error ? <ErrorBox error={error} /> :
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{data.slice(0, 4).map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div>}
        <Link to="/products" className="link mt-8 inline-block font-bold">See all sarees →</Link>
      </section>
      <section className="border-t border-clay/15">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-center sm:grid-cols-3">
          {[['Pay on delivery', 'Cash on delivery, no advance needed.'], ['Track your order', 'Use your order code (SF…) any time.'], ['Handpicked stock', 'Small batches, real fabrics.']].map(([t, x], i) => (
            <div key={t} className="fade-up" style={d(i * 120)}><h3 className="text-xl font-semibold text-clay">{t}</h3><p className="mt-1 text-ink/70">{x}</p></div>))}
        </div>
      </section>
    </>
  )
}

export function Products() {
  const [params, setParams] = useSearchParams()
  const g = k => params.get(k) || ''
  const [category, search, fabric, sort, stock] = ['category', 'search', 'fabric', 'sort', 'stock'].map(g)
  const [q, setQ] = useState(search)
  const cats = useFetch(getCategories, [], 'categories')
  const { data, loading, error } = useFetch(() => getProducts({ category, search }), [category, search], search ? null : 'products:' + category)
  const set = (k, v) => setParams(p => { const n = new URLSearchParams(p); v ? n.set(k, v) : n.delete(k); return n }, { replace: true })
  useEffect(() => { const t = setTimeout(() => q !== search && set('search', q.trim()), 400); return () => clearTimeout(t) }, [q])
  const fabrics = [...new Set((data || []).map(p => p.fabric).filter(Boolean))]
  let list = (data || []).filter(p => (!fabric || p.fabric === fabric) && (!stock || p.stock > 0))
  if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price)
  if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price)
  if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-5 text-4xl font-bold text-clay-dark sm:text-5xl">The collection</h1>
      <input className="input mb-4" type="search" placeholder="Search by name, fabric or colour…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search sarees" />
      <div className="mb-4 flex flex-wrap gap-2">
        {[{ id: 0, name: '' }, ...(cats.data || [])].map(c => <button key={c.id} onClick={() => set('category', c.name)} className={`chip ${category === c.name ? 'chip-on' : ''}`}>{c.name || 'All'}</button>)}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <select className="input w-auto" value={fabric} onChange={e => set('fabric', e.target.value)} aria-label="Fabric"><option value="">All fabrics</option>{fabrics.map(f => <option key={f}>{f}</option>)}</select>
        <select className="input w-auto" value={sort} onChange={e => set('sort', e.target.value)} aria-label="Sort"><option value="">Sort: Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="name">Name A–Z</option></select>
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!stock} onChange={e => set('stock', e.target.checked ? '1' : '')} /> In stock only</label>
        {(category || search || fabric || sort || stock) && <button className="underline" onClick={() => { setQ(''); setParams({}) }}>Clear all</button>}
      </div>
      {loading ? <Skeleton /> : error ? <ErrorBox error={error} /> : list.length === 0
        ? <div className="py-12 text-center"><Warli n={5} className="mx-auto h-12 text-clay/60" /><p className="mt-3">No sarees match these filters. Try clearing a few.</p></div>
        : <><p className="mb-3 text-sm text-ink/60">{list.length} saree{list.length > 1 && 's'}</p><div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{list.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div></>}
    </div>
  )
}

export function ProductDetail() {
  const { id } = useParams()
  const { add } = useCart()
  const nav = useNavigate()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { data: p, loading, error } = useFetch(() => getProduct(id), [id], 'p:' + id)
  if (loading) return <Loading />
  if (error) return error.status === 404 ? <p className="p-12 text-center">This saree is no longer available. <Link className="underline" to="/products">Back to shop</Link></p> : <ErrorBox error={error} />
  const out = p.stock < 1
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2 md:gap-12">
      <ProductImage product={p} className="card aspect-[3/4] w-full" />
      <div>
        <Link to="/products" className="text-sm underline">← All sarees</Link>
        <h1 className="mt-2 text-4xl font-bold text-clay-dark sm:text-5xl">{p.name}</h1>
        <p className="mt-1 text-ink/60">{p.category} · {p.fabric} · {p.color}</p>
        <p className="mt-4 text-3xl font-bold text-clay">{inr(p.price)}</p>
        <p className="mt-5 max-w-prose leading-relaxed">{p.description}</p>
        <p className={`mt-4 text-sm font-bold ${out ? 'text-red-700' : 'text-leaf'}`}>{out ? 'Sold out' : `${p.stock} in stock`}</p>
        {!out && <div className="mt-5 flex items-center gap-3"><label htmlFor="q" className="font-semibold">Qty</label>
          <input id="q" type="number" min="1" max={p.stock} value={qty} onChange={e => setQty(Math.min(p.stock, Math.max(1, +e.target.value || 1)))} className="input w-20" /></div>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn" disabled={out} onClick={() => { add(p, qty); setAdded(true) }}>{added ? 'Added ✓' : 'Add to cart'}</button>
          <button className="btn btn-alt" disabled={out} onClick={() => { add(p, qty); nav('/cart') }}>Buy now</button>
        </div>
      </div>
    </div>
  )
}

export function Cart() {
  const { items, setQty, remove, clear, add, total } = useCart()
  const [undo, setUndo] = useState(null)
  const del = it => { remove(it.product.id); setUndo(it) }
  if (!items.length) return (
    <div className="p-16 text-center">
      <Warli n={5} sway className="mx-auto mb-4 h-12 text-clay/60" /><p className="mb-4">Your cart is empty.</p>
      {undo && <p className="mb-4 text-sm">Removed {undo.product.name}. <button className="underline" onClick={() => { add(undo.product, undo.qty); setUndo(null) }}>Undo</button></p>}
      <Link to="/products" className="btn">Browse sarees</Link>
    </div>)
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-baseline justify-between"><h1 className="text-4xl font-bold">Your cart</h1><button onClick={() => { items.forEach(i => remove(i.product.id)); clear() }} className="text-sm underline">Clear cart</button></div>
      {undo && <p className="fade-up mb-4 rounded-lg bg-sand px-4 py-2 text-sm">Removed {undo.product.name}. <button className="font-bold underline" onClick={() => { add(undo.product, undo.qty); setUndo(null) }}>Undo</button></p>}
      {items.map(it => { const { product: p, qty } = it; return (
        <div key={p.id} className="card fade-up mb-3 flex flex-wrap items-center gap-3 p-3">
          <ProductImage product={p} className="h-24 w-20 shrink-0 rounded-lg" />
          <div className="min-w-40 flex-1"><p className="font-display text-xl font-semibold">{p.name}</p><p className="text-sm text-ink/60">{inr(p.price)} each</p></div>
          <div className="inline-flex items-center rounded-full border border-clay/30">
            <button className="h-9 w-9 text-lg transition active:scale-90" onClick={() => qty > 1 ? setQty(p.id, qty - 1) : del(it)} aria-label={qty > 1 ? 'Reduce quantity' : 'Remove item'}>−</button>
            <span key={qty} className="pop w-8 text-center font-bold">{qty}</span>
            <button className="h-9 w-9 text-lg transition active:scale-90 disabled:opacity-30" disabled={qty >= p.stock} onClick={() => setQty(p.id, qty + 1)} aria-label="Increase quantity">+</button>
          </div>
          <p className="w-24 text-right font-bold text-clay">{inr(p.price * qty)}</p>
          <button onClick={() => del(it)} className="text-sm text-red-700 underline">Remove</button>
        </div>) })}
      <p className="mt-6 text-right text-2xl font-bold">Total: {inr(total)}</p>
      <div className="mt-4 text-right"><Link to="/checkout" className="btn">Checkout</Link></div>
    </div>
  )
}

export function Checkout() {
  const { items, total, clear } = useCart()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', phone: '', email: '', line1: '', city: '', state: '', pincode: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  if (!items.length) return <p className="p-16 text-center">Add a saree to your cart first. <Link to="/products" className="underline">Shop</Link></p>
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr(null)
    try {
      const r = await createOrder({
        customer: { name: f.name.trim(), phone: f.phone, email: f.email.trim() },
        address: { line1: f.line1.trim(), city: f.city.trim(), state: f.state.trim(), pincode: f.pincode },
        items: items.map(i => ({ productId: i.product.id, qty: i.qty })), paymentMethod: 'COD',
      })
      rememberOrder(r.orderId); clear(); nav(`/order/${r.orderId}`)
    } catch (x) { setErr(x); setBusy(false) }
  }
  const field = (k, label, props = {}) => (
    <label className="block text-sm font-bold">{label}
      <input required className="input mt-1 font-normal" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} {...props} />
    </label>)
  return (
    <form onSubmit={submit} className="mx-auto grid max-w-3xl gap-4 px-4 py-8 sm:grid-cols-2">
      <h1 className="text-4xl font-bold text-clay-dark sm:col-span-2">Checkout</h1>
      {field('name', 'Full name', { autoComplete: 'name' })}
      {field('phone', 'Mobile number', { type: 'tel', inputMode: 'numeric', pattern: '[0-9]{10}', title: '10-digit mobile number', autoComplete: 'tel' })}
      <div className="sm:col-span-2">{field('email', 'Email', { type: 'email', autoComplete: 'email' })}</div>
      <div className="sm:col-span-2">{field('line1', 'Address', { autoComplete: 'street-address' })}</div>
      {field('city', 'City')}{field('state', 'State')}
      {field('pincode', 'Pincode', { inputMode: 'numeric', pattern: '[0-9]{6}', title: '6-digit pincode' })}
      <div className="card p-4 sm:col-span-2">
        {items.map(i => <p key={i.product.id} className="flex justify-between text-sm"><span>{i.product.name} × {i.qty}</span><span>{inr(i.product.price * i.qty)}</span></p>)}
        <p className="mt-2 flex justify-between border-t border-clay/20 pt-2 text-xl font-bold"><span>Total (Cash on delivery)</span><span>{inr(total)}</span></p>
      </div>
      <div className="sm:col-span-2">
        {err && <ErrorBox error={err.status === 409 ? Object.assign(err, { message: 'Sorry, one or more sarees just went out of stock. Please review your cart.' }) : err} />}
        <button className="btn w-full sm:w-auto" disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</button>
      </div>
    </form>
  )
}

const STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED']
function OrderDetails({ o }) {
  const at = STEPS.indexOf(o.status)
  return (
    <div className="card mt-6 p-5 text-left">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-3xl font-semibold text-clay-dark">{o.orderId}</h2>
        {o.createdAt && <p className="text-sm text-ink/60">Placed {new Date(o.createdAt).toLocaleString('en-IN')}</p>}</div>
      {o.status === 'CANCELLED' ? <p className="mt-3 font-bold text-red-700">This order was cancelled.</p> :
        <ol className="mt-4 grid grid-cols-4 gap-1 text-center text-xs font-bold sm:text-sm">
          {STEPS.map((s, i) => <li key={s}><div className={`mx-auto mb-1 h-3 w-3 rounded-full ${i <= at ? 'bg-leaf' : 'bg-clay/25'}`} /><span className={i <= at ? 'text-leaf' : 'text-ink/50'}>{s[0] + s.slice(1).toLowerCase()}</span></li>)}
        </ol>}
      <div className="mt-5 divide-y divide-clay/15">
        {o.items?.map(i => <p key={i.productId} className="flex justify-between py-2 text-sm"><span>{i.name} × {i.qty}</span><span>{inr(i.unitPrice * i.qty)}</span></p>)}
      </div>
      <p className="mt-2 flex justify-between text-xl font-bold"><span>Total ({o.paymentMethod})</span><span>{inr(o.total)}</span></p>
      {o.address && <p className="mt-4 text-sm text-ink/70">Delivering to {o.customer?.name}, {o.address.line1}, {o.address.city}, {o.address.state} {o.address.pincode}</p>}
    </div>
  )
}

export function Confirmation() {
  const { id } = useParams()
  const { data: o, loading, error } = useFetch(() => getOrder(id), [id])
  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <Warli n={7} className="mx-auto h-12 text-clay" />
      <h1 className="mt-4 text-5xl font-bold text-clay-dark">Thank you!</h1>
      <p className="mt-3">Your order <b>{id}</b> is placed. Save this code to track it.</p>
      {loading ? <Loading /> : error ? <ErrorBox error={error} /> : <OrderDetails o={o} />}
      <Link to="/products" className="btn mt-8">Continue shopping</Link>
    </div>
  )
}

export function Track() {
  const [params, setParams] = useSearchParams()
  const code = (params.get('code') || '').toUpperCase()
  const [input, setInput] = useState(code)
  const valid = /^SF[0-9]{6}$/.test(code)
  const { data: o, loading, error } = useFetch(() => valid ? getOrder(code) : Promise.resolve(null), [code])
  const recent = recentOrders()
  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-center">
      <h1 className="text-4xl font-bold text-clay-dark sm:text-5xl">Track your order</h1>
      <form onSubmit={e => { e.preventDefault(); setParams({ code: input.trim().toUpperCase() }) }} className="mt-5 flex gap-2">
        <input className="input" placeholder="e.g. SF000001" value={input} onChange={e => setInput(e.target.value)} aria-label="Order code" />
        <button className="btn">Track</button>
      </form>
      {recent.length > 0 && <p className="mt-3 text-sm">Recent: {recent.map(c => <button key={c} className="chip mx-1" onClick={() => { setInput(c); setParams({ code: c }) }}>{c}</button>)}</p>}
      {code && !valid && <p className="mt-4 text-red-700">Order codes look like SF000001 (SF followed by 6 digits).</p>}
      {valid && (loading ? <Loading /> : error ? (error.status === 404 ? <p className="mt-6">We couldn’t find order {code}. Please check the code.</p> : <ErrorBox error={error} />) : o && <OrderDetails o={o} />)}
    </div>
  )
}
