import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Anchor,
  LayoutGrid,
  Settings2,
  FileText,
  Building2,
  LogOut,
  ChevronDown,
  Sailboat,
  Compass,
  Layers,
  ClipboardList,
  Megaphone,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { listCategorias, listSubcategorias } from '@/lib/api'
import type { CategoriaProduto, SubcategoriaProduto } from '@/types'

const CATEGORIA_ICONES: Record<string, typeof Sailboat> = {
  Náutica: Sailboat,
  Adventure: Compass,
  'Projetos Especiais': Layers,
}

const NAV_ITEMS_FIXOS = [
  { to: '/', label: 'CRM & Funil', icon: LayoutGrid, end: true },
  { to: '/captacao', label: 'Captação', icon: ClipboardList },
  { to: '/parametrizacao', label: 'Parametrização', icon: Settings2 },
  { to: '/orcamentos', label: 'Gerador de Orçamentos', icon: FileText },
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/empresa', label: 'Empresa & Marca', icon: Building2 },
]

export default function Layout() {
  const location = useLocation()
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([])
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listCategorias(), listSubcategorias()]).then(([c, s]) => {
      setCategorias(c)
      setSubcategorias(s)
      const atual = s.find((sub) => location.pathname === `/catalogo/${sub.id}`)
      if (atual) setGrupoAberto(atual.categoria_id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen bg-foam-100">
      <aside className="flex w-64 shrink-0 flex-col bg-hull-900 text-foam-100">
        <div className="flex items-center gap-3 px-6 py-7">
          <Anchor className="h-6 w-6 text-brass-400" strokeWidth={1.75} />
          <div>
            <p className="font-display text-lg leading-none tracking-tight text-foam-50">
              Gestão de
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brass-400/80">
              Negócios
            </p>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {categorias.map((categoria) => {
            const filhas = subcategorias.filter((s) => s.categoria_id === categoria.id)
            const Icon = CATEGORIA_ICONES[categoria.nome] ?? LayoutGrid
            const aberto = grupoAberto === categoria.id
            const temFilhaAtiva = filhas.some((s) => location.pathname === `/catalogo/${s.id}`)

            return (
              <div key={categoria.id}>
                <button
                  onClick={() => setGrupoAberto(aberto ? null : categoria.id)}
                  className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    temFilhaAtiva
                      ? 'bg-hull-800 text-foam-50'
                      : 'text-slate-400 hover:bg-hull-800/60 hover:text-foam-100'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      temFilhaAtiva ? 'text-brass-400' : 'text-slate-400 group-hover:text-brass-400'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span className={`flex-1 text-left ${temFilhaAtiva ? 'wake-underline' : ''}`}>
                    {categoria.nome}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
                    strokeWidth={1.75}
                  />
                </button>
                {aberto && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-hull-800 pl-4">
                    {filhas.map((sub) => (
                      <NavLink
                        key={sub.id}
                        to={`/catalogo/${sub.id}`}
                        className={({ isActive }) =>
                          `rounded-md px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? 'bg-hull-800 text-brass-400'
                              : 'text-slate-400 hover:bg-hull-800/60 hover:text-foam-100'
                          }`
                        }
                      >
                        {sub.nome}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="my-2 border-t border-hull-800" />

          {NAV_ITEMS_FIXOS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-hull-800 text-foam-50'
                    : 'text-slate-400 hover:bg-hull-800/60 hover:text-foam-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-brass-400' : 'text-slate-400 group-hover:text-brass-400'}`}
                    strokeWidth={1.75}
                  />
                  <span className={isActive ? 'wake-underline' : ''}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-6 py-6">
          <p className="text-[11px] leading-relaxed text-slate-400">
            <span className="text-brass-400/90 font-medium">Casco parametrizado.</span> Preços e
            produtos vêm do Supabase — nada fica hardcoded na proposta.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-4 flex items-center gap-2 text-xs text-slate-400 hover:text-foam-100"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
