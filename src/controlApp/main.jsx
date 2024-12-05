import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainControlApp from './ControlApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainControlApp />
  </StrictMode>,
)
