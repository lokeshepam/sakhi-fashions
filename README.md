# Sakhi Fashions: React storefront

React + Vite + Tailwind v4, tribal/Warli-inspired nostalgic theme, mobile-first.
Features: browse, live search, category + fabric filters, sort, in-stock toggle, product detail, cart (saved on device),
COD checkout with validation, order confirmation, **track order** page (`/track`, remembers recent codes).

    npm install
    npm run dev        # http://localhost:5173
    npm run build

## Configuration (`.env`)
`VITE_API_BASE_URL` = CloudHub URL **including `/api`** (already set). All calls are in `src/api.js`.

## API analysis (RAML + Postman collection)
- Postman `baseUrl` is `http://localhost:8081` but the paths have no `/api`; the RAML and the CloudHub URL use `/api`. The site uses `<base>/api/...`.
- Postman requests send `client_id` / `client_secret` headers, so **Client ID Enforcement is ON**. The collection has no saved response bodies, so response shapes were taken from the RAML:
  Product `{id,name,category,fabric,color,price,stock,description,images[]}`, OrderCreated `{orderId,status,total}`, Order (adds `createdAt, customer, address, items[{productId,name,qty,unitPrice}]`), errors `{code,message,correlationId}`.
- Not verified live: I could not call your CloudHub URL from my environment.

## Important: Client ID policy vs a public website
Browser code is visible to everyone, so a client secret in `VITE_CLIENT_SECRET` is NOT secret. Also the browser's CORS preflight (OPTIONS) carries no credentials, so the policy rejects it with 401 and the site fails.
Recommended for this POC: in API Manager, **remove Client ID Enforcement** and add the **CORS** policy (allowed origin = your site URL; methods GET, POST, OPTIONS). Plain GETs from this site send no custom headers, so they need no preflight; `POST /orders` does (Content-Type JSON), so CORS must allow it.
If you must keep the policy, set `VITE_CLIENT_ID/SECRET` and allow headers `client_id, client_secret, Content-Type` in CORS, accepting that they are public.

## Suggestions
- Add real photos: return `image_url` per product from the DB (Cloudinary free tier); the site shows them automatically.
- Deploy on Vercel/Netlify free (build `npm run build`, output `dist`), then set the CORS origin to that URL.
- Later: order status updates (SHIPPED/DELIVERED) from an admin flow, and a `GET /orders?phone=` lookup so customers don't need the code.
