import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos/global.css'
import './estilos/componentes.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
