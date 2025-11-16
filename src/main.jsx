// DOIT ÊTRE LA PREMIÈRE IMPORT !
import './lib/env'
import './lib/consolePatch'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/responsive.css'
import './styles/form-animations.css'
import './styles/animations.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

