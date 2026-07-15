import { NavLink, Outlet } from 'react-router-dom'
import { Anchor, LayoutGrid, Settings2, FileText, Building2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { to: '/', label: 'CRM & Funil', icon: LayoutGrid, end: true },
  { to: '/parametrizacao', label: 'Parametrização', icon: Settings2 },
  { to: '/orcamentos', label: 'Gerador de Orçamentos', icon: FileText },
  { to: '/empresa', label: 'Empresa & Marca', icon: Building2 },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-foam-100">
      <aside className="flex w-64 shrink-0 flex-col bg-hull-900 text-foam-100">
        <div className="flex items-center gap-3 px-6 py-7">
          <Anchor className="h-6 w-6 text-brass-400" strokeWidth={1.75} />
          <div>
            <p className="font-display text-lg leading-none tracking-tight text-foam-50">
              Estaleiro
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brass-400/80">
              CRM &amp; Orçamentos
            </p>
          </div>
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
            modelos vêm do Supabase — nada fica hardcoded na proposta.
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
