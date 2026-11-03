// Live MuleSoft API. Contract (from RAML + Postman collection):
// GET /categories, GET /products?category=&search=, GET /products/{id},
// POST /orders -> 201 {orderId,status,total}, GET /orders/{SF000000} -> Order
// Errors: {code, message, correlationId} with 400/404/409/500/503.
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const CREDS = import.meta.env.VITE_CLIENT_ID
  ? { client_id: import.meta.env.VITE_CLIENT_ID, client_secret: import.meta.env.VITE_CLIENT_SECRET } : {}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`)
    this.status = status; this.code = body?.code; this.correlationId = body?.correlationId
  }
}

async function http(path, { method = 'GET', json } = {}) {
  // Content-Type is only sent on POST so plain GETs stay "simple" requests (no CORS preflight).
  const headers = { ...CREDS, ...(json ? { 'Content-Type': 'application/json' } : {}) }
  let res
  try { res = await fetch(BASE + path, { method, cache: 'no-cache', headers, body: json ? JSON.stringify(json) : undefined }) }
  catch { throw new ApiError(0, { message: 'Could not reach the store. Please check your connection (or the API CORS settings).' }) }
  const text = await res.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { /* non-JSON error */ }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403)
      throw new ApiError(res.status, { message: 'The store API rejected the request (client credentials required).' })
    throw new ApiError(res.status, body || { message: text.slice(0, 120) })
  }
  return body
}

// Fast-load strategy: 60s in-memory cache + one shared in-flight request per URL.
const mem = new Map(), inflight = new Map(), TTL = 60000
function cachedGet(path, ttl = TTL) {
  const hit = mem.get(path)
  if (ttl > 0 && hit && Date.now() - hit.t < ttl) return Promise.resolve(hit.data)
  if (inflight.has(path)) return inflight.get(path)
  const p = http(path).then(d => { mem.set(path, { t: Date.now(), data: d }); return d }).finally(() => inflight.delete(path))
  inflight.set(path, p); return p
}
export const clearCache = () => mem.clear()

export const getCategories = () => cachedGet('/categories', 300000) // rarely changes
export const getProducts = ({ category, search } = {}) => {
  const q = new URLSearchParams()
  if (category) q.set('category', category)
  if (search) q.set('search', search)
  return cachedGet('/products' + (q.toString() ? `?${q}` : ''), 15000) // stock changes, keep short
}
export const getProduct = id => cachedGet(`/products/${encodeURIComponent(id)}`, 0) // always fresh: stock must be accurate
export const createOrder = order => http('/orders', { method: 'POST', json: order }).then(r => { clearCache(); return r }) // stock changed
export const getOrder = code => http(`/orders/${encodeURIComponent(code)}`)

// Remember order codes on this device so customers can re-open them from "Track order".
export const recentOrders = () => { try { return JSON.parse(localStorage.getItem('sakhi-orders')) || [] } catch { return [] } }
export const rememberOrder = code => { try { localStorage.setItem('sakhi-orders', JSON.stringify([code, ...recentOrders().filter(c => c !== code)].slice(0, 5))) } catch { /* ignore */ } }
