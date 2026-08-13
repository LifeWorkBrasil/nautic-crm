import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Nfc, Copy, Check, History, Wrench, Sparkles, ArrowUpDown } from 'lucide-react'
import Modal from '@/components/Modal'
import NovoClienteModal from '@/components/NovoClienteModal'
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
  listTagsEmbarcacao,
  createTagEmbarcacao,
  alternarAtivoTagEmbarcacao,
  deleteTagEmbarcacao,
  listManutencoesEmbarcacao,
  listLimpezasEmbarcacao,
  listMovimentacoesEmbarcacao,
} from '@/lib/api'
import { NFC_MODELS, computeUrlNdefBytes, getModelCapacity, type ModeloNfc as ModeloNfcCapacidade } from '@/lib/nfcCapacity'
import { mensagemErro } from '@/lib/errors'
import type {
  Embarcacao,
  Marina,
  ClienteLead,
  Parceiro,
  EmbarcacaoTag,
  StatusEmbarcacao,
  ModoGravacaoNfc,
  EmbarcacaoManutencao,
  EmbarcacaoLimpeza,
  EmbarcacaoMovimentacao,
} from '@/types'

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
  const [verHistoricoDe, setVerHistoricoDe] = useState<EmbarcacaoComNomes | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      const [emb, mar, ld, pc] = await Promise.all([
        listEmbarcacoes(),
        listMarinas(),
        listLeads(),
        listParceiros(),
      ])
      setItens(emb)
      setMarinas(mar)
      setLeads(ld)
      setParceiros(pc)
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
        <button
          onClick={abrirCriacao}
          className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nova embarcação
        </button>
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
                      <button
                        onClick={() => setVerHistoricoDe(e)}
                        className="text-slate-400 hover:text-wake-500"
                        title="Histórico de eventos"
                      >
                        <History className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
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

            {editando && (
              <div className="border-t border-foam-200 pt-4">
                <TagsNfcSection embarcacaoId={editando.id} onErro={setErro} />
              </div>
            )}
          </div>
        </Modal>
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

      {verHistoricoDe && (
        <HistoricoEventosModal embarcacao={verHistoricoDe} onClose={() => setVerHistoricoDe(null)} />
      )}
    </div>
  )
}

function BuscaVinculo({
  label,
  itens,
  valorId,
  onSelecionar,
  onCriarNovo,
  placeholder,
}: {
  label: string
  itens: { id: string; nome: string }[]
  valorId: string | null
  onSelecionar: (id: string | null) => void
  onCriarNovo: (nomeDigitado: string) => void
  placeholder?: string
}) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const selecionado = itens.find((i) => i.id === valorId) ?? null

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return []
    return itens.filter((i) => i.nome.toLowerCase().includes(termo)).slice(0, 8)
  }, [itens, busca])

  if (selecionado) {
    return (
      <div>
        <span className="mb-1.5 block text-sm font-medium text-hull-900">{label}</span>
        <div className="flex items-center justify-between rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900">
          <span>{selecionado.nome}</span>
          <button onClick={() => onSelecionar(null)} className="text-xs text-wake-500 hover:text-wake-600">
            Trocar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <span className="mb-1.5 block text-sm font-medium text-hull-900">{label}</span>
      <input
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder={placeholder}
        className="input"
      />
      {aberto && busca.trim() && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-foam-200 bg-white shadow-lg">
          {resultados.map((r) => (
            <button
              key={r.id}
              onMouseDown={() => {
                onSelecionar(r.id)
                setBusca('')
              }}
              className="block w-full px-3 py-2 text-left text-sm text-hull-900 hover:bg-foam-100"
            >
              {r.nome}
            </button>
          ))}
          <button
            onMouseDown={() => {
              onCriarNovo(busca.trim())
              setBusca('')
            }}
            className="block w-full border-t border-foam-200 px-3 py-2 text-left text-sm text-wake-500 hover:bg-foam-100"
          >
            + Cadastrar "{busca.trim()}"
          </button>
        </div>
      )}
    </div>
  )
}

function TagsNfcSection({ embarcacaoId, onErro }: { embarcacaoId: string; onErro: (msg: string) => void }) {
  const [tags, setTags] = useState<EmbarcacaoTag[]>([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      setTags(await listTagsEmbarcacao(embarcacaoId))
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao carregar tags NFC'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embarcacaoId])

  async function alternarAtivo(tag: EmbarcacaoTag) {
    try {
      await alternarAtivoTagEmbarcacao(tag.id, !tag.ativo)
      await carregar()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao atualizar tag'))
    }
  }

  async function excluirTag(id: string) {
    if (!confirm('Excluir esta tag NFC? O chaveiro físico correspondente para de funcionar.')) return
    try {
      await deleteTagEmbarcacao(id)
      await carregar()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao excluir tag'))
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-hull-900">
          <Nfc className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          Tags NFC
        </span>
        <button onClick={() => setCriando(true)} className="text-xs text-wake-500 hover:text-wake-600">
          + Nova tag
        </button>
      </div>

      {carregando ? (
        <p className="text-xs text-slate-400">Carregando…</p>
      ) : tags.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhum chaveiro NFC gravado ainda.</p>
      ) : (
        <ul className="space-y-1.5">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between rounded-md border border-foam-200 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-mono text-hull-900">{tag.tag_id}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {tag.modelo_nfc} · {tag.modo_gravacao} · {tag.contagem_leituras} leituras
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => alternarAtivo(tag)}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    tag.ativo ? 'bg-signal-green/10 text-signal-green' : 'bg-slate-400/10 text-slate-500'
                  }`}
                >
                  {tag.ativo ? 'Ativa' : 'Inativa'}
                </button>
                <button onClick={() => excluirTag(tag.id)} className="text-signal-red/80 hover:text-signal-red">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {criando && (
        <NovaTagNfcForm
          embarcacaoId={embarcacaoId}
          onClose={() => setCriando(false)}
          onCriada={() => {
            setCriando(false)
            carregar()
          }}
          onErro={onErro}
        />
      )}
    </div>
  )
}

function NovaTagNfcForm({
  embarcacaoId,
  onClose,
  onCriada,
  onErro,
}: {
  embarcacaoId: string
  onClose: () => void
  onCriada: () => void
  onErro: (msg: string) => void
}) {
  const [tagId, setTagId] = useState('')
  const [modelo, setModelo] = useState<ModeloNfcCapacidade>('NTAG213')
  const [modoGravacao, setModoGravacao] = useState<ModoGravacaoNfc>('HUB')
  const [salvando, setSalvando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const url = `${window.location.origin}/embarcacao/${tagId || 'TAG-XXX'}`
  const bytesUsados = computeUrlNdefBytes(url)
  const capacidade = getModelCapacity(modelo, null)
  const cabe = bytesUsados <= capacidade
  const percentual = capacidade > 0 ? Math.min(100, Math.round((bytesUsados / capacidade) * 100)) : 0

  async function salvar() {
    if (!tagId.trim()) return
    setSalvando(true)
    try {
      await createTagEmbarcacao({
        embarcacao_id: embarcacaoId,
        tag_id: tagId.trim(),
        modelo_nfc: modelo,
        modo_gravacao: modoGravacao,
      })
      onCriada()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao gravar tag'))
    } finally {
      setSalvando(false)
    }
  }

  function copiarUrl() {
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <div className="mt-3 rounded-md border border-foam-200 bg-foam-100/60 p-3">
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto label="Código físico da tag" value={tagId} onChange={setTagId} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-hull-900">Modelo do chip</span>
          <select
            value={modelo}
            onChange={(e) => setModelo(e.target.value as ModeloNfcCapacidade)}
            className="input"
          >
            {Object.entries(NFC_MODELS).map(([key, m]) => (
              <option key={key} value={key}>
                {m.label}
                {m.usableBytes ? ` (${m.usableBytes} bytes)` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-sm font-medium text-hull-900">Modo de gravação</span>
        <select
          value={modoGravacao}
          onChange={(e) => setModoGravacao(e.target.value as ModoGravacaoNfc)}
          className="input"
        >
          <option value="HUB">Hub (recomendado)</option>
          <option value="DIRECT">Direto</option>
        </select>
      </label>

      <div className="mt-3 rounded-md border border-foam-200 bg-white p-3">
        <p className="mb-1.5 text-xs text-slate-400">
          Grave esta URL no chip com um app de NFC (ex: NFC Tools):
        </p>
        <div className="flex items-center gap-2">
          <span className="flex-1 truncate font-mono text-xs text-hull-900">{url}</span>
          <button onClick={copiarUrl} className="shrink-0 text-slate-400 hover:text-wake-500">
            {copiado ? <Check className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
          </button>
        </div>
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className={cabe ? 'text-slate-400' : 'text-signal-red'}>
              {bytesUsados} / {capacidade} bytes
            </span>
            <span className={cabe ? 'text-signal-green' : 'text-signal-red'}>
              {cabe ? 'Cabe no chip' : 'Excede a capacidade'}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-foam-200">
            <div
              className={`h-full ${!cabe ? 'bg-signal-red' : percentual > 80 ? 'bg-brass-500' : 'bg-signal-green'}`}
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs text-slate-500 hover:text-hull-900">
          Cancelar
        </button>
        <button
          onClick={salvar}
          disabled={salvando || !tagId.trim() || !cabe}
          className="rounded-md bg-hull-900 px-3 py-1.5 text-xs font-medium text-foam-50 disabled:opacity-50"
        >
          {salvando ? 'Salvando…' : 'Salvar tag'}
        </button>
      </div>
    </div>
  )
}

type EventoTimeline = {
  id: string
  tipo: 'manutencao' | 'limpeza' | 'movimentacao'
  data: string | null
  titulo: string
  detalhe: string | null
}

const ICONES_EVENTO: Record<EventoTimeline['tipo'], typeof Wrench> = {
  manutencao: Wrench,
  limpeza: Sparkles,
  movimentacao: ArrowUpDown,
}

function mapManutencao(m: EmbarcacaoManutencao): EventoTimeline {
  return {
    id: m.id,
    tipo: 'manutencao',
    data: m.realizado_em,
    titulo: m.tipo ?? 'Manutenção',
    detalhe: [m.descricao, m.realizado_por].filter(Boolean).join(' — ') || null,
  }
}

function mapLimpeza(l: EmbarcacaoLimpeza): EventoTimeline {
  return {
    id: l.id,
    tipo: 'limpeza',
    data: l.limpo_em,
    titulo: 'Limpeza',
    detalhe: [l.limpo_por, l.observacoes].filter(Boolean).join(' — ') || null,
  }
}

function mapMovimentacao(mv: EmbarcacaoMovimentacao): EventoTimeline {
  return {
    id: mv.id,
    tipo: 'movimentacao',
    data: mv.movimentado_em,
    titulo: mv.tipo_movimentacao === 'SUBIDA' ? 'Subida (terra)' : 'Descida (água)',
    detalhe: [mv.responsavel, mv.observacoes].filter(Boolean).join(' — ') || null,
  }
}

function HistoricoEventosModal({
  embarcacao,
  onClose,
}: {
  embarcacao: EmbarcacaoComNomes
  onClose: () => void
}) {
  const [eventos, setEventos] = useState<EventoTimeline[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const [manutencoes, limpezas, movimentacoes] = await Promise.all([
          listManutencoesEmbarcacao(embarcacao.id),
          listLimpezasEmbarcacao(embarcacao.id),
          listMovimentacoesEmbarcacao(embarcacao.id),
        ])
        const todos = [
          ...manutencoes.map(mapManutencao),
          ...limpezas.map(mapLimpeza),
          ...movimentacoes.map(mapMovimentacao),
        ].sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
        setEventos(todos)
        setErro(null)
      } catch (e) {
        setErro(mensagemErro(e, 'Erro ao carregar histórico'))
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [embarcacao.id])

  return (
    <Modal title={`Histórico — ${embarcacao.nome}`} onClose={onClose} size="lg">
      <div className="space-y-3">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-3 py-2 text-sm text-signal-red">
            {erro}
          </div>
        )}
        {carregando ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum evento registrado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {eventos.map((ev) => {
              const Icone = ICONES_EVENTO[ev.tipo]
              return (
                <li
                  key={`${ev.tipo}-${ev.id}`}
                  className="flex items-start gap-3 rounded-md border border-foam-200 p-3"
                >
                  <Icone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-hull-900">{ev.titulo}</p>
                      <p className="shrink-0 text-xs text-slate-400">
                        {ev.data ? new Date(ev.data).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                    {ev.detalhe && <p className="mt-0.5 text-xs text-slate-500">{ev.detalhe}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
