import { useEffect, useRef, useState } from 'react'
import { Building2, UploadCloud, Save, Check } from 'lucide-react'
import { getEmpresaConfig, updateEmpresaConfig, uploadLogoEmpresa } from '@/lib/api'
import type { EmpresaConfig } from '@/types'

export default function Empresa() {
  const [config, setConfig] = useState<EmpresaConfig | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getEmpresaConfig()
      .then(setConfig)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  function campo<K extends keyof EmpresaConfig>(chave: K, valor: EmpresaConfig[K]) {
    setConfig((prev) => (prev ? { ...prev, [chave]: valor } : prev))
    setSalvo(false)
  }

  async function handleSalvar() {
    if (!config) return
    setSalvando(true)
    setErro(null)
    try {
      await updateEmpresaConfig(config.id, {
        nome_empresa: config.nome_empresa,
        cnpj: config.cnpj,
        endereco: config.endereco,
        telefone: config.telefone,
        email: config.email,
        site: config.site,
        validade_orcamento_dias: config.validade_orcamento_dias,
        termos_condicoes: config.termos_condicoes,
      })
      setSalvo(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleLogoSelecionada(file: File) {
    if (!config) return
    setEnviandoLogo(true)
    setErro(null)
    try {
      const url = await uploadLogoEmpresa(file)
      await updateEmpresaConfig(config.id, { logo_url: url })
      setConfig((prev) => (prev ? { ...prev, logo_url: url } : prev))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar logo')
    } finally {
      setEnviandoLogo(false)
    }
  }

  if (carregando) {
    return <div className="p-8 text-sm text-slate-400">Carregando configurações…</div>
  }

  if (!config) {
    return (
      <div className="p-8 text-sm text-signal-red">
        Não foi possível carregar a configuração da empresa. {erro}
      </div>
    )
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">
          Identidade usada nas propostas
        </p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          Empresa &amp; Marca
        </h1>
      </header>

      {erro && (
        <div className="mb-5 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Logo */}
        <div className="rounded-md border border-foam-200 bg-white p-5">
          <p className="mb-3 text-sm font-medium text-hull-900">Logo</p>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-dashed border-foam-200 bg-foam-100">
            {config.logo_url ? (
              <img
                src={config.logo_url}
                alt="Logo da empresa"
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <Building2 className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleLogoSelecionada(file)
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={enviandoLogo}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400 disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" strokeWidth={1.75} />
            {enviandoLogo ? 'Enviando…' : 'Enviar novo logo'}
          </button>
          <p className="mt-2 text-[11px] text-slate-400">
            Aparece no cabeçalho de todas as propostas geradas.
          </p>
        </div>

        {/* Dados da empresa */}
        <div className="space-y-5 rounded-md border border-foam-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Nome da empresa">
              <input
                value={config.nome_empresa}
                onChange={(e) => campo('nome_empresa', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="CNPJ">
              <input
                value={config.cnpj ?? ''}
                onChange={(e) => campo('cnpj', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Telefone">
              <input
                value={config.telefone ?? ''}
                onChange={(e) => campo('telefone', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="E-mail">
              <input
                value={config.email ?? ''}
                onChange={(e) => campo('email', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Site">
              <input
                value={config.site ?? ''}
                onChange={(e) => campo('site', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Validade padrão do orçamento (dias)">
              <input
                type="number"
                min={1}
                value={config.validade_orcamento_dias}
                onChange={(e) => campo('validade_orcamento_dias', Number(e.target.value))}
                className="input"
              />
            </Campo>
          </div>

          <Campo label="Endereço">
            <input
              value={config.endereco ?? ''}
              onChange={(e) => campo('endereco', e.target.value)}
              className="input"
            />
          </Campo>

          <Campo label="Termos e condições (aparece no rodapé da proposta)">
            <textarea
              rows={4}
              value={config.termos_condicoes ?? ''}
              onChange={(e) => campo('termos_condicoes', e.target.value)}
              className="input resize-none"
            />
          </Campo>

          <div className="flex items-center gap-3 border-t border-foam-200 pt-4">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" strokeWidth={1.75} />
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </button>
            {salvo && (
              <span className="flex items-center gap-1.5 text-sm text-signal-green">
                <Check className="h-4 w-4" strokeWidth={2} />
                Salvo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-hull-900">{label}</span>
      {children}
    </label>
  )
}
