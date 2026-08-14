import { useEffect, useState, type ChangeEvent } from 'react'
import {
  Zap,
  PackagePlus,
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Users,
  FileSignature,
  FileEdit,
  Tag,
  SlidersHorizontal,
  MessageCircle,
  Image as ImageIcon,
  X,
  Upload,
  Download,
  Anchor,
  Wrench,
} from 'lucide-react'
import Modal from '@/components/Modal'
import GerarContratoModal from '@/components/GerarContratoModal'
import CamposPersonalizadosModal from '@/components/CamposPersonalizadosModal'
import CampoDinamico from '@/components/CampoDinamico'
import ImportarMotoresModal from '@/components/ImportarMotoresModal'
import ImportarAcessoriosModal from '@/components/ImportarAcessoriosModal'
import { exportarTabelaExcel } from '@/lib/exportarExcel'
import { CampoTexto, CampoNumero, CampoTextArea } from '@/components/campos'
import { formatBRL } from '@/lib/format'
import { useCrudTab } from '@/hooks/useCrudTab'
import {
  listMotores,
  createMotor,
  updateMotor,
  deleteMotor,
  listAcessorios,
  createAcessorio,
  updateAcessorio,
  deleteAcessorio,
  listProdutos,
  listCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  listSubcategorias,
  createSubcategoria,
  updateSubcategoria,
  deleteSubcategoria,
  listGrupos,
  createGrupo,
  updateGrupo,
  deleteGrupo,
  listParceiros,
  createParceiro,
  updateParceiro,
  deleteParceiro,
  listMinutas,
  createMinuta,
  updateMinuta,
  deleteMinuta,
  listMensagensModelo,
  createMensagemModelo,
  updateMensagemModelo,
  deleteMensagemModelo,
  uploadImagemMensagemModelo,
  getEmpresaConfig,
  updateEmpresaConfig,
  listMarinas,
  createMarina,
  updateMarina,
  deleteMarina,
  listFornecedores,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor,
  listCamposPersonalizados,
} from '@/lib/api'
import { PLACEHOLDERS_DISPONIVEIS, PLACEHOLDERS_COLCHETES_DISPONIVEIS } from '@/lib/contratos'
import { usePermissoes } from '@/lib/PermissoesContext'
import { mensagemErro } from '@/lib/errors'
import type {
  Motor,
  Acessorio,
  Produto,
  CategoriaProduto,
  SubcategoriaProduto,
  GrupoProduto,
  Parceiro,
  MinutaContrato,
  MensagemModelo,
  Marina,
  Fornecedor,
  CampoPersonalizado,
} from '@/types'

type Aba =
  | 'motores'
  | 'acessorios'
  | 'categorias'
  | 'parceiros'
  | 'minutas'
  | 'mensagens'
  | 'marinas'
  | 'fornecedores'
  | 'preferencias'

const TABS: { key: Aba; label: string; icon: typeof Zap }[] = [
  { key: 'motores', label: 'Motores', icon: Zap },
  { key: 'acessorios', label: 'Acessórios', icon: PackagePlus },
  { key: 'categorias', label: 'Categorias', icon: FolderTree },
  { key: 'parceiros', label: 'Parceiros', icon: Users },
  { key: 'minutas', label: 'Minutas de Contrato', icon: FileSignature },
  { key: 'mensagens', label: 'Mensagens', icon: MessageCircle },
  { key: 'marinas', label: 'Marinas', icon: Anchor },
  { key: 'fornecedores', label: 'Fornecedores', icon: Wrench },
  { key: 'preferencias', label: 'Preferências', icon: SlidersHorizontal },
]

export default function Parametrizacao() {
  const [aba, setAba] = useState<Aba>('motores')
  const { temPermissao, usaMotores } = usePermissoes()

  const tabsVisiveis = TABS.filter(
    ({ key }) => (key !== 'motores' || usaMotores) && temPermissao(`parametrizacao:${key}`)
  )

  useEffect(() => {
    if (tabsVisiveis.length > 0 && !tabsVisiveis.some((t) => t.key === aba)) {
      setAba(tabsVisiveis[0].key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabsVisiveis.map((t) => t.key).join(',')])

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">
          Configurações do sistema
        </p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          Parametrização
        </h1>
      </header>

      <div className="mb-6 flex gap-1 border-b border-foam-200">
        {tabsVisiveis.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              aba === key
                ? 'border-brass-500 text-hull-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {aba === 'motores' && <AbaMotores />}
      {aba === 'acessorios' && <AbaAcessorios />}
      {aba === 'categorias' && <AbaCategorias />}
      {aba === 'parceiros' && <AbaParceiros />}
      {aba === 'minutas' && <AbaMinutas />}
      {aba === 'mensagens' && <AbaMensagens />}
      {aba === 'marinas' && <AbaMarinas />}
      {aba === 'fornecedores' && <AbaFornecedores />}
      {aba === 'preferencias' && <AbaPreferencias />}
    </div>
  )
}

function AbaPreferencias() {
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [usaCaptacao, setUsaCaptacao] = useState(true)
  const [usaMotores, setUsaMotores] = useState(true)
  const [carregando, setCarregando] = useState(true)
  const [salvandoChave, setSalvandoChave] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    getEmpresaConfig()
      .then((config) => {
        setEmpresaId(config?.id ?? null)
        setUsaCaptacao(config?.usa_captacao ?? true)
        setUsaMotores(config?.usa_motores ?? true)
      })
      .catch((e) => setErro(mensagemErro(e, 'Erro ao carregar preferências')))
      .finally(() => setCarregando(false))
  }, [])

  async function alternar(
    chave: 'usa_captacao' | 'usa_motores',
    valor: boolean,
    setLocal: (v: boolean) => void
  ) {
    if (!empresaId) return
    setLocal(valor)
    setSalvandoChave(chave)
    try {
      await updateEmpresaConfig(empresaId, { [chave]: valor })
      setErro(null)
    } catch (e) {
      setLocal(!valor)
      setErro(mensagemErro(e, 'Erro ao salvar preferência'))
    } finally {
      setSalvandoChave(null)
    }
  }

  if (carregando) {
    return <p className="text-sm text-slate-400">Carregando…</p>
  }

  return (
    <div className="max-w-lg space-y-4">
      <ErroBanner erro={erro} />
      <div className="rounded-md border border-foam-200 bg-white p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={usaCaptacao}
            disabled={salvandoChave === 'usa_captacao'}
            onChange={(e) => alternar('usa_captacao', e.target.checked, setUsaCaptacao)}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm font-medium text-hull-900">Usar aba de Captação</span>
            <span className="block text-xs text-slate-400">
              Desative se esta empresa não trabalha com aquisição/consignação de itens usados. A
              aba some do menu para todos os usuários.
            </span>
          </span>
        </label>
      </div>
      <div className="rounded-md border border-foam-200 bg-white p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={usaMotores}
            disabled={salvandoChave === 'usa_motores'}
            onChange={(e) => alternar('usa_motores', e.target.checked, setUsaMotores)}
            className="mt-0.5"
          />
          <span>
            <span className="block text-sm font-medium text-hull-900">
              Usar catálogo de Motores
            </span>
            <span className="block text-xs text-slate-400">
              Desative se esta empresa não vende nada motorizado. Some a aba "Motores" da
              Parametrização (o campo Comprimento e os passos de Motorização/Opcionais no
              orçamento continuam controlados por subcategoria, em Categorias).
            </span>
          </span>
        </label>
      </div>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
    >
      <Plus className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  )
}

function ErroBanner({ erro }: { erro: string | null }) {
  if (!erro) return null
  return (
    <div className="mb-4 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
      {erro}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Motores
// ---------------------------------------------------------------------------

const MOTOR_VAZIO = {
  marca: '',
  modelo: '',
  potencia: 0,
  preco: 0,
  combustivel: 'Gasolina' as 'Gasolina' | 'Diesel',
  ativo: true,
}

function AbaMotores() {
  const { temPermissao } = usePermissoes()
  const podeInserir = temPermissao('dados:motores:inserir')
  const podeExcluir = temPermissao('dados:motores:excluir')
  const podeExportar = temPermissao('dados:motores:exportar')

  const [itens, setItens] = useState<Motor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<Motor | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(MOTOR_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [importando, setImportando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      setItens(await listMotores())
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao carregar motores'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirCriacao() {
    setForm(MOTOR_VAZIO)
    setCriando(true)
  }

  function abrirEdicao(m: Motor) {
    setForm({
      marca: m.marca,
      modelo: m.modelo,
      potencia: m.potencia,
      preco: m.preco,
      combustivel: m.combustivel,
      ativo: m.ativo,
    })
    setEditando(m)
  }

  async function salvar() {
    setSalvando(true)
    try {
      if (editando) {
        await updateMotor(editando.id, form)
      } else {
        await createMotor(form)
      }
      setEditando(null)
      setCriando(false)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao salvar motor'))
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(m: Motor) {
    try {
      await updateMotor(m.id, { ativo: !m.ativo })
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao atualizar motor'))
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este motor?')) return
    try {
      await deleteMotor(id)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao excluir motor'))
    }
  }

  function exportar() {
    exportarTabelaExcel(
      'motores',
      ['Marca', 'Modelo', 'Potência (HP)', 'Preço (R$)', 'Combustível', 'Ativo'],
      itens.map((m) => [m.marca, m.modelo, m.potencia, m.preco, m.combustivel, m.ativo ? 'Sim' : 'Não'])
    )
  }

  const modalAberto = criando || editando !== null

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end gap-2">
        {podeExportar && (
          <button
            onClick={exportar}
            className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm text-hull-900 hover:border-wake-400"
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
            Exportar
          </button>
        )}
        {podeInserir && (
          <>
            <button
              onClick={() => setImportando(true)}
              className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm text-hull-900 hover:border-wake-400"
            >
              <Upload className="h-4 w-4" strokeWidth={1.75} />
              Importar planilha
            </button>
            <AddButton label="Novo motor" onClick={abrirCriacao} />
          </>
        )}
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Marca / Modelo</th>
                <th className="px-4 py-3 font-medium">Potência</th>
                <th className="px-4 py-3 font-medium">Combustível</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {itens.map((motor) => (
                <tr key={motor.id}>
                  <td className="px-4 py-3 text-hull-900">
                    {motor.marca} {motor.modelo}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{motor.potencia} HP</td>
                  <td className="px-4 py-3 text-slate-600">{motor.combustivel}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{formatBRL(motor.preco)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => alternarAtivo(motor)}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        motor.ativo
                          ? 'bg-signal-green/10 text-signal-green'
                          : 'bg-slate-400/10 text-slate-500'
                      }`}
                    >
                      {motor.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => abrirEdicao(motor)} className="text-wake-500 hover:text-wake-600">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      {podeExcluir && (
                        <button
                          onClick={() => excluir(motor.id)}
                          className="text-signal-red/80 hover:text-signal-red"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      )}
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
          title={editando ? `Editar ${editando.marca} ${editando.modelo}` : 'Novo motor'}
          onClose={() => {
            setCriando(false)
            setEditando(null)
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setCriando(false)
                  setEditando(null)
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.marca.trim() || !form.modelo.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto label="Marca" value={form.marca} onChange={(v) => setForm({ ...form, marca: v })} />
              <CampoTexto
                label="Modelo"
                value={form.modelo}
                onChange={(v) => setForm({ ...form, modelo: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CampoNumero
                label="Potência (HP)"
                value={form.potencia}
                onChange={(v) => setForm({ ...form, potencia: v })}
              />
              <CampoNumero label="Preço (R$)" value={form.preco} onChange={(v) => setForm({ ...form, preco: v })} />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Combustível</span>
              <select
                value={form.combustivel}
                onChange={(e) =>
                  setForm({ ...form, combustivel: e.target.value as 'Gasolina' | 'Diesel' })
                }
                className="input"
              >
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
              </select>
            </label>
          </div>
        </Modal>
      )}

      {importando && (
        <ImportarMotoresModal onClose={() => setImportando(false)} onImportado={carregar} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Acessórios
// ---------------------------------------------------------------------------

const ACESSORIO_VAZIO = {
  nome: '',
  preco: 0,
  categoria: '',
  produto_id: null as string | null,
  subcategoria_ids: [] as string[],
}

function AbaAcessorios() {
  const { temPermissao } = usePermissoes()
  const podeInserir = temPermissao('dados:acessorios:inserir')
  const podeExcluir = temPermissao('dados:acessorios:excluir')
  const podeExportar = temPermissao('dados:acessorios:exportar')

  const [itens, setItens] = useState<Acessorio[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<Acessorio | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(ACESSORIO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [importando, setImportando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const [ac, pr, sc] = await Promise.all([listAcessorios(), listProdutos(), listSubcategorias()])
      setItens(ac)
      setProdutos(pr)
      setSubcategorias(sc)
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao carregar acessórios'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirCriacao() {
    setForm(ACESSORIO_VAZIO)
    setCriando(true)
  }

  function abrirEdicao(a: Acessorio) {
    setForm({
      nome: a.nome,
      preco: a.preco,
      categoria: a.categoria,
      produto_id: a.produto_id,
      subcategoria_ids: a.subcategoria_ids,
    })
    setEditando(a)
  }

  function toggleSubcategoria(id: string) {
    setForm((prev) => ({
      ...prev,
      subcategoria_ids: prev.subcategoria_ids.includes(id)
        ? prev.subcategoria_ids.filter((x) => x !== id)
        : [...prev.subcategoria_ids, id],
    }))
  }

  async function salvar() {
    setSalvando(true)
    try {
      if (editando) {
        await updateAcessorio(editando.id, form)
      } else {
        await createAcessorio(form)
      }
      setEditando(null)
      setCriando(false)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao salvar acessório'))
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este acessório?')) return
    try {
      await deleteAcessorio(id)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao excluir acessório'))
    }
  }

  function exportar() {
    exportarTabelaExcel(
      'acessorios',
      ['Nome', 'Preço (R$)', 'Categoria', 'Vínculo (produto)', 'Subcategorias'],
      itens.map((item) => [
        item.nome,
        item.preco,
        item.categoria,
        item.produto_id ? produtos.find((p) => p.id === item.produto_id)?.nome ?? '' : '',
        item.subcategoria_ids.length === 0
          ? 'Todas'
          : item.subcategoria_ids
              .map((id) => subcategorias.find((s) => s.id === id)?.nome ?? '')
              .join(', '),
      ])
    )
  }

  const modalAberto = criando || editando !== null

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end gap-2">
        {podeExportar && (
          <button
            onClick={exportar}
            className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm text-hull-900 hover:border-wake-400"
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
            Exportar
          </button>
        )}
        {podeInserir && (
          <>
            <button
              onClick={() => setImportando(true)}
              className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm text-hull-900 hover:border-wake-400"
            >
              <Upload className="h-4 w-4" strokeWidth={1.75} />
              Importar planilha
            </button>
            <AddButton label="Novo acessório" onClick={abrirCriacao} />
          </>
        )}
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Vínculo</th>
                <th className="px-4 py-3 font-medium">Subcategorias</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {itens.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-hull-900">{item.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{item.categoria}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.produto_id
                      ? produtos.find((p) => p.id === item.produto_id)?.nome ?? '—'
                      : 'Universal'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.subcategoria_ids.length === 0
                      ? 'Todas'
                      : item.subcategoria_ids
                          .map((id) => subcategorias.find((s) => s.id === id)?.nome ?? '—')
                          .join(', ')}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{formatBRL(item.preco)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => abrirEdicao(item)} className="text-wake-500 hover:text-wake-600">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      {podeExcluir && (
                        <button
                          onClick={() => excluir(item.id)}
                          className="text-signal-red/80 hover:text-signal-red"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      )}
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
          title={editando ? `Editar ${editando.nome}` : 'Novo acessório'}
          onClose={() => {
            setCriando(false)
            setEditando(null)
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setCriando(false)
                  setEditando(null)
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
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
              <CampoNumero label="Preço (R$)" value={form.preco} onChange={(v) => setForm({ ...form, preco: v })} />
              <CampoTexto
                label="Categoria"
                value={form.categoria}
                onChange={(v) => setForm({ ...form, categoria: v })}
              />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Vincular a um produto (opcional)
              </span>
              <select
                value={form.produto_id ?? ''}
                onChange={(e) => setForm({ ...form, produto_id: e.target.value || null })}
                className="input"
              >
                <option value="">Universal (todos os produtos)</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </label>
            <div className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Vincular a subcategorias (opcional — vazio = todas)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {subcategorias.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-hull-900">
                    <input
                      type="checkbox"
                      checked={form.subcategoria_ids.includes(s.id)}
                      onChange={() => toggleSubcategoria(s.id)}
                      className="h-4 w-4 accent-brass-500"
                    />
                    {s.nome}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {importando && (
        <ImportarAcessoriosModal
          produtos={produtos}
          subcategorias={subcategorias}
          onClose={() => setImportando(false)}
          onImportado={carregar}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

const CATEGORIA_VAZIA = { nome: '', ordem: 0 }

function AbaCategorias() {
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [editandoCategoria, setEditandoCategoria] = useState<CategoriaProduto | null>(null)
  const [formCategoria, setFormCategoria] = useState(CATEGORIA_VAZIA)

  const [criandoSubcategoriaPara, setCriandoSubcategoriaPara] = useState<string | null>(null)
  const [editandoSubcategoria, setEditandoSubcategoria] = useState<SubcategoriaProduto | null>(null)
  const [formSubcategoria, setFormSubcategoria] = useState({
    nome: '',
    ordem: 0,
    vendido_como_esta: false,
    requer_motor: true,
  })

  const [grupos, setGrupos] = useState<GrupoProduto[]>([])
  const [criandoGrupoPara, setCriandoGrupoPara] = useState<string | null>(null)
  const [editandoGrupo, setEditandoGrupo] = useState<GrupoProduto | null>(null)
  const [formGrupo, setFormGrupo] = useState({ nome: '', ordem: 0 })

  const [camposDe, setCamposDe] = useState<
    { categoriaId: string; titulo: string } | { grupoId: string; titulo: string } | null
  >(null)

  async function carregar() {
    setCarregando(true)
    try {
      const [c, s, g] = await Promise.all([listCategorias(), listSubcategorias(), listGrupos()])
      setCategorias(c)
      setSubcategorias(s)
      setGrupos(g)
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao carregar categorias'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirCriacaoCategoria() {
    setFormCategoria({ ...CATEGORIA_VAZIA, ordem: categorias.length })
    setCriandoCategoria(true)
  }

  function abrirEdicaoCategoria(c: CategoriaProduto) {
    setFormCategoria({ nome: c.nome, ordem: c.ordem })
    setEditandoCategoria(c)
  }

  async function salvarCategoria() {
    setSalvando(true)
    try {
      if (editandoCategoria) {
        await updateCategoria(editandoCategoria.id, formCategoria)
      } else {
        await createCategoria(formCategoria)
      }
      setEditandoCategoria(null)
      setCriandoCategoria(false)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao salvar categoria'))
    } finally {
      setSalvando(false)
    }
  }

  async function excluirCategoria(id: string) {
    if (!confirm('Excluir esta categoria? Só é possível se não houver subcategorias vinculadas.'))
      return
    try {
      await deleteCategoria(id)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao excluir categoria'))
    }
  }

  function abrirCriacaoSubcategoria(categoriaId: string) {
    const doCategoria = subcategorias.filter((s) => s.categoria_id === categoriaId)
    setFormSubcategoria({ nome: '', ordem: doCategoria.length, vendido_como_esta: false, requer_motor: true })
    setCriandoSubcategoriaPara(categoriaId)
  }

  function abrirEdicaoSubcategoria(s: SubcategoriaProduto) {
    setFormSubcategoria({
      nome: s.nome,
      ordem: s.ordem,
      vendido_como_esta: s.vendido_como_esta,
      requer_motor: s.requer_motor,
    })
    setEditandoSubcategoria(s)
  }

  async function salvarSubcategoria() {
    setSalvando(true)
    try {
      if (editandoSubcategoria) {
        await updateSubcategoria(editandoSubcategoria.id, formSubcategoria)
      } else if (criandoSubcategoriaPara) {
        await createSubcategoria({ ...formSubcategoria, categoria_id: criandoSubcategoriaPara })
      }
      setEditandoSubcategoria(null)
      setCriandoSubcategoriaPara(null)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao salvar subcategoria'))
    } finally {
      setSalvando(false)
    }
  }

  async function excluirSubcategoria(id: string) {
    if (!confirm('Excluir esta subcategoria? Só é possível se não houver produtos vinculados.'))
      return
    try {
      await deleteSubcategoria(id)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao excluir subcategoria'))
    }
  }

  function abrirCriacaoGrupo(subcategoriaId: string) {
    const daSubcategoria = grupos.filter((g) => g.subcategoria_id === subcategoriaId)
    setFormGrupo({ nome: '', ordem: daSubcategoria.length })
    setCriandoGrupoPara(subcategoriaId)
  }

  function abrirEdicaoGrupo(g: GrupoProduto) {
    setFormGrupo({ nome: g.nome, ordem: g.ordem })
    setEditandoGrupo(g)
  }

  async function salvarGrupo() {
    setSalvando(true)
    try {
      if (editandoGrupo) {
        await updateGrupo(editandoGrupo.id, formGrupo)
      } else if (criandoGrupoPara) {
        await createGrupo({ ...formGrupo, subcategoria_id: criandoGrupoPara })
      }
      setEditandoGrupo(null)
      setCriandoGrupoPara(null)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao salvar grupo'))
    } finally {
      setSalvando(false)
    }
  }

  async function excluirGrupo(id: string) {
    if (!confirm('Excluir este grupo? Produtos vinculados ficam sem grupo.')) return
    try {
      await deleteGrupo(id)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao excluir grupo'))
    }
  }

  const modalCategoriaAberto = criandoCategoria || editandoCategoria !== null
  const modalSubcategoriaAberto = criandoSubcategoriaPara !== null || editandoSubcategoria !== null
  const modalGrupoAberto = criandoGrupoPara !== null || editandoGrupo !== null

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end">
        <AddButton label="Nova categoria" onClick={abrirCriacaoCategoria} />
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="space-y-4">
          {categorias.map((categoria) => (
            <article key={categoria.id} className="rounded-md border border-foam-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-hull-900">{categoria.nome}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCamposDe({ categoriaId: categoria.id, titulo: categoria.nome })
                    }
                    title="Campos personalizados"
                    className="text-wake-500 hover:text-wake-600"
                  >
                    <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => abrirEdicaoCategoria(categoria)}
                    className="text-wake-500 hover:text-wake-600"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => excluirCategoria(categoria.id)}
                    className="text-signal-red/80 hover:text-signal-red"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-foam-200 pt-3">
                {subcategorias
                  .filter((s) => s.categoria_id === categoria.id)
                  .map((sub) => (
                    <div key={sub.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{sub.nome}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => abrirEdicaoSubcategoria(sub)}
                            className="text-wake-500 hover:text-wake-600"
                          >
                            <Pencil className="h-3 w-3" strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => excluirSubcategoria(sub.id)}
                            className="text-signal-red/80 hover:text-signal-red"
                          >
                            <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                      <div className="ml-4 mt-1 space-y-1 border-l border-foam-200 pl-3">
                        {grupos
                          .filter((g) => g.subcategoria_id === sub.id)
                          .map((g) => (
                            <div key={g.id} className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{g.nome}</span>
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => setCamposDe({ grupoId: g.id, titulo: g.nome })}
                                  title="Campos personalizados"
                                  className="text-wake-500 hover:text-wake-600"
                                >
                                  <Tag className="h-2.5 w-2.5" strokeWidth={1.75} />
                                </button>
                                <button
                                  onClick={() => abrirEdicaoGrupo(g)}
                                  className="text-wake-500 hover:text-wake-600"
                                >
                                  <Pencil className="h-2.5 w-2.5" strokeWidth={1.75} />
                                </button>
                                <button
                                  onClick={() => excluirGrupo(g.id)}
                                  className="text-signal-red/80 hover:text-signal-red"
                                >
                                  <Trash2 className="h-2.5 w-2.5" strokeWidth={1.75} />
                                </button>
                              </div>
                            </div>
                          ))}
                        <button
                          onClick={() => abrirCriacaoGrupo(sub.id)}
                          className="flex items-center gap-1 text-[11px] text-wake-500 hover:text-wake-600"
                        >
                          <Plus className="h-3 w-3" strokeWidth={2} />
                          Novo grupo
                        </button>
                      </div>
                    </div>
                  ))}
                <button
                  onClick={() => abrirCriacaoSubcategoria(categoria.id)}
                  className="mt-2 flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  Nova subcategoria
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalCategoriaAberto && (
        <Modal
          title={editandoCategoria ? `Editar ${editandoCategoria.nome}` : 'Nova categoria'}
          onClose={() => {
            setCriandoCategoria(false)
            setEditandoCategoria(null)
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setCriandoCategoria(false)
                  setEditandoCategoria(null)
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvarCategoria}
                disabled={salvando || !formCategoria.nome.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <CampoTexto
              label="Nome"
              value={formCategoria.nome}
              onChange={(v) => setFormCategoria({ ...formCategoria, nome: v })}
            />
            <CampoNumero
              label="Ordem"
              value={formCategoria.ordem}
              onChange={(v) => setFormCategoria({ ...formCategoria, ordem: v })}
            />
          </div>
        </Modal>
      )}

      {modalSubcategoriaAberto && (
        <Modal
          title={editandoSubcategoria ? `Editar ${editandoSubcategoria.nome}` : 'Nova subcategoria'}
          onClose={() => {
            setCriandoSubcategoriaPara(null)
            setEditandoSubcategoria(null)
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setCriandoSubcategoriaPara(null)
                  setEditandoSubcategoria(null)
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvarSubcategoria}
                disabled={salvando || !formSubcategoria.nome.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <CampoTexto
              label="Nome"
              value={formSubcategoria.nome}
              onChange={(v) => setFormSubcategoria({ ...formSubcategoria, nome: v })}
            />
            <CampoNumero
              label="Ordem"
              value={formSubcategoria.ordem}
              onChange={(v) => setFormSubcategoria({ ...formSubcategoria, ordem: v })}
            />
            <label className="flex items-start gap-2 text-sm text-hull-900">
              <input
                type="checkbox"
                checked={formSubcategoria.requer_motor}
                onChange={(e) =>
                  setFormSubcategoria({ ...formSubcategoria, requer_motor: e.target.checked })
                }
                className="mt-0.5"
              />
              Envolve motor e comprimento (embarcações, veículos) — mostra o campo Comprimento no
              cadastro do produto e exige Motor/Opcionais no orçamento
            </label>
            <label className="flex items-start gap-2 text-sm text-hull-900">
              <input
                type="checkbox"
                checked={formSubcategoria.vendido_como_esta}
                onChange={(e) =>
                  setFormSubcategoria({ ...formSubcategoria, vendido_como_esta: e.target.checked })
                }
                className="mt-0.5"
              />
              Vendido como está (puxa dados do checklist de captação)
            </label>
          </div>
        </Modal>
      )}

      {modalGrupoAberto && (
        <Modal
          title={editandoGrupo ? `Editar ${editandoGrupo.nome}` : 'Novo grupo'}
          onClose={() => {
            setCriandoGrupoPara(null)
            setEditandoGrupo(null)
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setCriandoGrupoPara(null)
                  setEditandoGrupo(null)
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvarGrupo}
                disabled={salvando || !formGrupo.nome.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <CampoTexto
              label="Nome"
              value={formGrupo.nome}
              onChange={(v) => setFormGrupo({ ...formGrupo, nome: v })}
            />
            <CampoNumero
              label="Ordem"
              value={formGrupo.ordem}
              onChange={(v) => setFormGrupo({ ...formGrupo, ordem: v })}
            />
          </div>
        </Modal>
      )}

      {camposDe && (
        <CamposPersonalizadosModal
          categoriaId={'categoriaId' in camposDe ? camposDe.categoriaId : undefined}
          grupoId={'grupoId' in camposDe ? camposDe.grupoId : undefined}
          titulo={camposDe.titulo}
          onClose={() => setCamposDe(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Parceiros
// ---------------------------------------------------------------------------

type ParceiroForm = {
  nome: string
  contato: string
  telefone: string
  observacoes: string
}

const PARCEIRO_VAZIO: ParceiroForm = { nome: '', contato: '', telefone: '', observacoes: '' }

function AbaParceiros() {
  const {
    itens,
    carregando,
    erro,
    editando,
    form,
    setForm,
    salvando,
    carregar,
    abrirCriacao,
    abrirEdicao,
    fechar,
    salvar,
    excluir,
    modalAberto,
  } = useCrudTab<Parceiro, ParceiroForm>({
    list: listParceiros,
    create: (f) =>
      createParceiro({
        nome: f.nome,
        contato: f.contato || null,
        telefone: f.telefone || null,
        observacoes: f.observacoes || null,
      }),
    update: (id, f) =>
      updateParceiro(id, {
        nome: f.nome,
        contato: f.contato || null,
        telefone: f.telefone || null,
        observacoes: f.observacoes || null,
      }),
    remove: deleteParceiro,
    vazio: PARCEIRO_VAZIO,
    mensagemExclusao: 'Excluir este parceiro? Produtos vinculados a ele ficam sem parceiro.',
  })

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end">
        <AddButton label="Novo parceiro" onClick={abrirCriacao} />
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum parceiro cadastrado ainda.</p>
      ) : (
        <div className="space-y-2">
          {itens.map((parceiro) => (
            <div
              key={parceiro.id}
              className="flex items-center justify-between rounded-md border border-foam-200 bg-white p-4"
            >
              <div>
                <p className="font-display text-lg text-hull-900">{parceiro.nome}</p>
                <p className="text-xs text-slate-500">
                  {[parceiro.contato, parceiro.telefone].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    abrirEdicao(parceiro, {
                      nome: parceiro.nome,
                      contato: parceiro.contato ?? '',
                      telefone: parceiro.telefone ?? '',
                      observacoes: parceiro.observacoes ?? '',
                    })
                  }
                  className="text-wake-500 hover:text-wake-600"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => excluir(parceiro.id)}
                  className="text-signal-red/80 hover:text-signal-red"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.nome}` : 'Novo parceiro'}
          onClose={fechar}
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
            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <CampoTexto label="Contato" value={form.contato} onChange={(v) => setForm({ ...form, contato: v })} />
            <CampoTexto
              label="Telefone"
              value={form.telefone}
              onChange={(v) => setForm({ ...form, telefone: v })}
            />
            <CampoTexto
              label="Observações"
              value={form.observacoes}
              onChange={(v) => setForm({ ...form, observacoes: v })}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Minutas de Contrato
// ---------------------------------------------------------------------------

type MinutaForm = { nome: string; corpo: string; ativo: boolean }

const MINUTA_VAZIA: MinutaForm = { nome: '', corpo: '', ativo: true }

function AbaMinutas() {
  const [gerandoContratoPara, setGerandoContratoPara] = useState<MinutaContrato | null>(null)

  const {
    itens,
    carregando,
    erro,
    editando,
    form,
    setForm,
    salvando,
    carregar,
    abrirCriacao,
    abrirEdicao,
    fechar,
    salvar,
    excluir,
    modalAberto,
  } = useCrudTab<MinutaContrato, MinutaForm>({
    list: listMinutas,
    create: createMinuta,
    update: updateMinuta,
    remove: deleteMinuta,
    vazio: MINUTA_VAZIA,
    mensagemExclusao: 'Excluir esta minuta de contrato?',
  })

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end">
        <AddButton label="Nova minuta" onClick={abrirCriacao} />
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma minuta de contrato cadastrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {itens.map((minuta) => (
            <div
              key={minuta.id}
              className="flex items-center justify-between rounded-md border border-foam-200 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <p className="font-display text-lg text-hull-900">{minuta.nome}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    minuta.ativo ? 'bg-signal-green/10 text-signal-green' : 'bg-foam-200 text-slate-400'
                  }`}
                >
                  {minuta.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGerandoContratoPara(minuta)}
                  className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                >
                  <FileEdit className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Gerar contrato
                </button>
                <button
                  onClick={() =>
                    abrirEdicao(minuta, { nome: minuta.nome, corpo: minuta.corpo, ativo: minuta.ativo })
                  }
                  className="text-wake-500 hover:text-wake-600"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => excluir(minuta.id)}
                  className="text-signal-red/80 hover:text-signal-red"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.nome}` : 'Nova minuta'}
          onClose={fechar}
          size="lg"
          footer={
            <>
              <button onClick={fechar} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome.trim() || !form.corpo.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <label className="flex items-center gap-2 text-sm text-hull-900">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                className="h-4 w-4 accent-brass-500"
              />
              Ativa (aparece para seleção na hora de gerar contrato)
            </label>
            <CampoTextArea
              label="Corpo do contrato"
              value={form.corpo}
              onChange={(v) => setForm({ ...form, corpo: v })}
              rows={14}
            />
            <div className="rounded-md border border-foam-200 bg-foam-100 p-3">
              <p className="mb-1.5 text-xs font-medium text-hull-900">Placeholders disponíveis</p>
              <p className="font-mono text-[11px] leading-relaxed text-slate-500">
                {PLACEHOLDERS_DISPONIVEIS.join('  ')}
              </p>
            </div>
            <div className="rounded-md border border-foam-200 bg-foam-100 p-3">
              <p className="mb-1.5 text-xs font-medium text-hull-900">
                Placeholders em colchetes (também reconhecidos)
              </p>
              <p className="font-mono text-[11px] leading-relaxed text-slate-500">
                {PLACEHOLDERS_COLCHETES_DISPONIVEIS.join('  ')}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {gerandoContratoPara && (
        <GerarContratoModal
          minutaInicial={gerandoContratoPara}
          onClose={() => setGerandoContratoPara(null)}
        />
      )}
    </div>
  )
}

type MensagemForm = { nome: string; atalho: string; texto: string; imagem_url: string | null }

const MENSAGEM_VAZIA: MensagemForm = { nome: '', atalho: '', texto: '', imagem_url: null }

function AbaMensagens() {
  const { perfil } = usePermissoes()
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [erroImagem, setErroImagem] = useState<string | null>(null)

  const {
    itens,
    carregando,
    erro,
    editando,
    form,
    setForm,
    salvando,
    carregar,
    abrirCriacao,
    abrirEdicao,
    fechar,
    salvar,
    excluir,
    modalAberto,
  } = useCrudTab<MensagemModelo, MensagemForm>({
    list: listMensagensModelo,
    create: createMensagemModelo,
    update: updateMensagemModelo,
    remove: deleteMensagemModelo,
    vazio: MENSAGEM_VAZIA,
    mensagemExclusao: 'Excluir este modelo de mensagem?',
  })

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleImagemSelecionada(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo || !perfil?.empresa_id) return
    setEnviandoImagem(true)
    setErroImagem(null)
    try {
      const url = await uploadImagemMensagemModelo(perfil.empresa_id, arquivo)
      setForm({ ...form, imagem_url: url })
    } catch (e) {
      setErroImagem(mensagemErro(e, 'Erro ao enviar imagem'))
    } finally {
      setEnviandoImagem(false)
    }
  }

  return (
    <div>
      <ErroBanner erro={erro} />
      <ErroBanner erro={erroImagem} />
      <p className="mb-4 text-sm text-slate-500">
        Modelos de mensagem prontos pra usar na hora de mandar mensagem em massa ou pelo WhatsApp
        — use <code className="rounded bg-foam-100 px-1">{'{{nome}}'}</code> ou{' '}
        <code className="rounded bg-foam-100 px-1">{'{{primeiro_nome}}'}</code> pra personalizar.
        A imagem é opcional (ex.: foto de um lançamento) — como o WhatsApp não deixa anexar uma
        imagem automaticamente junto com o link, ela fica disponível pra baixar e anexar na
        conversa manualmente.
      </p>
      <div className="mb-4 flex justify-end">
        <AddButton label="Novo modelo" onClick={abrirCriacao} />
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum modelo de mensagem cadastrado ainda.</p>
      ) : (
        <div className="space-y-2">
          {itens.map((mensagem) => (
            <div
              key={mensagem.id}
              className="flex items-center justify-between gap-3 rounded-md border border-foam-200 bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                {mensagem.imagem_url && (
                  <img
                    src={mensagem.imagem_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg text-hull-900">{mensagem.nome}</p>
                    <span className="rounded-full bg-brass-200/40 px-2 py-0.5 text-[10px] font-medium text-hull-900">
                      /{mensagem.atalho}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">{mensagem.texto}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() =>
                    abrirEdicao(mensagem, {
                      nome: mensagem.nome,
                      atalho: mensagem.atalho,
                      texto: mensagem.texto,
                      imagem_url: mensagem.imagem_url,
                    })
                  }
                  className="text-wake-500 hover:text-wake-600"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => excluir(mensagem.id)}
                  className="text-signal-red/80 hover:text-signal-red"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.nome}` : 'Novo modelo de mensagem'}
          onClose={fechar}
          size="lg"
          footer={
            <>
              <button onClick={fechar} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome.trim() || !form.atalho.trim() || !form.texto.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <div>
              <CampoTexto
                label="Atalho"
                value={form.atalho}
                onChange={(v) => setForm({ ...form, atalho: v })}
              />
              <span className="mt-1 block text-[11px] text-slate-400">Ex.: lancamento-glm60</span>
            </div>
            <CampoTextArea
              label="Texto da mensagem"
              value={form.texto}
              onChange={(v) => setForm({ ...form, texto: v })}
              rows={6}
            />

            <div>
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Imagem (opcional)
              </span>
              {form.imagem_url ? (
                <div className="flex items-center gap-3">
                  <img
                    src={form.imagem_url}
                    alt=""
                    className="h-16 w-16 rounded-md border border-foam-200 object-cover"
                  />
                  <button
                    onClick={() => setForm({ ...form, imagem_url: null })}
                    className="flex items-center gap-1.5 rounded-md border border-foam-200 px-3 py-1.5 text-xs text-hull-900 hover:border-wake-400"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Remover imagem
                  </button>
                </div>
              ) : (
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400">
                  <ImageIcon className="h-4 w-4" strokeWidth={1.75} />
                  {enviandoImagem ? 'Enviando…' : 'Selecionar imagem'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={enviandoImagem}
                    onChange={handleImagemSelecionada}
                  />
                </label>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Marinas (módulo de Embarcações / NFC)
// ---------------------------------------------------------------------------

const MARINA_VAZIA = { nome: '', localizacao: '', contato: '', pin_acesso: '', atributos: {} as Record<string, string | number | boolean | null> }

function AbaMarinas() {
  const {
    itens: marinas,
    carregando,
    erro,
    editando,
    form,
    salvando,
    setForm,
    carregar,
    abrirCriacao,
    abrirEdicao,
    fechar,
    salvar,
    excluir,
    modalAberto,
  } = useCrudTab<Marina, typeof MARINA_VAZIA>({
    list: listMarinas,
    create: createMarina,
    update: updateMarina,
    remove: deleteMarina,
    vazio: MARINA_VAZIA,
    mensagemExclusao: 'Excluir esta marina? Embarcações vinculadas a ela ficam sem marina.',
  })

  const [camposPersonalizados, setCamposPersonalizados] = useState<CampoPersonalizado[]>([])
  const [configurandoCampos, setConfigurandoCampos] = useState(false)

  async function carregarCampos() {
    try {
      setCamposPersonalizados((await listCamposPersonalizados()).filter((c) => c.contexto === 'marina'))
    } catch {
      // silencioso — a aba de marinas não depende de campos personalizados pra funcionar
    }
  }

  useEffect(() => {
    carregar()
    carregarCampos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => setConfigurandoCampos(true)}
          className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm text-hull-900 hover:border-wake-400"
        >
          Campos personalizados
        </button>
        <AddButton label="Nova marina" onClick={abrirCriacao} />
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : marinas.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma marina cadastrada.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Localização</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">PIN de acesso</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {marinas.map((marina) => (
                <tr key={marina.id}>
                  <td className="px-4 py-3 text-hull-900">{marina.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{marina.localizacao || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{marina.contato || '—'}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{marina.pin_acesso || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() =>
                          abrirEdicao(marina, {
                            nome: marina.nome,
                            localizacao: marina.localizacao ?? '',
                            contato: marina.contato ?? '',
                            pin_acesso: marina.pin_acesso ?? '',
                            atributos: marina.atributos,
                          })
                        }
                        className="text-wake-500 hover:text-wake-600"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => excluir(marina.id)}
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
          title={editando ? `Editar ${editando.nome}` : 'Nova marina'}
          onClose={fechar}
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
            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <CampoTexto
              label="Localização"
              value={form.localizacao}
              onChange={(v) => setForm({ ...form, localizacao: v })}
            />
            <CampoTexto label="Contato" value={form.contato} onChange={(v) => setForm({ ...form, contato: v })} />
            <div>
              <CampoTexto
                label="PIN de acesso"
                value={form.pin_acesso}
                onChange={(v) => setForm({ ...form, pin_acesso: v })}
              />
              <p className="mt-1 text-xs text-slate-400">
                Pedido à equipe da marina antes de registrar manutenção, limpeza ou movimentação
                pela página pública de cada embarcação.
              </p>
            </div>
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
          </div>
        </Modal>
      )}

      {configurandoCampos && (
        <CamposPersonalizadosModal
          contexto="marina"
          titulo="Marinas"
          onClose={() => {
            setConfigurandoCampos(false)
            carregarCampos()
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fornecedores (serviços de manutenção do módulo de Embarcações)
// ---------------------------------------------------------------------------

const FORNECEDOR_VAZIO = { nome: '', telefone: '', email: '', servicos: '', marcas: '', observacoes: '' }

function listaParaTexto(lista: string[]): string {
  return lista.join(', ')
}

function textoParaLista(texto: string): string[] {
  return texto
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function criarFornecedorForm(form: typeof FORNECEDOR_VAZIO): Promise<Fornecedor> {
  return createFornecedor({
    nome: form.nome,
    telefone: form.telefone || null,
    email: form.email || null,
    servicos: textoParaLista(form.servicos),
    marcas: textoParaLista(form.marcas),
    observacoes: form.observacoes || null,
  })
}

async function atualizarFornecedorForm(id: string, form: typeof FORNECEDOR_VAZIO): Promise<void> {
  return updateFornecedor(id, {
    nome: form.nome,
    telefone: form.telefone || null,
    email: form.email || null,
    servicos: textoParaLista(form.servicos),
    marcas: textoParaLista(form.marcas),
    observacoes: form.observacoes || null,
  })
}

function AbaFornecedores() {
  const {
    itens: fornecedores,
    carregando,
    erro,
    editando,
    form,
    salvando,
    setForm,
    carregar,
    abrirCriacao,
    abrirEdicao,
    fechar,
    salvar,
    excluir,
    modalAberto,
  } = useCrudTab<Fornecedor, typeof FORNECEDOR_VAZIO>({
    list: listFornecedores,
    create: criarFornecedorForm,
    update: atualizarFornecedorForm,
    remove: deleteFornecedor,
    vazio: FORNECEDOR_VAZIO,
    mensagemExclusao: 'Excluir este fornecedor?',
  })

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end">
        <AddButton label="Novo fornecedor" onClick={abrirCriacao} />
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : fornecedores.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum fornecedor cadastrado.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Serviços</th>
                <th className="px-4 py-3 font-medium">Marcas</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id}>
                  <td className="px-4 py-3 text-hull-900">{fornecedor.nome}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {[fornecedor.telefone, fornecedor.email].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{listaParaTexto(fornecedor.servicos) || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{listaParaTexto(fornecedor.marcas) || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() =>
                          abrirEdicao(fornecedor, {
                            nome: fornecedor.nome,
                            telefone: fornecedor.telefone ?? '',
                            email: fornecedor.email ?? '',
                            servicos: listaParaTexto(fornecedor.servicos),
                            marcas: listaParaTexto(fornecedor.marcas),
                            observacoes: fornecedor.observacoes ?? '',
                          })
                        }
                        className="text-wake-500 hover:text-wake-600"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => excluir(fornecedor.id)}
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
          title={editando ? `Editar ${editando.nome}` : 'Novo fornecedor'}
          onClose={fechar}
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
            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Telefone"
                value={form.telefone}
                onChange={(v) => setForm({ ...form, telefone: v })}
              />
              <CampoTexto label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            </div>
            <div>
              <CampoTexto
                label="Serviços prestados"
                value={form.servicos}
                onChange={(v) => setForm({ ...form, servicos: v })}
              />
              <p className="mt-1 text-xs text-slate-400">Separe por vírgula — ex: Motor, Elétrica, Estofamento.</p>
            </div>
            <div>
              <CampoTexto
                label="Marcas que representa"
                value={form.marcas}
                onChange={(v) => setForm({ ...form, marcas: v })}
              />
              <p className="mt-1 text-xs text-slate-400">Separe por vírgula — ex: Volvo Penta, Mercruiser.</p>
            </div>
            <CampoTextArea
              label="Observações"
              value={form.observacoes}
              onChange={(v) => setForm({ ...form, observacoes: v })}
              rows={3}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
