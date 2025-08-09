import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/src/sw.js').catch(()=>{}));
}
createRoot(document.getElementById('root')).render(<App />)
