import { useEffect, useState } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { PermissoesProvider } from '@/lib/PermissoesContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import CRM from './pages/CRM'
import CadastroClientes from './pages/CadastroClientes'
import Captacao from './pages/Captacao'
import ProdutosTerceiros from './pages/ProdutosTerceiros'
import Catalogo from './pages/Catalogo'
import Parametrizacao from './pages/Parametrizacao'
import Orcamentos from './pages/Orcamentos'
import Empresa from './pages/Empresa'
import Marketing from './pages/Marketing'
import Admin from './pages/Admin'
import Relatorios from './pages/Relatorios'
import CatalogoPdf from './pages/CatalogoPdf'
import ProdutoPublico from './pages/ProdutoPublico'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (carregando) {
    return <div className="flex min-h-screen items-center justify-center bg-hull-900" />
  }

  return (
    <Routes>
      <Route path="/p/:linkId" element={<ProdutoPublico />} />
      {!session ? (
        <Route path="*" element={<Login />} />
      ) : (
        <Route element={<PermissoesProvider session={session}><Outlet /></PermissoesProvider>}>
          <Route element={<Layout />}>
            <Route path="/" element={<CRM />} />
            <Route path="/cadastro-clientes" element={<CadastroClientes />} />
            <Route path="/captacao" element={<Captacao />} />
            <Route path="/produtos-terceiros" element={<ProdutosTerceiros />} />
            <Route path="/catalogo/:subcategoriaId" element={<Catalogo />} />
            <Route path="/parametrizacao" element={<Parametrizacao />} />
            <Route path="/orcamentos" element={<Orcamentos />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/catalogo-pdf" element={<CatalogoPdf />} />
            <Route path="/empresa" element={<Empresa />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>
        </Route>
      )}
    </Routes>
  )
}
