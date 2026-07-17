import { useEffect, useState } from 'react'
import { Plus, Images, Pencil, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import GaleriaProduto from '@/components/GaleriaProduto'
import { CampoTexto, CampoNumero } from '@/components/campos'
import { formatBRL } from '@/lib/format'
import { useCrudTab } from '@/hooks/useCrudTab'
import {
  listProdutosTerceiros,
  createProduto,
  updateProduto,
  deleteProduto,
  listCategorias,
  listSubcategorias,
  listParceiros,
  createParceiro,
} from '@/lib/api'
import type { Produto, CategoriaProduto, SubcategoriaProduto, Parceiro } from '@/types'

type ProdutoTerceiroForm = {
  nome: string
  descricao: string
  preco_base: number
  comprimento: number | null
  subcategoria_id: string
  captador_nome: string
  parceiro_id: string
}

const FORM_VAZIO: ProdutoTerceiroForm = {
  nome: '',
  descricao: '',
  preco_base: 0,
  comprimento: null,
  subcategoria_id: '',
  captador_nome: '',
  parceiro_id: '',
}

export default function ProdutosTerceiros() {
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [categoriaForm, setCategoriaForm] = useState('')
  const [produtoMidia, setProdutoMidia] = useState<Produto | null>(null)
  const [novoParceiroNome, setNovoParceiroNome] = useState('')
  const [criandoParceiro, setCriandoParceiro] = useState(false)

  useEffect(() => {
    Promise.all([listCategorias(), listSubcategorias(), listParceiros()]).then(([c, s, p]) => {
      setCategorias(c)
      setSubcategorias(s)
      setParceiros(p)
    })
  }, [])

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
  } = useCrudTab<Produto, ProdutoTerceiroForm>({
    list: listProdutosTerceiros,
    create: (f) =>
      createProduto({
        nome: f.nome,
        descricao: f.descricao,
        preco_base: f.preco_base,
        comprimento: f.comprimento,
        subcategoria_id: f.subcategoria_id,
        origem_captacao: 'Terceiro',
        captador_nome: f.captador_nome || null,
        parceiro_id: f.parceiro_id || null,
        ano: null,
        motorizacao_tipo: null,
        motorizacao_potencia: null,
        motorizacao_marca_modelo: null,
        combustivel: null,
        horas_uso: null,
        ultima_revisao: null,
      }),
    update: (id, f) =>
      updateProduto(id, {
        nome: f.nome,
        descricao: f.descricao,
        preco_base: f.preco_base,
        comprimento: f.comprimento,
        subcategoria_id: f.subcategoria_id,
        captador_nome: f.captador_nome || null,
        parceiro_id: f.parceiro_id || null,
      }),
    remove: deleteProduto,
    vazio: FORM_VAZIO,
    mensagemExclusao: 'Excluir este produto de terceiro?',
  })

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function abrirNovo() {
    setCategoriaForm('')
    setNovoParceiroNome('')
    abrirCriacao()
  }

  function abrirEdicaoProduto(produto: Produto) {
    const sub = subcategorias.find((s) => s.id === produto.subcategoria_id)
    setCategoriaForm(sub?.categoria_id ?? '')
    setNovoParceiroNome('')
    abrirEdicao(produto, {
      nome: produto.nome,
      descricao: produto.descricao,
      preco_base: produto.preco_base,
      comprimento: produto.comprimento,
      subcategoria_id: produto.subcategoria_id,
      captador_nome: produto.captador_nome ?? '',
      parceiro_id: produto.parceiro_id ?? '',
    })
  }

  async function handleNovoParceiro() {
    if (!novoParceiroNome.trim()) return
    setCriandoParceiro(true)
    try {
      const novo = await createParceiro({
        nome: novoParceiroNome.trim(),
        contato: null,
        telefone: null,
        observacoes: null,
      })
      setParceiros((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
      setForm({ ...form, parceiro_id: novo.id })
      setNovoParceiroNome('')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar parceiro')
    } finally {
      setCriandoParceiro(false)
    }
  }

  const subcategoriasFiltradas = subcategorias.filter((s) => s.categoria_id === categoriaForm)

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">
          Controle de intake externo
        </p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          Produtos de Terceiros
        </h1>
      </header>

      <div className="mb-4 flex justify-end">
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nova captação de terceiro
        </button>
      </div>

      {erro && (
        <div className="mb-4 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-slate-400">
          Nenhum produto de terceiro cadastrado ainda. Esses produtos aparecem normalmente dentro
          do Catálogo, nas suas categorias — esta tela é só o controle de captador/parceiro.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itens.map((produto) => {
            const sub = subcategorias.find((s) => s.id === produto.subcategoria_id)
            const cat = categorias.find((c) => c.id === sub?.categoria_id)
            return (
              <article key={produto.id} className="rounded-md border border-foam-200 bg-white p-4">
                <button
                  onClick={() => setProdutoMidia(produto)}
                  className="mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-md bg-hull-900/[0.04] text-slate-400 hover:bg-hull-900/[0.07]"
                >
                  {produto.foto_principal_url ? (
                    <img
                      src={produto.foto_principal_url}
                      alt={produto.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-xs">
                      <Images className="h-5 w-5" strokeWidth={1.5} />
                      Gerenciar mídia
                    </span>
                  )}
                </button>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  {cat?.nome} {sub ? `· ${sub.nome}` : ''}
                </p>
                <p className="font-display text-lg text-hull-900">{produto.nome}</p>
                <p className="text-xs text-slate-500">{produto.descricao}</p>
                <div className="mt-3 border-t border-foam-200 pt-3">
                  <span className="font-mono text-sm text-hull-900">
                    {formatBRL(produto.preco_base)}
                  </span>
                </div>
                <div className="mt-3 space-y-1 border-t border-foam-200 pt-3 text-xs text-slate-500">
                  <p>
                    <span className="text-slate-400">Captador:</span> {produto.captador_nome || '—'}
                  </p>
                  <p>
                    <span className="text-slate-400">Parceiro:</span> {produto.parceiro_nome || '—'}
                  </p>
                </div>
                <div className="mt-3 flex gap-3 border-t border-foam-200 pt-3">
                  <button
                    onClick={() => setProdutoMidia(produto)}
                    className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                  >
                    <Images className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Mídia
                  </button>
                  <button
                    onClick={() => abrirEdicaoProduto(produto)}
                    className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Editar
                  </button>
                  <button
                    onClick={() => excluir(produto.id)}
                    className="ml-auto flex items-center gap-1 text-xs text-signal-red/80 hover:text-signal-red"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Excluir
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.nome}` : 'Nova captação de terceiro'}
          onClose={fechar}
          size="xl"
          footer={
            <>
              <button onClick={fechar} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome.trim() || !form.subcategoria_id}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">Categoria</span>
                <select
                  value={categoriaForm}
                  onChange={(e) => {
                    setCategoriaForm(e.target.value)
                    setForm({ ...form, subcategoria_id: '' })
                  }}
                  className="input"
                >
                  <option value="">Selecione…</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">Subcategoria</span>
                <select
                  value={form.subcategoria_id}
                  onChange={(e) => setForm({ ...form, subcategoria_id: e.target.value })}
                  className="input"
                  disabled={!categoriaForm}
                >
                  <option value="">Selecione…</option>
                  {subcategoriasFiltradas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <CampoTexto
              label="Descrição"
              value={form.descricao}
              onChange={(v) => setForm({ ...form, descricao: v })}
            />
            <div className="grid grid-cols-2 gap-4">
              <CampoNumero
                label="Preço base (R$)"
                value={form.preco_base}
                onChange={(v) => setForm({ ...form, preco_base: v })}
              />
              <CampoNumero
                label="Comprimento (m)"
                value={form.comprimento ?? 0}
                onChange={(v) => setForm({ ...form, comprimento: v || null })}
              />
            </div>

            <div className="border-t border-foam-200 pt-4">
              <CampoTexto
                label="Quem captou"
                value={form.captador_nome}
                onChange={(v) => setForm({ ...form, captador_nome: v })}
              />
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Parceiro</span>
              <select
                value={form.parceiro_id}
                onChange={(e) => setForm({ ...form, parceiro_id: e.target.value })}
                className="input"
              >
                <option value="">Selecione…</option>
                {parceiros.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  value={novoParceiroNome}
                  onChange={(e) => setNovoParceiroNome(e.target.value)}
                  placeholder="Nome de um parceiro novo…"
                  className="input flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleNovoParceiro}
                  disabled={criandoParceiro || !novoParceiroNome.trim()}
                  className="shrink-0 rounded-md border border-foam-200 px-3 text-xs text-hull-900 hover:border-wake-400 disabled:opacity-50"
                >
                  {criandoParceiro ? 'Adicionando…' : '+ Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {produtoMidia && (
        <GaleriaProduto
          produtoId={produtoMidia.id}
          nomeProduto={produtoMidia.nome}
          onClose={() => setProdutoMidia(null)}
          onAlterar={carregar}
        />
      )}
    </div>
  )
}
