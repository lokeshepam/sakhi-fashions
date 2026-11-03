import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CartProvider } from './cart'
import './index.css'
import { getProducts, getCategories } from './api'
getProducts().catch(() => {}); getCategories().catch(() => {}) // warm-up
createRoot(document.getElementById('root')).render(
  <BrowserRouter><CartProvider><App /></CartProvider></BrowserRouter>
)
