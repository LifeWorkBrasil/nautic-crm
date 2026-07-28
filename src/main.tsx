import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Depois de um deploy novo, uma aba já aberta ainda referencia os nomes de arquivo antigos dos
// pedaços carregados sob demanda (ex: o modal de gerar flyer) — o navegador tenta buscar um
// arquivo que não existe mais e quebra com "Failed to fetch dynamically imported module". Um
// recarregamento resolve; o guard evita ficar recarregando em loop se o problema persistir.
window.addEventListener('vite:preloadError', () => {
  const jaTentouRecarregar = sessionStorage.getItem('recarregou_apos_erro_chunk')
  if (jaTentouRecarregar) return
  sessionStorage.setItem('recarregou_apos_erro_chunk', '1')
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/nautic-crm">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
