import { useEffect, useState } from 'react'
import { Zap, PackagePlus, FolderTree, Plus, Pencil, Trash2, Users, FileSignature, FileEdit } from 'lucide-react'
import Modal from '@/components/Modal'
import GerarContratoModal from '@/components/GerarContratoModal'
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
  listParceiros,
  createParceiro,
  updateParceiro,
  deleteParceiro,
  listMinutas,
  createMinuta,
  updateMinuta,
  deleteMinuta,
} from '@/lib/api'
import { PLACEHOLDERS_DISPONIVEIS, PLACEHOLDERS_COLCHETES_DISPONIVEIS } from '@/lib/contratos'
import { usePermissoes } from '@/lib/PermissoesContext'
import type {
  Motor,
  Acessorio,
  Produto,
  CategoriaProduto,
  SubcategoriaProduto,
  Parceiro,
  MinutaContrato,
} from '@/types'

type Aba = 'motores' | 'acessorios' | 'categorias' | 'parceiros' | 'minutas'

const TABS: { key: Aba; label: string; icon: typeof Zap }[] = [
  { key: 'motores', label: 'Motores', icon: Zap },
  { key: 'acessorios', label: 'Acessórios', icon: PackagePlus },
  { key: 'categorias', label: 'Categorias', icon: FolderTree },
  { key: 'parceiros', label: 'Parceiros', icon: Users },
  { key: 'minutas', label: 'Minutas de Contrato', icon: FileSignature },
]

export default function Parametrizacao() {
  const [aba, setAba] = useState<Aba>('motores')
  const { temPermissao } = usePermissoes()

  const tabsVisiveis = TABS.filter(({ key }) => temPermissao(`parametrizacao:${key}`))

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
  const [itens, setItens] = useState<Motor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<Motor | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(MOTOR_VAZIO)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      setItens(await listMotores())
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar motores')
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
      setErro(e instanceof Error ? e.message : 'Erro ao salvar motor')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(m: Motor) {
    try {
      await updateMotor(m.id, { ativo: !m.ativo })
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar motor')
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este motor?')) return
    try {
      await deleteMotor(id)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir motor')
    }
  }

  const modalAberto = criando || editando !== null

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end">
        <AddButton label="Novo motor" onClick={abrirCriacao} />
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
                      <button
                        onClick={() => excluir(motor.id)}
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Acessórios
// ---------------------------------------------------------------------------

const ACESSORIO_VAZIO = { nome: '', preco: 0, categoria: '', produto_id: null as string | null }

function AbaAcessorios() {
  const [itens, setItens] = useState<Acessorio[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<Acessorio | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(ACESSORIO_VAZIO)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const [ac, pr] = await Promise.all([listAcessorios(), listProdutos()])
      setItens(ac)
      setProdutos(pr)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar acessórios')
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
    setForm({ nome: a.nome, preco: a.preco, categoria: a.categoria, produto_id: a.produto_id })
    setEditando(a)
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
      setErro(e instanceof Error ? e.message : 'Erro ao salvar acessório')
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
      setErro(e instanceof Error ? e.message : 'Erro ao excluir acessório')
    }
  }

  const modalAberto = criando || editando !== null

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end">
        <AddButton label="Novo acessório" onClick={abrirCriacao} />
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
                  <td className="px-4 py-3 font-mono text-slate-600">{formatBRL(item.preco)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => abrirEdicao(item)} className="text-wake-500 hover:text-wake-600">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => excluir(item.id)}
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
          </div>
        </Modal>
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
  })

  async function carregar() {
    setCarregando(true)
    try {
      const [c, s] = await Promise.all([listCategorias(), listSubcategorias()])
      setCategorias(c)
      setSubcategorias(s)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar categorias')
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
      setErro(e instanceof Error ? e.message : 'Erro ao salvar categoria')
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
      setErro(e instanceof Error ? e.message : 'Erro ao excluir categoria')
    }
  }

  function abrirCriacaoSubcategoria(categoriaId: string) {
    const doCategoria = subcategorias.filter((s) => s.categoria_id === categoriaId)
    setFormSubcategoria({ nome: '', ordem: doCategoria.length, vendido_como_esta: false })
    setCriandoSubcategoriaPara(categoriaId)
  }

  function abrirEdicaoSubcategoria(s: SubcategoriaProduto) {
    setFormSubcategoria({
      nome: s.nome,
      ordem: s.ordem,
      vendido_como_esta: s.vendido_como_esta,
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
      setErro(e instanceof Error ? e.message : 'Erro ao salvar subcategoria')
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
      setErro(e instanceof Error ? e.message : 'Erro ao excluir subcategoria')
    }
  }

  const modalCategoriaAberto = criandoCategoria || editandoCategoria !== null
  const modalSubcategoriaAberto = criandoSubcategoriaPara !== null || editandoSubcategoria !== null

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
                    <div key={sub.id} className="flex items-center justify-between text-sm">
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
                checked={formSubcategoria.vendido_como_esta}
                onChange={(e) =>
                  setFormSubcategoria({ ...formSubcategoria, vendido_como_esta: e.target.checked })
                }
                className="mt-0.5"
              />
              Vendido como está (pula motor/opcionais no orçamento e puxa dados do checklist)
            </label>
          </div>
        </Modal>
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
