import { useEffect, useMemo, useState } from 'react'
import { Plus, Phone, Mail, Pencil, AlertTriangle, UserCheck, FileSignature } from 'lucide-react'
import Modal from '@/components/Modal'
import GerarContratoModal from '@/components/GerarContratoModal'
import { CampoTexto } from '@/components/campos'
import { usePermissoes } from '@/lib/PermissoesContext'
import { formatBRL } from '@/lib/format'
import {
  listLeads,
  createLead,
  updateLeadStatus,
  updateLead,
  listHistoricoCliente,
  adicionarHistorico,
  listUsuarios,
  assumirLead,
  listOrcamentosCliente,
  listContrapropostasCliente,
  criarContraproposta,
} from '@/lib/api'
import type {
  ClienteLead,
  StatusCRM,
  HistoricoContato,
  UsuarioPerfil,
  OrcamentoDetalhado,
  Contraproposta,
  ContrapropostaVeiculo,
  ContrapropostaImovel,
} from '@/types'

const DIAS_LIBERACAO_LEAD = 90

function estaAtrasado(lead: ClienteLead): boolean {
  if (!lead.proximo_contato) return false
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return new Date(`${lead.proximo_contato}T00:00:00`) < hoje
}

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

function linkWhatsapp(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '')
  const comDdi = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${comDdi}`
}

const LEAD_VAZIO = {
  nome: '',
  email: '',
  telefone: '',
  status_crm: 'Lead' as StatusCRM,
  origem: '',
  observacoes: '',
}

const EDICAO_VAZIA = {
  nome: '',
  email: '',
  telefone: '',
  origem: '',
  observacoes: '',
  tipo_pessoa: 'PF' as 'PF' | 'PJ',
  cpf: '',
  rg: '',
  cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  inscricao_estadual: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  pessoa_juridica_id: '',
  proximo_contato: '',
}

const FORM_CONTRAPROPOSTA_VAZIO = {
  orcamento_id: '',
  valor_proposto: '',
  tipo_parcelamento: '',
  numero_parcelas: '',
  observacoes: '',
  tipoTrading: 'veiculo' as 'veiculo' | 'imovel',
  tipo_veiculo: '',
  marca_modelo: '',
  ano: '',
  valor_estimado_veiculo: '',
  descricao_imovel: '',
  valor_estimado_imovel: '',
}

type ContrapropostaComItens = Contraproposta & {
  veiculo: ContrapropostaVeiculo | null
  imovel: ContrapropostaImovel | null
}

export default function CRM() {
  const { perfil } = usePermissoes()
  const [leads, setLeads] = useState<ClienteLead[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(LEAD_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState<ClienteLead | null>(null)
  const [formEdicao, setFormEdicao] = useState(EDICAO_VAZIA)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [historico, setHistorico] = useState<HistoricoContato[]>([])
  const [novoTexto, setNovoTexto] = useState('')
  const [registrandoContato, setRegistrandoContato] = useState(false)
  const [assumindo, setAssumindo] = useState(false)
  const [orcamentosCliente, setOrcamentosCliente] = useState<OrcamentoDetalhado[]>([])
  const [contrapropostas, setContrapropostas] = useState<ContrapropostaComItens[]>([])
  const [mostrandoFormContraproposta, setMostrandoFormContraproposta] = useState(false)
  const [formContraproposta, setFormContraproposta] = useState(FORM_CONTRAPROPOSTA_VAZIO)
  const [salvandoContraproposta, setSalvandoContraproposta] = useState(false)
  const [mostrandoGerarContratoPara, setMostrandoGerarContratoPara] = useState<ClienteLead | null>(
    null
  )

  async function carregar() {
    setCarregando(true)
    try {
      const [ld, us] = await Promise.all([listLeads(), listUsuarios()])
      setLeads(ld)
      setUsuarios(us)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar leads')
    } finally {
      setCarregando(false)
    }
  }

  function nomeVendedor(vendedorId: string | null | undefined): string | null {
    if (!vendedorId) return null
    return usuarios.find((u) => u.id === vendedorId)?.nome ?? null
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

  const pessoasJuridicas = useMemo(() => leads.filter((l) => l.tipo_pessoa === 'PJ'), [leads])

  const ultimoContatoEditando = editando
    ? new Date(historico[0]?.criado_em ?? editando.criado_em)
    : null
  const diasSemContato = ultimoContatoEditando
    ? (Date.now() - ultimoContatoEditando.getTime()) / (1000 * 60 * 60 * 24)
    : 0
  const jaSouDonoDoLead = !!editando?.vendedor_id && editando.vendedor_id === perfil?.id
  const bloqueadoPorOutro =
    !!editando?.vendedor_id && !jaSouDonoDoLead && diasSemContato < DIAS_LIBERACAO_LEAD
  const podeAssumirLead = !!editando && !jaSouDonoDoLead && !bloqueadoPorOutro
  const dataLiberacaoLead =
    ultimoContatoEditando && editando?.vendedor_id
      ? new Date(
          ultimoContatoEditando.getTime() + DIAS_LIBERACAO_LEAD * 24 * 60 * 60 * 1000
        ).toLocaleDateString('pt-BR')
      : null

  async function handleAssumirLead() {
    if (!editando) return
    setAssumindo(true)
    try {
      await assumirLead(editando.id)
      setEditando(null)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao assumir lead')
    } finally {
      setAssumindo(false)
    }
  }

  function abrirEdicao(lead: ClienteLead) {
    setFormEdicao({
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      origem: lead.origem,
      observacoes: lead.observacoes ?? '',
      tipo_pessoa: lead.tipo_pessoa ?? 'PF',
      cpf: lead.cpf ?? '',
      rg: lead.rg ?? '',
      cnpj: lead.cnpj ?? '',
      razao_social: lead.razao_social ?? '',
      nome_fantasia: lead.nome_fantasia ?? '',
      inscricao_estadual: lead.inscricao_estadual ?? '',
      endereco: lead.endereco ?? '',
      cidade: lead.cidade ?? '',
      estado: lead.estado ?? '',
      cep: lead.cep ?? '',
      pessoa_juridica_id: lead.pessoa_juridica_id ?? '',
      proximo_contato: lead.proximo_contato ?? '',
    })
    setEditando(lead)
    setHistorico([])
    listHistoricoCliente(lead.id)
      .then(setHistorico)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar histórico'))

    setOrcamentosCliente([])
    setContrapropostas([])
    setMostrandoFormContraproposta(false)
    setFormContraproposta(FORM_CONTRAPROPOSTA_VAZIO)
    Promise.all([listOrcamentosCliente(lead.id), listContrapropostasCliente(lead.id)])
      .then(([o, c]) => {
        setOrcamentosCliente(o)
        setContrapropostas(c)
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar propostas'))
  }

  async function handleCriarContraproposta() {
    if (!editando) return
    setSalvandoContraproposta(true)
    try {
      await criarContraproposta({
        cliente_id: editando.id,
        orcamento_id: formContraproposta.orcamento_id || null,
        valor_proposto: formContraproposta.valor_proposto ? Number(formContraproposta.valor_proposto) : null,
        tipo_parcelamento: formContraproposta.tipo_parcelamento || null,
        numero_parcelas: formContraproposta.numero_parcelas ? Number(formContraproposta.numero_parcelas) : null,
        observacoes: formContraproposta.observacoes || null,
        veiculo:
          formContraproposta.tipoTrading === 'veiculo' && formContraproposta.tipo_veiculo
            ? {
                tipo_veiculo: formContraproposta.tipo_veiculo,
                marca_modelo: formContraproposta.marca_modelo || null,
                ano: formContraproposta.ano ? Number(formContraproposta.ano) : null,
                valor_estimado: formContraproposta.valor_estimado_veiculo
                  ? Number(formContraproposta.valor_estimado_veiculo)
                  : null,
              }
            : null,
        imovel:
          formContraproposta.tipoTrading === 'imovel' && formContraproposta.descricao_imovel
            ? {
                descricao: formContraproposta.descricao_imovel || null,
                valor_estimado: formContraproposta.valor_estimado_imovel
                  ? Number(formContraproposta.valor_estimado_imovel)
                  : null,
              }
            : null,
      })
      const atualizadas = await listContrapropostasCliente(editando.id)
      setContrapropostas(atualizadas)
      setMostrandoFormContraproposta(false)
      setFormContraproposta(FORM_CONTRAPROPOSTA_VAZIO)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao registrar contraproposta')
    } finally {
      setSalvandoContraproposta(false)
    }
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvandoEdicao(true)
    try {
      await updateLead(editando.id, {
        ...formEdicao,
        pessoa_juridica_id: formEdicao.pessoa_juridica_id || null,
        proximo_contato: formEdicao.proximo_contato || null,
      })
      setEditando(null)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar cliente')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function registrarContato() {
    if (!editando || !novoTexto.trim()) return
    setRegistrandoContato(true)
    try {
      const entrada = await adicionarHistorico(editando.id, novoTexto.trim())
      setHistorico((prev) => [entrada, ...prev])
      setNovoTexto('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao registrar contato')
    } finally {
      setRegistrandoContato(false)
    }
  }

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
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-hull-900">{lead.nome}</p>
                      {estaAtrasado(lead) && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-signal-red/10 px-2 py-0.5 text-[10px] font-medium text-signal-red">
                          <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2} />
                          Atrasado
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{lead.origem}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {nomeVendedor(lead.vendedor_id) ? (
                        <>Vendedor: {nomeVendedor(lead.vendedor_id)}</>
                      ) : (
                        'Sem vendedor'
                      )}
                    </p>

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
                        href={linkWhatsapp(lead.telefone)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] hover:text-wake-500"
                      >
                        <Phone className="h-3 w-3" strokeWidth={1.75} />
                      </a>
                      <button
                        onClick={() => abrirEdicao(lead)}
                        className="flex items-center gap-1 text-[11px] hover:text-wake-500"
                      >
                        <Pencil className="h-3 w-3" strokeWidth={1.75} />
                      </button>
                      {lead.status_crm === 'Venda Concluída' && (
                        <button
                          onClick={() => setMostrandoGerarContratoPara(lead)}
                          title="Emitir contrato"
                          className="flex items-center gap-1 text-[11px] hover:text-wake-500"
                        >
                          <FileSignature className="h-3 w-3" strokeWidth={1.75} />
                        </button>
                      )}
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

      {editando && (
        <Modal
          title={`Editar ${editando.nome}`}
          onClose={() => setEditando(null)}
          size="xl"
          footer={
            <>
              <button
                onClick={() => setEditando(null)}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvandoEdicao || bloqueadoPorOutro || !formEdicao.nome.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvandoEdicao ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-md border border-foam-200 bg-foam-100 p-3 text-sm">
              {editando.vendedor_id ? (
                <p className="text-hull-900">
                  Vendedor responsável:{' '}
                  <span className="font-medium">{nomeVendedor(editando.vendedor_id) ?? '—'}</span>
                  {bloqueadoPorOutro && (
                    <span className="ml-2 text-signal-red">
                      (lead travado até {dataLiberacaoLead})
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-slate-500">Nenhum vendedor responsável ainda.</p>
              )}
              {podeAssumirLead && (
                <button
                  onClick={handleAssumirLead}
                  disabled={assumindo}
                  className="mt-2 flex items-center gap-1.5 rounded-md border border-foam-200 px-3 py-1.5 text-xs text-hull-900 hover:border-wake-400 disabled:opacity-50"
                >
                  <UserCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {assumindo ? 'Assumindo…' : 'Assumir lead'}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {(['PF', 'PJ'] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFormEdicao({ ...formEdicao, tipo_pessoa: tipo })}
                  disabled={bloqueadoPorOutro}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    formEdicao.tipo_pessoa === tipo
                      ? 'border-brass-500 bg-brass-200/20 text-hull-900'
                      : 'border-foam-200 text-slate-500 hover:border-wake-400'
                  }`}
                >
                  {tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>

            <CampoTexto
              label="Nome"
              value={formEdicao.nome}
              onChange={(v) => setFormEdicao({ ...formEdicao, nome: v })}
              disabled={bloqueadoPorOutro}
            />
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="E-mail"
                value={formEdicao.email}
                onChange={(v) => setFormEdicao({ ...formEdicao, email: v })}
                disabled={bloqueadoPorOutro}
              />
              <CampoTexto
                label="Telefone"
                value={formEdicao.telefone}
                onChange={(v) => setFormEdicao({ ...formEdicao, telefone: v })}
                disabled={bloqueadoPorOutro}
              />
            </div>

            {formEdicao.tipo_pessoa === 'PF' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <CampoTexto
                    label="CPF"
                    value={formEdicao.cpf}
                    onChange={(v) => setFormEdicao({ ...formEdicao, cpf: v })}
                    disabled={bloqueadoPorOutro}
                  />
                  <CampoTexto
                    label="RG"
                    value={formEdicao.rg}
                    onChange={(v) => setFormEdicao({ ...formEdicao, rg: v })}
                    disabled={bloqueadoPorOutro}
                  />
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">
                    Vincular a uma empresa (opcional)
                  </span>
                  <select
                    value={formEdicao.pessoa_juridica_id}
                    onChange={(e) =>
                      setFormEdicao({ ...formEdicao, pessoa_juridica_id: e.target.value })
                    }
                    disabled={bloqueadoPorOutro}
                    className="input disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Nenhuma</option>
                    {pessoasJuridicas
                      .filter((pj) => pj.id !== editando.id)
                      .map((pj) => (
                        <option key={pj.id} value={pj.id}>
                          {pj.razao_social || pj.nome}
                        </option>
                      ))}
                  </select>
                </label>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <CampoTexto
                    label="CNPJ"
                    value={formEdicao.cnpj}
                    onChange={(v) => setFormEdicao({ ...formEdicao, cnpj: v })}
                    disabled={bloqueadoPorOutro}
                  />
                  <CampoTexto
                    label="Inscrição estadual"
                    value={formEdicao.inscricao_estadual}
                    onChange={(v) => setFormEdicao({ ...formEdicao, inscricao_estadual: v })}
                    disabled={bloqueadoPorOutro}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CampoTexto
                    label="Razão social"
                    value={formEdicao.razao_social}
                    onChange={(v) => setFormEdicao({ ...formEdicao, razao_social: v })}
                    disabled={bloqueadoPorOutro}
                  />
                  <CampoTexto
                    label="Nome fantasia"
                    value={formEdicao.nome_fantasia}
                    onChange={(v) => setFormEdicao({ ...formEdicao, nome_fantasia: v })}
                    disabled={bloqueadoPorOutro}
                  />
                </div>
                {leads.filter((l) => l.pessoa_juridica_id === editando.id).length > 0 && (
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-hull-900">Contatos vinculados</p>
                    <ul className="space-y-1 text-sm text-slate-500">
                      {leads
                        .filter((l) => l.pessoa_juridica_id === editando.id)
                        .map((pf) => (
                          <li key={pf.id}>{pf.nome}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Endereço"
                value={formEdicao.endereco}
                onChange={(v) => setFormEdicao({ ...formEdicao, endereco: v })}
                disabled={bloqueadoPorOutro}
              />
              <CampoTexto
                label="Cidade"
                value={formEdicao.cidade}
                onChange={(v) => setFormEdicao({ ...formEdicao, cidade: v })}
                disabled={bloqueadoPorOutro}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Estado"
                value={formEdicao.estado}
                onChange={(v) => setFormEdicao({ ...formEdicao, estado: v })}
                disabled={bloqueadoPorOutro}
              />
              <CampoTexto
                label="CEP"
                value={formEdicao.cep}
                onChange={(v) => setFormEdicao({ ...formEdicao, cep: v })}
                disabled={bloqueadoPorOutro}
              />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Origem</span>
              <input
                value={formEdicao.origem}
                onChange={(e) => setFormEdicao({ ...formEdicao, origem: e.target.value })}
                disabled={bloqueadoPorOutro}
                className="input disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Observações</span>
              <textarea
                rows={3}
                value={formEdicao.observacoes}
                onChange={(e) => setFormEdicao({ ...formEdicao, observacoes: e.target.value })}
                disabled={bloqueadoPorOutro}
                className="input resize-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Próxima ligação
              </span>
              <input
                type="date"
                value={formEdicao.proximo_contato}
                onChange={(e) => setFormEdicao({ ...formEdicao, proximo_contato: e.target.value })}
                disabled={bloqueadoPorOutro}
                className="input disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <div className="border-t border-foam-200 pt-4">
              <p className="mb-2 text-sm font-medium text-hull-900">Histórico de contato</p>
              <div className="mb-3 flex gap-2">
                <input
                  value={novoTexto}
                  onChange={(e) => setNovoTexto(e.target.value)}
                  placeholder="O que foi conversado…"
                  disabled={bloqueadoPorOutro}
                  className="input disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  onClick={registrarContato}
                  disabled={registrandoContato || bloqueadoPorOutro || !novoTexto.trim()}
                  className="shrink-0 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400 disabled:opacity-40"
                >
                  {registrandoContato ? 'Registrando…' : 'Registrar contato'}
                </button>
              </div>
              {historico.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum contato registrado ainda.</p>
              ) : (
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {historico.map((h) => (
                    <li key={h.id} className="text-sm">
                      <span className="mr-2 font-mono text-xs text-slate-400">
                        {new Date(h.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-slate-600">{h.texto}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-foam-200 pt-4">
              <p className="mb-2 text-sm font-medium text-hull-900">Propostas e Trading</p>

              {orcamentosCliente.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum orçamento salvo para este cliente.</p>
              ) : (
                <ul className="mb-3 space-y-1 text-sm text-slate-600">
                  {orcamentosCliente.map((o) => (
                    <li key={o.id}>
                      {o.produto?.nome ?? 'Produto'} — {formatBRL(o.valor_total)} ({o.status})
                    </li>
                  ))}
                </ul>
              )}

              {contrapropostas.length > 0 && (
                <ul className="mb-3 space-y-1.5">
                  {contrapropostas.map((c) => (
                    <li key={c.id} className="rounded-md border border-foam-200 p-2.5 text-sm">
                      {c.valor_proposto != null && (
                        <span className="text-hull-900">{formatBRL(c.valor_proposto)}</span>
                      )}
                      {c.tipo_parcelamento && (
                        <span className="ml-2 text-xs text-slate-500">
                          {c.tipo_parcelamento}
                          {c.numero_parcelas ? ` (${c.numero_parcelas}x)` : ''}
                        </span>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Bem oferecido:{' '}
                        {c.veiculo
                          ? `${c.veiculo.tipo_veiculo} ${c.veiculo.marca_modelo ?? ''}`.trim()
                          : (c.imovel?.descricao ?? '—')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {!mostrandoFormContraproposta ? (
                <button
                  onClick={() => setMostrandoFormContraproposta(true)}
                  disabled={bloqueadoPorOutro}
                  className="flex items-center gap-1.5 text-xs text-wake-500 hover:text-wake-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  Nova contraproposta
                </button>
              ) : (
                <div className="space-y-3 rounded-md border border-foam-200 p-3">
                  {orcamentosCliente.length > 0 && (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-hull-900">
                        Vincular a orçamento (opcional)
                      </span>
                      <select
                        value={formContraproposta.orcamento_id}
                        onChange={(e) =>
                          setFormContraproposta({ ...formContraproposta, orcamento_id: e.target.value })
                        }
                        className="input text-sm"
                      >
                        <option value="">Nenhum</option>
                        {orcamentosCliente.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.produto?.nome ?? 'Produto'} — {formatBRL(o.valor_total)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={formContraproposta.valor_proposto}
                      onChange={(e) =>
                        setFormContraproposta({ ...formContraproposta, valor_proposto: e.target.value })
                      }
                      placeholder="Valor proposto (R$)"
                      className="input text-sm"
                    />
                    <input
                      value={formContraproposta.tipo_parcelamento}
                      onChange={(e) =>
                        setFormContraproposta({ ...formContraproposta, tipo_parcelamento: e.target.value })
                      }
                      placeholder="Tipo de parcelamento"
                      className="input text-sm"
                    />
                  </div>
                  <input
                    value={formContraproposta.numero_parcelas}
                    onChange={(e) =>
                      setFormContraproposta({ ...formContraproposta, numero_parcelas: e.target.value })
                    }
                    placeholder="Número de parcelas"
                    className="input text-sm"
                  />

                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={formContraproposta.tipoTrading === 'veiculo'}
                        onChange={() => setFormContraproposta({ ...formContraproposta, tipoTrading: 'veiculo' })}
                        className="accent-brass-500"
                      />
                      Veículo
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={formContraproposta.tipoTrading === 'imovel'}
                        onChange={() => setFormContraproposta({ ...formContraproposta, tipoTrading: 'imovel' })}
                        className="accent-brass-500"
                      />
                      Imóvel
                    </label>
                  </div>

                  {formContraproposta.tipoTrading === 'veiculo' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={formContraproposta.tipo_veiculo}
                        onChange={(e) =>
                          setFormContraproposta({ ...formContraproposta, tipo_veiculo: e.target.value })
                        }
                        placeholder="Tipo (carro, moto…)"
                        className="input text-sm"
                      />
                      <input
                        value={formContraproposta.marca_modelo}
                        onChange={(e) =>
                          setFormContraproposta({ ...formContraproposta, marca_modelo: e.target.value })
                        }
                        placeholder="Marca/modelo"
                        className="input text-sm"
                      />
                      <input
                        value={formContraproposta.ano}
                        onChange={(e) => setFormContraproposta({ ...formContraproposta, ano: e.target.value })}
                        placeholder="Ano"
                        className="input text-sm"
                      />
                      <input
                        value={formContraproposta.valor_estimado_veiculo}
                        onChange={(e) =>
                          setFormContraproposta({
                            ...formContraproposta,
                            valor_estimado_veiculo: e.target.value,
                          })
                        }
                        placeholder="Valor estimado (R$)"
                        className="input text-sm"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={formContraproposta.descricao_imovel}
                        onChange={(e) =>
                          setFormContraproposta({ ...formContraproposta, descricao_imovel: e.target.value })
                        }
                        placeholder="Descrição do imóvel"
                        className="input text-sm"
                      />
                      <input
                        value={formContraproposta.valor_estimado_imovel}
                        onChange={(e) =>
                          setFormContraproposta({
                            ...formContraproposta,
                            valor_estimado_imovel: e.target.value,
                          })
                        }
                        placeholder="Valor estimado (R$)"
                        className="input text-sm"
                      />
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={formContraproposta.observacoes}
                    onChange={(e) =>
                      setFormContraproposta({ ...formContraproposta, observacoes: e.target.value })
                    }
                    placeholder="Observações"
                    className="input resize-none text-sm"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setMostrandoFormContraproposta(false)}
                      className="rounded-md px-3 py-1.5 text-xs text-slate-500 hover:text-hull-900"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCriarContraproposta}
                      disabled={salvandoContraproposta}
                      className="rounded-md border border-foam-200 px-3 py-1.5 text-xs text-hull-900 hover:border-wake-400 disabled:opacity-50"
                    >
                      {salvandoContraproposta ? 'Registrando…' : 'Registrar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {mostrandoGerarContratoPara && (
        <GerarContratoModal
          clienteIdInicial={mostrandoGerarContratoPara.id}
          onClose={() => setMostrandoGerarContratoPara(null)}
        />
      )}
    </div>
  )
}
