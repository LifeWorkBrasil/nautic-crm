import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { listMinhasPermissoes, getEmpresaConfig } from '@/lib/api'
import type { EmpresaConfig, UsuarioPerfil } from '@/types'

interface PermissoesContextValue {
  perfil: UsuarioPerfil | null
  empresaConfig: EmpresaConfig | null
  ramoNautico: boolean
  usaCaptacao: boolean
  usaMotores: boolean
  carregando: boolean
  temPermissao: (tabKey: string) => boolean
  temAlgumaPermissao: (prefixo: string) => boolean
}

const PermissoesContext = createContext<PermissoesContextValue>({
  perfil: null,
  empresaConfig: null,
  ramoNautico: true,
  usaCaptacao: true,
  usaMotores: true,
  carregando: true,
  temPermissao: () => false,
  temAlgumaPermissao: () => false,
})

export function PermissoesProvider({
  session,
  children,
}: {
  session: Session | null
  children: ReactNode
}) {
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null)
  const [tabKeys, setTabKeys] = useState<Set<string>>(new Set())
  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!session) {
      setPerfil(null)
      setTabKeys(new Set())
      setEmpresaConfig(null)
      setCarregando(false)
      return
    }
    setCarregando(true)
    listMinhasPermissoes()
      .then(({ perfil, tabKeys }) => {
        setPerfil(perfil)
        setTabKeys(new Set(tabKeys))
      })
      .finally(() => setCarregando(false))
    getEmpresaConfig()
      .then(setEmpresaConfig)
      .catch(() => {})
  }, [session])

  function temPermissao(tabKey: string): boolean {
    if (perfil?.is_admin) return true
    return tabKeys.has(tabKey)
  }

  function temAlgumaPermissao(prefixo: string): boolean {
    if (perfil?.is_admin) return true
    for (const chave of tabKeys) {
      if (chave.startsWith(prefixo)) return true
    }
    return false
  }

  return (
    <PermissoesContext.Provider
      value={{
        perfil,
        empresaConfig,
        ramoNautico: empresaConfig?.ramo_nautico ?? true,
        usaCaptacao: empresaConfig?.usa_captacao ?? true,
        usaMotores: empresaConfig?.usa_motores ?? true,
        carregando,
        temPermissao,
        temAlgumaPermissao,
      }}
    >
      {children}
    </PermissoesContext.Provider>
  )
}

export function usePermissoes() {
  return useContext(PermissoesContext)
}
