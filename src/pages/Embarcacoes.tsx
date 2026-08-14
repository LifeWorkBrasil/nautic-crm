import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, History, Layers, Download, AlertTriangle, MessageCircle } from 'lucide-react'
import Modal from '@/components/Modal'
import NovoClienteModal from '@/components/NovoClienteModal'
import BuscaVinculo from '@/components/BuscaVinculo'
import LoteTagsNfcModal from '@/components/LoteTagsNfcModal'
import CamposPersonalizadosModal from '@/components/CamposPersonalizadosModal'
import CampoDinamico from '@/components/CampoDinamico'
import { CampoTexto, CampoNumero } from '@/components/campos'
import {
  listEmbarcacoes,
  createEmbarcacao,
  updateEmbarcacao,
  deleteEmbarcacao,
  listMarinas,
  listLeads,
  listParceiros,
  createParceiro,
  listTodasTagsEmbarcacoes,
  listCamposPersonalizados,
  listAlertasManutencao,
  type AlertaManutencao,
} from '@/lib/api'
import { mensagemErro } from '@/lib/errors'
import { exportarTagsCsv } from '@/lib/exportarCsv'
import { linkWhatsappComTexto } from '@/lib/whatsapp'
import type { Embarcacao, Marina, ClienteLead, Parceiro, StatusEmbarcacao, CampoPersonalizado } from '@/types'

type EmbarcacaoComNomes = Embarcacao & {
  marina_nome: string | null
  proprietario_nome: string | null
  broker_nome: string | null
}

const STATUS_LABELS: Record<StatusEmbarcacao, string> = {
  ATIVA: 'Ativa',
  EM_MANUTENCAO: 'Em manutenção',
  VENDIDA: 'Vendida',
  INATIVA: 'Inativa',
}

const STATUS_STYLES: Record<StatusEmbarcacao, string> = {
  ATIVA: 'bg-signal-green/10 text-signal-green',
  EM_MANUTENCAO: 'bg-brass-200/60 text-hull-900',
  VENDIDA: 'bg-wake-500/10 text-wake-600',
  INATIVA: 'bg-foam-200 text-slate-500',
}

const EMBARCACAO_VAZIA = {
  nome: '',
  numero_registro: '',
  tipo: '',
  comprimento: null as number | null,
  marina_id: null as string | null,
  proprietario_id: null as string | null,
  broker_id: null as string | null,
  produto_id: null as string | null,
  marinheiro_nome: '',
  marinheiro_contato: '',
  status: 'ATIVA' as StatusEmbarcacao,
  foto_url: null as string | null,
  fabricante: '',
  modelo: '',
  cor_costado: '',
  ano: null as number | null,
  estado_geral: {} as Record<string, string>,
  atributos: {} as Record<string, string | number | boolean | null>,
}

export default function Embarcacoes() {
  const [itens, setItens] = useState<EmbarcacaoComNomes[]>([])
  const [marinas, setMarinas] = useState<Marina[]>([])
  const [leads, setLeads] = useState<ClienteLead[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroBrokerId, setFiltroBrokerId] = useState<string | null>(null)

  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<Embarcacao | null>(null)
  const [form, setForm] = useState(EMBARCACAO_VAZIA)
  const [salvando, setSalvando] = useState(false)

  const [criandoProprietario, setCriandoProprietario] = useState<string | null>(null)
  const [gerandoLote, setGerandoLote] = useState(false)
  const [camposPersonalizados, setCamposPersonalizados] = useState<CampoPersonalizado[]>([])
  const [configurandoCampos, setConfigurandoCampos] = useState(false)
  const [mostrandoAlertas, setMostrandoAlertas] = useState(false)
  const [alertas, setAlertas] = useState<AlertaManutencao[]>([])

  async function carregar() {
    setCarregando(true)
    try {
      const [emb, mar, ld, pc, cp, al] = await Promise.all([
        listEmbarcacoes(),
        listMarinas(),
        listLeads(),
        listParceiros(),
        listCamposPersonalizados(),
        listAlertasManutencao(),
      ])
      setItens(emb)
      setMarinas(mar)
      setLeads(ld)
      setParceiros(pc)
      setCamposPersonalizados(cp.filter((c) => c.contexto === 'embarcacao'))
      setAlertas(al)
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao carregar embarcações'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return itens.filter((e) => {
      if (filtroBrokerId && e.broker_id !== filtroBrokerId) return false
      if (!termo) return true
      return (
        e.nome.toLowerCase().includes(termo) ||
        (e.numero_registro ?? '').toLowerCase().includes(termo) ||
        (e.proprietario_nome ?? '').toLowerCase().includes(termo)
      )
    })
  }, [itens, busca, filtroBrokerId])

  function abrirCriacao() {
    setForm(EMBARCACAO_VAZIA)
    setCriando(true)
  }

  function abrirEdicao(e: Embarcacao) {
    setForm({
      nome: e.nome,
      numero_registro: e.numero_registro ?? '',
      tipo: e.tipo ?? '',
      comprimento: e.comprimento,
      marina_id: e.marina_id,
      proprietario_id: e.proprietario_id,
      broker_id: e.broker_id,
      produto_id: e.produto_id,
      marinheiro_nome: e.marinheiro_nome ?? '',
      marinheiro_contato: e.marinheiro_contato ?? '',
      status: e.status,
      foto_url: e.foto_url,
      fabricante: e.fabricante ?? '',
      modelo: e.modelo ?? '',
      cor_costado: e.cor_costado ?? '',
      ano: e.ano,
      estado_geral: e.estado_geral,
      atributos: e.atributos,
    })
    setEditando(e)
  }

  function fechar() {
    setCriando(false)
    setEditando(null)
  }

  async function salvar() {
    setSalvando(true)
    try {
      const payload = {
        ...form,
        numero_registro: form.numero_registro || null,
        tipo: form.tipo || null,
        marinheiro_nome: form.marinheiro_nome || null,
        marinheiro_contato: form.marinheiro_contato || null,
        fabricante: form.fabricante || null,
        modelo: form.modelo || null,
        cor_costado: form.cor_costado || null,
      }
      if (editando) {
        await updateEmbarcacao(editando.id, payload)
      } else {
        await createEmbarcacao(payload)
      }
      fechar()
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao salvar embarcação'))
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta embarcação? As tags NFC e o histórico de eventos vinculados também somem.'))
      return
    try {
      await deleteEmbarcacao(id)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao excluir embarcação'))
    }
  }

  async function exportarTodasAsTags() {
    try {
      const tags = await listTodasTagsEmbarcacoes()
      if (tags.length === 0) {
        setErro('Nenhuma tag cadastrada ainda.')
        return
      }
      const base = `${window.location.origin}${import.meta.env.BASE_URL}embarcacao/`
      exportarTagsCsv(
        tags.map((t) => ({
          tag_id: t.tag_id,
          url: `${base}${t.tag_id}`,
          embarcacao_nome: t.embarcacao_nome,
          modelo_nfc: t.modelo_nfc,
        })),
        'todas-as-tags',
        'completo'
      )
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao exportar tags'))
    }
  }

  function handleProprietarioCriado(lead: ClienteLead) {
    setLeads((prev) => [lead, ...prev])
    setForm((f) => ({ ...f, proprietario_id: lead.id }))
    setCriandoProprietario(null)
  }

  const modalAberto = criando || editando !== null

  return (
    <div className="p-8">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">Módulo NFC</p>
          <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
            Embarcações
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {alertas.length > 0 && (
            <button
              onClick={() => setMostrandoAlertas(true)}
              className="flex items-center gap-2 rounded-md border border-signal-red/30 bg-signal-red/5 px-3 py-2.5 text-sm text-signal-red transition-colors hover:bg-signal-red/10"
            >
              <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
              {alertas.length} vencendo
            </button>
          )}
          <button
            onClick={() => setConfigurandoCampos(true)}
            className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2.5 text-sm text-hull-900 transition-colors hover:border-wake-400"
          >
            Campos personalizados
          </button>
          <button
            onClick={exportarTodasAsTags}
            className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2.5 text-sm text-hull-900 transition-colors hover:border-wake-400"
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
            Exportar todas as tags
          </button>
          <button
            onClick={() => setGerandoLote(true)}
            className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2.5 text-sm text-hull-900 transition-colors hover:border-wake-400"
          >
            <Layers className="h-4 w-4" strokeWidth={1.75} />
            Gerar tags em lote
          </button>
          <button
            onClick={abrirCriacao}
            className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nova embarcação
          </button>
        </div>
      </header>

      {erro && (
        <div className="mb-5 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-72">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, registro ou proprietário"
            className="input w-full pl-8"
          />
        </div>
        <select
          value={filtroBrokerId ?? ''}
          onChange={(e) => setFiltroBrokerId(e.target.value || null)}
          className="input w-56"
        >
          <option value="">Todos os brokers</option>
          {parceiros.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-slate-400">
          {busca ? 'Nenhuma embarcação encontrada.' : 'Nenhuma embarcação cadastrada ainda.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Marina</th>
                <th className="px-4 py-3 font-medium">Proprietário</th>
                <th className="px-4 py-3 font-medium">Broker</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {filtrados.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-hull-900">
                    {e.nome}
                    {e.comprimento ? ` (${e.comprimento}m)` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.marina_nome ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{e.proprietario_nome ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{e.broker_nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[e.status]}`}
                    >
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/embarcacoes/${e.id}`}
                        className="text-slate-400 hover:text-wake-500"
                        title="Ficha completa"
                      >
                        <History className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </Link>
                      <button onClick={() => abrirEdicao(e)} className="text-wake-500 hover:text-wake-600">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => excluir(e.id)}
                        className="text-signal-red/80 hover:text-signal-red"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.nome}` : 'Nova embarcação'}
          onClose={fechar}
          size="lg"
          footer={
            <>
              <button onClick={fechar} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
              <CampoTexto
                label="Número de registro"
                value={form.numero_registro}
                onChange={(v) => setForm({ ...form, numero_registro: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} />
              <CampoNumero
                label="Comprimento (m)"
                value={form.comprimento ?? 0}
                onChange={(v) => setForm({ ...form, comprimento: v || null })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Fabricante"
                value={form.fabricante}
                onChange={(v) => setForm({ ...form, fabricante: v })}
              />
              <CampoTexto label="Modelo" value={form.modelo} onChange={(v) => setForm({ ...form, modelo: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Cor do costado"
                value={form.cor_costado}
                onChange={(v) => setForm({ ...form, cor_costado: v })}
              />
              <CampoNumero
                label="Ano"
                value={form.ano ?? 0}
                onChange={(v) => setForm({ ...form, ano: v || null })}
              />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Marina</span>
              <select
                value={form.marina_id ?? ''}
                onChange={(e) => setForm({ ...form, marina_id: e.target.value || null })}
                className="input"
              >
                <option value="">Nenhuma</option>
                {marinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>

            <BuscaVinculo
              label="Proprietário"
              itens={leads}
              valorId={form.proprietario_id}
              onSelecionar={(id) => setForm({ ...form, proprietario_id: id })}
              onCriarNovo={(nome) => setCriandoProprietario(nome)}
              placeholder="Buscar cliente por nome…"
            />

            <BuscaVinculo
              label="Broker"
              itens={parceiros}
              valorId={form.broker_id}
              onSelecionar={(id) => setForm({ ...form, broker_id: id })}
              onCriarNovo={async (nome) => {
                try {
                  const criado = await createParceiro({ nome, contato: null, telefone: null, observacoes: null })
                  setParceiros((prev) => [criado, ...prev])
                  setForm((f) => ({ ...f, broker_id: criado.id }))
                } catch (e) {
                  setErro(mensagemErro(e, 'Erro ao cadastrar broker'))
                }
              }}
              placeholder="Buscar parceiro por nome…"
            />

            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Nome do marinheiro"
                value={form.marinheiro_nome}
                onChange={(v) => setForm({ ...form, marinheiro_nome: v })}
              />
              <CampoTexto
                label="Contato do marinheiro"
                value={form.marinheiro_contato}
                onChange={(v) => setForm({ ...form, marinheiro_contato: v })}
              />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as StatusEmbarcacao })}
                className="input"
              >
                {(Object.keys(STATUS_LABELS) as StatusEmbarcacao[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>

            {camposPersonalizados.length > 0 && (
              <div className="space-y-4 border-t border-foam-200 pt-4">
                {camposPersonalizados.map((campo) => (
                  <CampoDinamico
                    key={campo.id}
                    campo={campo}
                    valor={form.atributos[campo.id] ?? null}
                    onChange={(v) => setForm({ ...form, atributos: { ...form.atributos, [campo.id]: v } })}
                  />
                ))}
              </div>
            )}

            {editando && (
              <p className="text-xs text-slate-400">
                Motor, itens instalados, estado geral, manutenções e tags NFC ficam na{' '}
                <Link to={`/embarcacoes/${editando.id}`} className="text-wake-500 hover:text-wake-600">
                  ficha completa
                </Link>
                .
              </p>
            )}
          </div>
        </Modal>
      )}

      {configurandoCampos && (
        <CamposPersonalizadosModal
          contexto="embarcacao"
          titulo="Embarcações"
          onClose={() => {
            setConfigurandoCampos(false)
            carregar()
          }}
        />
      )}

      {criandoProprietario !== null && (
        <NovoClienteModal
          nomeInicial={criandoProprietario}
          origem="Cadastro de embarcação"
          textoBotaoSalvar="Salvar cliente"
          onClose={() => setCriandoProprietario(null)}
          onCriado={handleProprietarioCriado}
        />
      )}

      {gerandoLote && (
        <LoteTagsNfcModal
          onClose={() => setGerandoLote(false)}
          onCriadas={() => {
            setGerandoLote(false)
            carregar()
          }}
        />
      )}

      {mostrandoAlertas && <PainelVencimentosModal alertas={alertas} onClose={() => setMostrandoAlertas(false)} />}
    </div>
  )
}

function diasRestantes(dataIso: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const data = new Date(`${dataIso}T00:00:00`)
  return Math.round((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function PainelVencimentosModal({
  alertas,
  onClose,
}: {
  alertas: AlertaManutencao[]
  onClose: () => void
}) {
  const porMarina = useMemo(() => {
    const grupos = new Map<string, { total: number; vencidos: number }>()
    for (const a of alertas) {
      const chave = a.marina_nome ?? 'Sem marina'
      const atual = grupos.get(chave) ?? { total: 0, vencidos: 0 }
      atual.total += 1
      if (diasRestantes(a.data) < 0) atual.vencidos += 1
      grupos.set(chave, atual)
    }
    return Array.from(grupos.entries()).map(([marina, v]) => ({ marina, ...v }))
  }, [alertas])

  return (
    <Modal title="Vencimentos próximos (30 dias)" onClose={onClose} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {porMarina.map(({ marina, total, vencidos }) => (
            <div key={marina} className="rounded-md border border-foam-200 bg-white p-3">
              <p className="text-sm font-medium text-hull-900">{marina}</p>
              <p className="mt-1 text-xs text-slate-500">
                {total} no total
                {vencidos > 0 && <span className="ml-1.5 text-signal-red">· {vencidos} vencido(s)</span>}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Embarcação</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Marina</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {alertas.map((a, i) => {
                const dias = diasRestantes(a.data)
                const dataFormatada = new Date(`${a.data}T00:00:00`).toLocaleDateString('pt-BR')
                const mensagem = `Olá${a.marinheiro_nome ? ` ${a.marinheiro_nome}` : ''}! Passando pra lembrar: ${
                  a.item_nome ?? (a.tipo === 'garantia' ? 'garantia' : 'revisão')
                } da embarcação ${a.embarcacao_nome} ${dias < 0 ? 'venceu em' : 'vence em'} ${dataFormatada}.`
                return (
                  <tr key={`${a.tipo}-${a.embarcacao_id}-${i}`}>
                    <td className="px-4 py-3 text-hull-900">{a.embarcacao_nome}</td>
                    <td className="px-4 py-3 text-slate-600">{a.item_nome ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{a.tipo === 'garantia' ? 'Garantia' : 'Revisão'}</td>
                    <td className="px-4 py-3 text-slate-600">{a.marina_nome ?? '—'}</td>
                    <td className={`px-4 py-3 ${dias < 0 ? 'text-signal-red' : 'text-slate-600'}`}>
                      {dataFormatada}
                      <span className="ml-1.5 text-xs">
                        ({dias < 0 ? `${Math.abs(dias)}d atrás` : dias === 0 ? 'hoje' : `em ${dias}d`})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.marinheiro_contato ? (
                        <a
                          href={linkWhatsappComTexto(a.marinheiro_contato, mensagem)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-signal-green hover:opacity-80"
                        >
                          <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Enviar lembrete
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">Sem contato</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
