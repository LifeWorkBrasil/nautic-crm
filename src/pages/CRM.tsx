import { useEffect, useMemo, useState } from 'react'
import { Plus, Phone, Mail } from 'lucide-react'
import Modal from '@/components/Modal'
import { listLeads, createLead, updateLeadStatus } from '@/lib/api'
import type { ClienteLead, StatusCRM } from '@/types'

const COLUNAS: StatusCRM[] = [
  'Lead',
  'Proposta Enviada',
  'Negociação',
  'Venda Concluída',
  'Perdido',
]

const STATUS_STYLES: Record<StatusCRM, string> = {
  Lead: 'border-wake-400/40 bg-wake-500/5',
  'Proposta Enviada': 'border-brass-400/40 bg-brass-200/20',
  Negociação: 'border-brass-500/50 bg-brass-200/30',
  'Venda Concluída': 'border-signal-green/40 bg-signal-green/5',
  Perdido: 'border-slate-400/30 bg-foam-200',
}

const LEAD_VAZIO = {
  nome: '',
  email: '',
  telefone: '',
  status_crm: 'Lead' as StatusCRM,
  origem: '',
  observacoes: '',
}

export default function CRM() {
  const [leads, setLeads] = useState<ClienteLead[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(LEAD_VAZIO)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      setLeads(await listLeads())
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar leads')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const porColuna = useMemo(() => {
    const grupos: Record<StatusCRM, ClienteLead[]> = {
      Lead: [],
      'Proposta Enviada': [],
      Negociação: [],
      'Venda Concluída': [],
      Perdido: [],
    }
    for (const lead of leads) grupos[lead.status_crm].push(lead)
    return grupos
  }, [leads])

  async function salvarLead() {
    setSalvando(true)
    try {
      await createLead(form)
      setCriando(false)
      setForm(LEAD_VAZIO)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar lead')
    } finally {
      setSalvando(false)
    }
  }

  async function moverStatus(lead: ClienteLead, novoStatus: StatusCRM) {
    // atualização otimista
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status_crm: novoStatus } : l))
    )
    try {
      await updateLeadStatus(lead.id, novoStatus)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao mover lead')
      carregar()
    }
  }

  return (
    <div className="p-8">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">
            Funil de vendas
          </p>
          <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
            CRM náutico
          </h1>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Novo lead
        </button>
      </header>

      {erro && (
        <div className="mb-5 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {COLUNAS.map((status) => (
            <div key={status} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-medium text-slate-600">{status}</h2>
                <span className="font-mono text-xs text-slate-400">
                  {porColuna[status].length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {porColuna[status].length === 0 && (
                  <div className="rounded-md border border-dashed border-foam-200 p-4 text-center text-xs text-slate-400">
                    Nenhum cliente nesta etapa
                  </div>
                )}

                {porColuna[status].map((lead) => (
                  <article
                    key={lead.id}
                    className={`rounded-md border p-3.5 shadow-sm ${STATUS_STYLES[status]}`}
                  >
                    <p className="font-medium text-hull-900">{lead.nome}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{lead.origem}</p>

                    {lead.observacoes && (
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {lead.observacoes}
                      </p>
                    )}

                    <select
                      value={lead.status_crm}
                      onChange={(e) => moverStatus(lead, e.target.value as StatusCRM)}
                      className="mt-2.5 w-full rounded-md border border-foam-200 bg-white px-2 py-1 text-[11px] text-slate-600"
                    >
                      {COLUNAS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <div className="mt-2.5 flex items-center gap-3 border-t border-foam-200 pt-2.5 text-slate-400">
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-1 text-[11px] hover:text-wake-500"
                      >
                        <Mail className="h-3 w-3" strokeWidth={1.75} />
                      </a>
                      <a
                        href={`tel:${lead.telefone}`}
                        className="flex items-center gap-1 text-[11px] hover:text-wake-500"
                      >
                        <Phone className="h-3 w-3" strokeWidth={1.75} />
                      </a>
                      <span className="ml-auto font-mono text-[11px]">
                        {new Date(lead.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {criando && (
        <Modal
          title="Novo lead"
          onClose={() => setCriando(false)}
          footer={
            <>
              <button
                onClick={() => setCriando(false)}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvarLead}
                disabled={salvando || !form.nome.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Nome</span>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="input"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">E-mail</span>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">Telefone</span>
                <input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="input"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Origem</span>
              <input
                value={form.origem}
                onChange={(e) => setForm({ ...form, origem: e.target.value })}
                placeholder="Instagram, indicação, feira…"
                className="input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Observações</span>
              <textarea
                rows={3}
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                className="input resize-none"
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}
