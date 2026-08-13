import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Wrench,
  Sparkles,
  ArrowUpDown,
  Nfc,
  Copy,
  Check,
  FileText,
  Upload,
} from 'lucide-react'
import Modal from '@/components/Modal'
import BuscaVinculo from '@/components/BuscaVinculo'
import { usePermissoes } from '@/lib/PermissoesContext'
import { CampoTexto, CampoNumero, CampoTextArea } from '@/components/campos'
import {
  getEmbarcacao,
  updateEmbarcacao,
  listAcessoriosEmbarcacao,
  createAcessorioEmbarcacao,
  updateAcessorioEmbarcacao,
  deleteAcessorioEmbarcacao,
  listManutencoesEmbarcacao,
  createManutencaoEmbarcacao,
  uploadAnexoManutencaoEmbarcacao,
  listLimpezasEmbarcacao,
  listMovimentacoesEmbarcacao,
  listFornecedores,
  createFornecedor,
  listTagsEmbarcacao,
  createTagEmbarcacao,
  alternarAtivoTagEmbarcacao,
  deleteTagEmbarcacao,
} from '@/lib/api'
import { mensagemErro } from '@/lib/errors'
import { exportarTagsCsv } from '@/lib/exportarCsv'
import { NFC_MODELS, computeUrlNdefBytes, getModelCapacity, type ModeloNfc as ModeloNfcCapacidade } from '@/lib/nfcCapacity'
import { ACESSORIOS_PADRAO, ESTADO_GERAL_ITENS_PADRAO } from '@/lib/checklistEmbarcacoes'
import type {
  Embarcacao,
  EmbarcacaoAcessorio,
  EmbarcacaoManutencao,
  EmbarcacaoLimpeza,
  EmbarcacaoMovimentacao,
  EmbarcacaoTag,
  Fornecedor,
  ModoGravacaoNfc,
} from '@/types'

type EmbarcacaoComNomes = Embarcacao & {
  marina_nome: string | null
  proprietario_nome: string | null
  broker_nome: string | null
}

type Aba = 'motor' | 'conforto' | 'itens' | 'estado_geral' | 'manutencoes' | 'tags'

const TABS: { key: Aba; label: string }[] = [
  { key: 'motor', label: 'Motor' },
  { key: 'conforto', label: 'Conforto' },
  { key: 'itens', label: 'Itens instalados' },
  { key: 'estado_geral', label: 'Estado geral' },
  { key: 'manutencoes', label: 'Manutenções' },
  { key: 'tags', label: 'Tags NFC' },
]

function ErroBanner({ erro }: { erro: string | null }) {
  if (!erro) return null
  return (
    <div className="mb-4 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
      {erro}
    </div>
  )
}

export default function EmbarcacaoFicha() {
  const { id } = useParams<{ id: string }>()
  const { perfil } = usePermissoes()
  const [embarcacao, setEmbarcacao] = useState<EmbarcacaoComNomes | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<Aba>('motor')

  async function carregar() {
    if (!id) return
    setCarregando(true)
    try {
      const emb = await getEmbarcacao(id)
      setEmbarcacao(emb)
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao carregar embarcação'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (carregando) {
    return <div className="p-8 text-sm text-slate-400">Carregando…</div>
  }

  if (!embarcacao) {
    return (
      <div className="p-8">
        <ErroBanner erro={erro} />
        <p className="text-sm text-slate-400">
          Embarcação não encontrada.{' '}
          <Link to="/embarcacoes" className="text-wake-500 hover:text-wake-600">
            Voltar pra lista
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <Link
        to="/embarcacoes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-hull-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        Embarcações
      </Link>
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">Ficha completa</p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          {embarcacao.nome}
        </h1>
      </header>

      <ErroBanner erro={erro} />

      <div className="mb-6 flex gap-1 border-b border-foam-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              aba === key
                ? 'border-brass-500 text-hull-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === 'motor' && <ItensCategoriaSection embarcacaoId={embarcacao.id} categoria="MOTOR" onErro={setErro} />}
      {aba === 'conforto' && <ConfortoSection embarcacaoId={embarcacao.id} onErro={setErro} />}
      {aba === 'itens' && <ItensAcessoriosSection embarcacaoId={embarcacao.id} onErro={setErro} />}
      {aba === 'estado_geral' && (
        <EstadoGeralSection embarcacao={embarcacao} onSalvo={carregar} onErro={setErro} />
      )}
      {aba === 'manutencoes' && (
        <ManutencoesSection embarcacaoId={embarcacao.id} empresaId={perfil?.empresa_id ?? ''} onErro={setErro} />
      )}
      {aba === 'tags' && <TagsNfcTabSection embarcacao={embarcacao} onErro={setErro} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Motor / Conforto / Itens instalados — todos vivem em embarcacoes_acessorios,
// discriminados por categoria
// ---------------------------------------------------------------------------

const ITEM_VAZIO = {
  nome: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  quantidade: 1,
  possui: true,
  estado: '',
  caracteristicas: '',
  potencia: '',
  tipo: '',
  combustivel: '',
  ano: null as number | null,
  joystick: false,
  horas_uso: null as number | null,
  ultima_revisao_em: '',
  instalado_em: '',
  garantia_vence_em: '',
  fornecedor_id: null as string | null,
  observacoes: '',
}

function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  useEffect(() => {
    listFornecedores().then(setFornecedores).catch(() => {})
  }, [])
  async function criarRapido(nome: string): Promise<Fornecedor> {
    const criado = await createFornecedor({ nome, telefone: null, email: null, servicos: [], marcas: [], observacoes: null })
    setFornecedores((prev) => [criado, ...prev])
    return criado
  }
  return { fornecedores, criarRapido }
}

function ItensCategoriaSection({
  embarcacaoId,
  categoria,
  onErro,
}: {
  embarcacaoId: string
  categoria: 'MOTOR'
  onErro: (msg: string) => void
}) {
  const [itens, setItens] = useState<EmbarcacaoAcessorio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState<EmbarcacaoAcessorio | null>(null)
  const [criando, setCriando] = useState(false)
  const { fornecedores, criarRapido } = useFornecedores()

  async function carregar() {
    setCarregando(true)
    try {
      const todos = await listAcessoriosEmbarcacao(embarcacaoId)
      setItens(todos.filter((i) => i.categoria === categoria))
      onErro('')
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao carregar motor'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embarcacaoId])

  async function excluir(id: string) {
    if (!confirm('Excluir este motor?')) return
    try {
      await deleteAcessorioEmbarcacao(id)
      await carregar()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao excluir motor'))
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {itens.length === 0 ? 'Nenhum motor cadastrado ainda.' : `${itens.length} motor(es) cadastrado(s).`}
        </p>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-1.5 rounded-md bg-hull-900 px-3 py-1.5 text-xs font-medium text-foam-50 hover:bg-hull-800"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Novo motor
        </button>
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="space-y-3">
          {itens.map((item) => (
            <div key={item.id} className="rounded-md border border-foam-200 bg-white p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-medium text-hull-900">{item.nome}</p>
                  <p className="text-xs text-slate-400">
                    {[item.marca, item.modelo].filter(Boolean).join(' ') || '—'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setEditando(item)} className="text-wake-500 hover:text-wake-600">
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                  <button onClick={() => excluir(item.id)} className="text-signal-red/80 hover:text-signal-red">
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
              <dl className="grid grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                <dt className="text-slate-400">Potência</dt>
                <dd className="text-hull-900">{item.potencia || '—'}</dd>
                <dt className="text-slate-400">Tipo</dt>
                <dd className="text-hull-900">{item.tipo || '—'}</dd>
                <dt className="text-slate-400">Combustível</dt>
                <dd className="text-hull-900">{item.combustivel || '—'}</dd>
                <dt className="text-slate-400">Joystick</dt>
                <dd className="text-hull-900">{item.joystick ? 'Sim' : 'Não'}</dd>
                <dt className="text-slate-400">Horas de uso</dt>
                <dd className="text-hull-900">{item.horas_uso ?? '—'}</dd>
                <dt className="text-slate-400">Última revisão</dt>
                <dd className="text-hull-900">
                  {item.ultima_revisao_em ? new Date(item.ultima_revisao_em).toLocaleDateString('pt-BR') : '—'}
                </dd>
                <dt className="text-slate-400">Ano</dt>
                <dd className="text-hull-900">{item.ano ?? '—'}</dd>
              </dl>
            </div>
          ))}
        </div>
      )}

      {(criando || editando) && (
        <ItemMotorModal
          embarcacaoId={embarcacaoId}
          item={editando}
          fornecedores={fornecedores}
          onCriarFornecedor={criarRapido}
          onClose={() => {
            setCriando(false)
            setEditando(null)
          }}
          onSalvo={() => {
            setCriando(false)
            setEditando(null)
            carregar()
          }}
          onErro={onErro}
        />
      )}
    </div>
  )
}

function ItemMotorModal({
  embarcacaoId,
  item,
  fornecedores,
  onCriarFornecedor,
  onClose,
  onSalvo,
  onErro,
}: {
  embarcacaoId: string
  item: EmbarcacaoAcessorio | null
  fornecedores: Fornecedor[]
  onCriarFornecedor: (nome: string) => Promise<Fornecedor>
  onClose: () => void
  onSalvo: () => void
  onErro: (msg: string) => void
}) {
  const [form, setForm] = useState(() =>
    item
      ? {
          ...ITEM_VAZIO,
          nome: item.nome,
          marca: item.marca ?? '',
          modelo: item.modelo ?? '',
          potencia: item.potencia ?? '',
          tipo: item.tipo ?? '',
          combustivel: item.combustivel ?? '',
          ano: item.ano,
          joystick: item.joystick ?? false,
          horas_uso: item.horas_uso,
          ultima_revisao_em: item.ultima_revisao_em ?? '',
          fornecedor_id: item.fornecedor_id,
          observacoes: item.observacoes ?? '',
        }
      : { ...ITEM_VAZIO, nome: 'Motor' }
  )
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      const payload = {
        categoria: 'MOTOR' as const,
        nome: form.nome,
        marca: form.marca || null,
        modelo: form.modelo || null,
        numero_serie: null,
        quantidade: 1,
        possui: true,
        estado: null,
        caracteristicas: null,
        potencia: form.potencia || null,
        tipo: form.tipo || null,
        combustivel: form.combustivel || null,
        ano: form.ano,
        joystick: form.joystick,
        horas_uso: form.horas_uso,
        ultima_revisao_em: form.ultima_revisao_em || null,
        instalado_em: null,
        garantia_vence_em: null,
        fornecedor_id: form.fornecedor_id,
        fornecedor: null,
        observacoes: form.observacoes || null,
      }
      if (item) {
        await updateAcessorioEmbarcacao(item.id, payload)
      } else {
        await createAcessorioEmbarcacao({ embarcacao_id: embarcacaoId, ...payload })
      }
      onSalvo()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao salvar motor'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={item ? `Editar ${item.nome}` : 'Novo motor'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
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
        <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Fabricante" value={form.marca} onChange={(v) => setForm({ ...form, marca: v })} />
          <CampoTexto
            label="Motorização"
            value={form.modelo}
            onChange={(v) => setForm({ ...form, modelo: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Potência" value={form.potencia} onChange={(v) => setForm({ ...form, potencia: v })} />
          <CampoTexto label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto
            label="Combustível"
            value={form.combustivel}
            onChange={(v) => setForm({ ...form, combustivel: v })}
          />
          <CampoNumero label="Ano" value={form.ano ?? 0} onChange={(v) => setForm({ ...form, ano: v || null })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CampoNumero
            label="Horas de uso"
            value={form.horas_uso ?? 0}
            onChange={(v) => setForm({ ...form, horas_uso: v || null })}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Última revisão</span>
            <input
              type="date"
              value={form.ultima_revisao_em}
              onChange={(e) => setForm({ ...form, ultima_revisao_em: e.target.value })}
              className="input"
            />
          </label>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.joystick}
            onChange={(e) => setForm({ ...form, joystick: e.target.checked })}
          />
          <span className="text-sm text-hull-900">Joystick</span>
        </label>
        <BuscaVinculo
          label="Fornecedor"
          itens={fornecedores}
          valorId={form.fornecedor_id}
          onSelecionar={(id) => setForm({ ...form, fornecedor_id: id })}
          onCriarNovo={async (nome) => {
            try {
              const criado = await onCriarFornecedor(nome)
              setForm((f) => ({ ...f, fornecedor_id: criado.id }))
            } catch (e) {
              onErro(mensagemErro(e, 'Erro ao cadastrar fornecedor'))
            }
          }}
          placeholder="Buscar fornecedor por nome…"
        />
        <CampoTextArea
          label="Observações"
          value={form.observacoes}
          onChange={(v) => setForm({ ...form, observacoes: v })}
          rows={3}
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Conforto — Gerador e Ar Condicionado (categoria com possui sim/não)
// ---------------------------------------------------------------------------

function ConfortoSection({ embarcacaoId, onErro }: { embarcacaoId: string; onErro: (msg: string) => void }) {
  const [itens, setItens] = useState<EmbarcacaoAcessorio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editandoCategoria, setEditandoCategoria] = useState<'GERADOR' | 'AR_CONDICIONADO' | null>(null)
  const { fornecedores, criarRapido } = useFornecedores()

  async function carregar() {
    setCarregando(true)
    try {
      const todos = await listAcessoriosEmbarcacao(embarcacaoId)
      setItens(todos.filter((i) => i.categoria === 'GERADOR' || i.categoria === 'AR_CONDICIONADO'))
      onErro('')
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao carregar conforto'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embarcacaoId])

  if (carregando) return <p className="text-sm text-slate-400">Carregando…</p>

  const gerador = itens.find((i) => i.categoria === 'GERADOR') ?? null
  const arCondicionado = itens.find((i) => i.categoria === 'AR_CONDICIONADO') ?? null

  return (
    <div className="space-y-4">
      {(
        [
          { categoria: 'GERADOR' as const, titulo: 'Gerador', item: gerador },
          { categoria: 'AR_CONDICIONADO' as const, titulo: 'Ar Condicionado', item: arCondicionado },
        ]
      ).map(({ categoria, titulo, item }) => (
        <div key={categoria} className="rounded-md border border-foam-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium text-hull-900">{titulo}</p>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  item?.possui
                    ? 'bg-signal-green/10 text-signal-green'
                    : 'bg-foam-200 text-slate-500'
                }`}
              >
                {item?.possui ? 'Possui' : 'Não possui'}
              </span>
              <button onClick={() => setEditandoCategoria(categoria)} className="text-wake-500 hover:text-wake-600">
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
          {item?.possui && (
            <dl className="grid grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-slate-400">Marca</dt>
              <dd className="text-hull-900">{item.marca || '—'}</dd>
              <dt className="text-slate-400">Potência</dt>
              <dd className="text-hull-900">{item.potencia || '—'}</dd>
              <dt className="text-slate-400">Horas de uso</dt>
              <dd className="text-hull-900">{item.horas_uso ?? '—'}</dd>
              <dt className="text-slate-400">Estado</dt>
              <dd className="text-hull-900">{item.estado || '—'}</dd>
            </dl>
          )}
        </div>
      ))}

      {editandoCategoria && (
        <ConfortoModal
          embarcacaoId={embarcacaoId}
          categoria={editandoCategoria}
          item={editandoCategoria === 'GERADOR' ? gerador : arCondicionado}
          fornecedores={fornecedores}
          onCriarFornecedor={criarRapido}
          onClose={() => setEditandoCategoria(null)}
          onSalvo={() => {
            setEditandoCategoria(null)
            carregar()
          }}
          onErro={onErro}
        />
      )}
    </div>
  )
}

function ConfortoModal({
  embarcacaoId,
  categoria,
  item,
  fornecedores,
  onCriarFornecedor,
  onClose,
  onSalvo,
  onErro,
}: {
  embarcacaoId: string
  categoria: 'GERADOR' | 'AR_CONDICIONADO'
  item: EmbarcacaoAcessorio | null
  fornecedores: Fornecedor[]
  onCriarFornecedor: (nome: string) => Promise<Fornecedor>
  onClose: () => void
  onSalvo: () => void
  onErro: (msg: string) => void
}) {
  const titulo = categoria === 'GERADOR' ? 'Gerador' : 'Ar Condicionado'
  const [possui, setPossui] = useState(item?.possui ?? false)
  const [marca, setMarca] = useState(item?.marca ?? '')
  const [potencia, setPotencia] = useState(item?.potencia ?? '')
  const [horasUso, setHorasUso] = useState<number | null>(item?.horas_uso ?? null)
  const [estado, setEstado] = useState(item?.estado ?? '')
  const [ultimaRevisao, setUltimaRevisao] = useState(item?.ultima_revisao_em ?? '')
  const [fornecedorId, setFornecedorId] = useState(item?.fornecedor_id ?? null)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      const payload = {
        categoria,
        nome: titulo,
        marca: marca || null,
        modelo: null,
        numero_serie: null,
        quantidade: 1,
        possui,
        estado: estado || null,
        caracteristicas: null,
        potencia: potencia || null,
        tipo: null,
        combustivel: null,
        ano: null,
        joystick: null,
        horas_uso: horasUso,
        ultima_revisao_em: ultimaRevisao || null,
        instalado_em: null,
        garantia_vence_em: null,
        fornecedor_id: fornecedorId,
        fornecedor: null,
        observacoes: null,
      }
      if (item) {
        await updateAcessorioEmbarcacao(item.id, payload)
      } else {
        await createAcessorioEmbarcacao({ embarcacao_id: embarcacaoId, ...payload })
      }
      onSalvo()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao salvar'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={titulo}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={possui} onChange={(e) => setPossui(e.target.checked)} />
          <span className="text-sm text-hull-900">Possui {titulo.toLowerCase()}</span>
        </label>
        {possui && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto label="Marca" value={marca} onChange={setMarca} />
              <CampoTexto label="Potência" value={potencia} onChange={setPotencia} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CampoNumero label="Horas de uso" value={horasUso ?? 0} onChange={(v) => setHorasUso(v || null)} />
              <CampoTexto label="Estado de funcionamento" value={estado} onChange={setEstado} />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Última revisão</span>
              <input
                type="date"
                value={ultimaRevisao}
                onChange={(e) => setUltimaRevisao(e.target.value)}
                className="input"
              />
            </label>
            <BuscaVinculo
              label="Fornecedor"
              itens={fornecedores}
              valorId={fornecedorId}
              onSelecionar={setFornecedorId}
              onCriarNovo={async (nome) => {
                try {
                  const criado = await onCriarFornecedor(nome)
                  setFornecedorId(criado.id)
                } catch (e) {
                  onErro(mensagemErro(e, 'Erro ao cadastrar fornecedor'))
                }
              }}
              placeholder="Buscar fornecedor por nome…"
            />
          </>
        )}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Itens instalados (acessórios) — lista livre + atalhos do checklist padrão
// ---------------------------------------------------------------------------

function ItensAcessoriosSection({
  embarcacaoId,
  onErro,
}: {
  embarcacaoId: string
  onErro: (msg: string) => void
}) {
  const [itens, setItens] = useState<EmbarcacaoAcessorio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState<EmbarcacaoAcessorio | null>(null)
  const [criandoComNome, setCriandoComNome] = useState<string | null>(null)
  const { fornecedores, criarRapido } = useFornecedores()

  async function carregar() {
    setCarregando(true)
    try {
      const todos = await listAcessoriosEmbarcacao(embarcacaoId)
      setItens(todos.filter((i) => i.categoria === 'ACESSORIO'))
      onErro('')
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao carregar itens'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embarcacaoId])

  const nomesJaAdicionados = useMemo(() => new Set(itens.map((i) => i.nome)), [itens])

  async function excluir(id: string) {
    if (!confirm('Excluir este item?')) return
    try {
      await deleteAcessorioEmbarcacao(id)
      await carregar()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao excluir item'))
    }
  }

  return (
    <div>
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Atalhos do checklist padrão
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ACESSORIOS_PADRAO.filter((nome) => !nomesJaAdicionados.has(nome)).map((nome) => (
            <button
              key={nome}
              onClick={() => setCriandoComNome(nome)}
              className="rounded-full border border-foam-200 px-2.5 py-1 text-xs text-slate-500 hover:border-wake-400 hover:text-hull-900"
            >
              + {nome}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {itens.length === 0 ? 'Nenhum item instalado ainda.' : `${itens.length} item(ns) instalado(s).`}
        </p>
        <button
          onClick={() => setCriandoComNome('')}
          className="flex items-center gap-1.5 rounded-md bg-hull-900 px-3 py-1.5 text-xs font-medium text-foam-50 hover:bg-hull-800"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Novo item
        </button>
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : itens.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Qtd</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Características</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {itens.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-hull-900">{item.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{item.quantidade}</td>
                  <td className="px-4 py-3 text-slate-600">{item.estado || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.caracteristicas || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setEditando(item)} className="text-wake-500 hover:text-wake-600">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button onClick={() => excluir(item.id)} className="text-signal-red/80 hover:text-signal-red">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {(criandoComNome !== null || editando) && (
        <ItemAcessorioModal
          embarcacaoId={embarcacaoId}
          item={editando}
          nomeInicial={criandoComNome ?? ''}
          fornecedores={fornecedores}
          onCriarFornecedor={criarRapido}
          onClose={() => {
            setCriandoComNome(null)
            setEditando(null)
          }}
          onSalvo={() => {
            setCriandoComNome(null)
            setEditando(null)
            carregar()
          }}
          onErro={onErro}
        />
      )}
    </div>
  )
}

function ItemAcessorioModal({
  embarcacaoId,
  item,
  nomeInicial,
  fornecedores,
  onCriarFornecedor,
  onClose,
  onSalvo,
  onErro,
}: {
  embarcacaoId: string
  item: EmbarcacaoAcessorio | null
  nomeInicial: string
  fornecedores: Fornecedor[]
  onCriarFornecedor: (nome: string) => Promise<Fornecedor>
  onClose: () => void
  onSalvo: () => void
  onErro: (msg: string) => void
}) {
  const [form, setForm] = useState(() =>
    item
      ? {
          nome: item.nome,
          marca: item.marca ?? '',
          modelo: item.modelo ?? '',
          numero_serie: item.numero_serie ?? '',
          quantidade: item.quantidade,
          estado: item.estado ?? '',
          caracteristicas: item.caracteristicas ?? '',
          instalado_em: item.instalado_em ?? '',
          garantia_vence_em: item.garantia_vence_em ?? '',
          fornecedor_id: item.fornecedor_id,
          observacoes: item.observacoes ?? '',
        }
      : { ...ITEM_VAZIO, nome: nomeInicial }
  )
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      const payload = {
        categoria: 'ACESSORIO' as const,
        nome: form.nome,
        marca: form.marca || null,
        modelo: form.modelo || null,
        numero_serie: form.numero_serie || null,
        quantidade: form.quantidade || 1,
        possui: true,
        estado: form.estado || null,
        caracteristicas: form.caracteristicas || null,
        potencia: null,
        tipo: null,
        combustivel: null,
        ano: null,
        joystick: null,
        horas_uso: null,
        ultima_revisao_em: null,
        instalado_em: form.instalado_em || null,
        garantia_vence_em: form.garantia_vence_em || null,
        fornecedor_id: form.fornecedor_id,
        fornecedor: null,
        observacoes: form.observacoes || null,
      }
      if (item) {
        await updateAcessorioEmbarcacao(item.id, payload)
      } else {
        await createAcessorioEmbarcacao({ embarcacao_id: embarcacaoId, ...payload })
      }
      onSalvo()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao salvar item'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={item ? `Editar ${item.nome}` : 'Novo item'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
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
          <CampoNumero
            label="Quantidade"
            value={form.quantidade}
            onChange={(v) => setForm({ ...form, quantidade: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Marca" value={form.marca} onChange={(v) => setForm({ ...form, marca: v })} />
          <CampoTexto label="Modelo" value={form.modelo} onChange={(v) => setForm({ ...form, modelo: v })} />
        </div>
        <CampoTexto
          label="Número de série"
          value={form.numero_serie}
          onChange={(v) => setForm({ ...form, numero_serie: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Estado" value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} />
          <CampoTexto
            label="Características (potência/capacidade)"
            value={form.caracteristicas}
            onChange={(v) => setForm({ ...form, caracteristicas: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Instalado em</span>
            <input
              type="date"
              value={form.instalado_em}
              onChange={(e) => setForm({ ...form, instalado_em: e.target.value })}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Garantia vence em</span>
            <input
              type="date"
              value={form.garantia_vence_em}
              onChange={(e) => setForm({ ...form, garantia_vence_em: e.target.value })}
              className="input"
            />
          </label>
        </div>
        <BuscaVinculo
          label="Fornecedor"
          itens={fornecedores}
          valorId={form.fornecedor_id}
          onSelecionar={(id) => setForm({ ...form, fornecedor_id: id })}
          onCriarNovo={async (nome) => {
            try {
              const criado = await onCriarFornecedor(nome)
              setForm((f) => ({ ...f, fornecedor_id: criado.id }))
            } catch (e) {
              onErro(mensagemErro(e, 'Erro ao cadastrar fornecedor'))
            }
          }}
          placeholder="Buscar fornecedor por nome…"
        />
        <CampoTextArea
          label="Observações"
          value={form.observacoes}
          onChange={(v) => setForm({ ...form, observacoes: v })}
          rows={3}
        />
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Estado geral (checklist de vistoria do casco)
// ---------------------------------------------------------------------------

function EstadoGeralSection({
  embarcacao,
  onSalvo,
  onErro,
}: {
  embarcacao: Embarcacao
  onSalvo: () => void
  onErro: (msg: string) => void
}) {
  const [valores, setValores] = useState<Record<string, string>>(embarcacao.estado_geral ?? {})
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      await updateEmbarcacao(embarcacao.id, { estado_geral: valores })
      onErro('')
      onSalvo()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao salvar estado geral'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        {ESTADO_GERAL_ITENS_PADRAO.map((nome) => (
          <CampoTexto
            key={nome}
            label={nome}
            value={valores[nome] ?? ''}
            onChange={(v) => setValores((prev) => ({ ...prev, [nome]: v }))}
          />
        ))}
      </div>
      <button
        onClick={salvar}
        disabled={salvando}
        className="mt-5 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
      >
        {salvando ? 'Salvando…' : 'Salvar estado geral'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Manutenções (histórico unificado + registro por staff)
// ---------------------------------------------------------------------------

type EventoTimeline = {
  id: string
  tipo: 'manutencao' | 'limpeza' | 'movimentacao'
  data: string | null
  titulo: string
  detalhe: string | null
  manutencao?: EmbarcacaoManutencao
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
    manutencao: m,
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

function ManutencoesSection({
  embarcacaoId,
  empresaId,
  onErro,
}: {
  embarcacaoId: string
  empresaId: string
  onErro: (msg: string) => void
}) {
  const [eventos, setEventos] = useState<EventoTimeline[]>([])
  const [itens, setItens] = useState<EmbarcacaoAcessorio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)
  const { fornecedores, criarRapido } = useFornecedores()

  async function carregar() {
    setCarregando(true)
    try {
      const [manutencoes, limpezas, movimentacoes, todosItens] = await Promise.all([
        listManutencoesEmbarcacao(embarcacaoId),
        listLimpezasEmbarcacao(embarcacaoId),
        listMovimentacoesEmbarcacao(embarcacaoId),
        listAcessoriosEmbarcacao(embarcacaoId),
      ])
      const todos = [
        ...manutencoes.map(mapManutencao),
        ...limpezas.map(mapLimpeza),
        ...movimentacoes.map(mapMovimentacao),
      ].sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
      setEventos(todos)
      setItens(todosItens)
      onErro('')
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao carregar histórico'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embarcacaoId])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">Histórico de manutenções, limpezas e movimentações.</p>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-1.5 rounded-md bg-hull-900 px-3 py-1.5 text-xs font-medium text-foam-50 hover:bg-hull-800"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Nova manutenção
        </button>
      </div>

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
                className="flex items-start gap-3 rounded-md border border-foam-200 bg-white p-3"
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
                  {ev.manutencao && ev.manutencao.anexos.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {ev.manutencao.anexos.map((a, i) => (
                        <a
                          key={i}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                        >
                          <FileText className="h-3 w-3" strokeWidth={1.75} />
                          {a.nome_arquivo}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {criando && (
        <NovaManutencaoModal
          embarcacaoId={embarcacaoId}
          empresaId={empresaId}
          itens={itens}
          fornecedores={fornecedores}
          onCriarFornecedor={criarRapido}
          onClose={() => setCriando(false)}
          onSalvo={() => {
            setCriando(false)
            carregar()
          }}
          onErro={onErro}
        />
      )}
    </div>
  )
}

function NovaManutencaoModal({
  embarcacaoId,
  empresaId,
  itens,
  fornecedores,
  onCriarFornecedor,
  onClose,
  onSalvo,
  onErro,
}: {
  embarcacaoId: string
  empresaId: string
  itens: EmbarcacaoAcessorio[]
  fornecedores: Fornecedor[]
  onCriarFornecedor: (nome: string) => Promise<Fornecedor>
  onClose: () => void
  onSalvo: () => void
  onErro: (msg: string) => void
}) {
  const [itemId, setItemId] = useState<string>('')
  const [tipo, setTipo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [realizadoEm, setRealizadoEm] = useState('')
  const [realizadoPor, setRealizadoPor] = useState('')
  const [custo, setCusto] = useState<number | null>(null)
  const [proximaData, setProximaData] = useState('')
  const [horasUso, setHorasUso] = useState<number | null>(null)
  const [fornecedorId, setFornecedorId] = useState<string | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      const manutencao = await createManutencaoEmbarcacao({
        embarcacao_id: embarcacaoId,
        item_id: itemId || null,
        tipo: tipo || null,
        descricao: descricao || null,
        realizado_em: realizadoEm || null,
        realizado_por: realizadoPor || null,
        custo,
        proxima_data: proximaData || null,
        horas_uso_registrada: horasUso,
        fornecedor_id: fornecedorId,
        criado_por: null,
      })
      if (arquivo && empresaId) {
        await uploadAnexoManutencaoEmbarcacao(empresaId, manutencao.id, arquivo)
      }
      onSalvo()
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao registrar manutenção'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Nova manutenção"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-hull-900">Item (opcional)</span>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="input">
            <option value="">Geral (não vinculado a um item específico)</option>
            {itens.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Tipo" value={tipo} onChange={setTipo} />
          <CampoTexto label="Realizado por" value={realizadoPor} onChange={setRealizadoPor} />
        </div>
        <CampoTextArea label="Descrição" value={descricao} onChange={setDescricao} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Realizado em</span>
            <input
              type="date"
              value={realizadoEm}
              onChange={(e) => setRealizadoEm(e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Próximo agendamento</span>
            <input
              type="date"
              value={proximaData}
              onChange={(e) => setProximaData(e.target.value)}
              className="input"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CampoNumero label="Custo (R$)" value={custo ?? 0} onChange={(v) => setCusto(v || null)} />
          <CampoNumero
            label="Horas de uso registradas"
            value={horasUso ?? 0}
            onChange={(v) => setHorasUso(v || null)}
          />
        </div>
        <BuscaVinculo
          label="Fornecedor"
          itens={fornecedores}
          valorId={fornecedorId}
          onSelecionar={setFornecedorId}
          onCriarNovo={async (nome) => {
            try {
              const criado = await onCriarFornecedor(nome)
              setFornecedorId(criado.id)
            } catch (e) {
              onErro(mensagemErro(e, 'Erro ao cadastrar fornecedor'))
            }
          }}
          placeholder="Buscar fornecedor por nome…"
        />
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400">
          <Upload className="h-4 w-4" strokeWidth={1.75} />
          {arquivo ? arquivo.name : 'Anexar NF/relatório (PDF)'}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Tags NFC
// ---------------------------------------------------------------------------

function TagsNfcTabSection({
  embarcacao,
  onErro,
}: {
  embarcacao: EmbarcacaoComNomes
  onErro: (msg: string) => void
}) {
  const [tags, setTags] = useState<EmbarcacaoTag[]>([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      setTags(await listTagsEmbarcacao(embarcacao.id))
      onErro('')
    } catch (e) {
      onErro(mensagemErro(e, 'Erro ao carregar tags NFC'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embarcacao.id])

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

  function exportarCsv() {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}embarcacao/`
    exportarTagsCsv(
      tags.map((t) => ({
        tag_id: t.tag_id,
        url: `${base}${t.tag_id}`,
        embarcacao_nome: embarcacao.nome,
        modelo_nfc: t.modelo_nfc,
      })),
      `tags-${embarcacao.nome}`,
      'nfc-tools'
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-hull-900">
          <Nfc className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          Tags NFC
        </span>
        <div className="flex gap-3">
          {tags.length > 0 && (
            <button onClick={exportarCsv} className="text-xs text-wake-500 hover:text-wake-600">
              Exportar CSV
            </button>
          )}
          <button onClick={() => setCriando(true)} className="text-xs text-wake-500 hover:text-wake-600">
            + Nova tag
          </button>
        </div>
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
              className="flex items-center justify-between rounded-md border border-foam-200 bg-white px-3 py-2 text-sm"
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
          embarcacaoId={embarcacao.id}
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

  const url = `${window.location.origin}${import.meta.env.BASE_URL}embarcacao/${tagId || 'TAG-XXX'}`
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
