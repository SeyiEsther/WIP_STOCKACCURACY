// ─── Application entry point ─────────────────────────────────────────────────
// This is the very first file the browser runs. Its only job is to take our
// top-level <App /> component and "mount" it into the page — i.e. draw it inside
// the <div id="root"> element defined in index.html. Everything you see in the
// UI is rendered from App.jsx downward. New to the project? Start reading there.

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'   // global styles + the CSS colour variables (var(--blue) etc.)

// Find <div id="root"> in index.html and render our whole app inside it.
// <React.StrictMode> is a development-only helper that surfaces potential bugs;
// it has no effect on the production build.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
