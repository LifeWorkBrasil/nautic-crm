import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Images, Pencil, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import GaleriaProduto from '@/components/GaleriaProduto'
import { CampoTexto, CampoNumero } from '@/components/campos'
import { formatBRL } from '@/lib/format'
import { useCrudTab } from '@/hooks/useCrudTab'
import {
  listProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
  listCategorias,
  listSubcategorias,
} from '@/lib/api'
import type { Produto, CategoriaProduto, SubcategoriaProduto } from '@/types'

type ProdutoForm = {
  nome: string
  descricao: string
  preco_base: number
  comprimento: number | null
  subcategoria_id: string
}

export default function Catalogo() {
  const { subcategoriaId } = useParams<{ subcategoriaId: string }>()
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([])
  const [produtoMidia, setProdutoMidia] = useState<Produto | null>(null)

  useEffect(() => {
    Promise.all([listCategorias(), listSubcategorias()]).then(([c, s]) => {
      setCategorias(c)
      setSubcategorias(s)
    })
  }, [])

  const subcategoria = subcategorias.find((s) => s.id === subcategoriaId)
  const categoria = categorias.find((c) => c.id === subcategoria?.categoria_id)

  const listaProdutos = useCallback(() => listProdutos(subcategoriaId), [subcategoriaId])

  const produtoVazio: ProdutoForm = {
    nome: '',
    descricao: '',
    preco_base: 0,
    comprimento: null,
    subcategoria_id: subcategoriaId ?? '',
  }

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
  } = useCrudTab<Produto, ProdutoForm>({
    list: listaProdutos,
    create: createProduto,
    update: updateProduto,
    remove: deleteProduto,
    vazio: produtoVazio,
    mensagemExclusao: 'Excluir este produto? Acessórios e orçamentos vinculados também serão removidos.',
  })

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoriaId])

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">
          {categoria?.nome ?? 'Catálogo'}
        </p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          {subcategoria?.nome ?? '…'}
        </h1>
      </header>

      <div className="mb-4 flex justify-end">
        <button
          onClick={abrirCriacao}
          className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Novo produto
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
        <p className="text-sm text-slate-400">Nenhum produto cadastrado nesta subcategoria ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itens.map((produto) => (
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
              <div className="mb-1 flex items-center gap-2">
                <p className="font-display text-lg text-hull-900">{produto.nome}</p>
                {produto.origem_captacao === 'Terceiro' && (
                  <span className="rounded-full bg-brass-400/15 px-2 py-0.5 text-[10px] font-medium text-brass-600">
                    Terceiro{produto.parceiro_nome ? ` · ${produto.parceiro_nome}` : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{produto.descricao}</p>
              <div className="mt-3 flex items-center justify-between border-t border-foam-200 pt-3">
                <span className="font-mono text-sm text-hull-900">
                  {formatBRL(produto.preco_base)}
                </span>
                <span className="text-xs text-slate-400">
                  {produto.comprimento ? `${produto.comprimento} m` : '—'}
                </span>
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
                  onClick={() =>
                    abrirEdicao(produto, {
                      nome: produto.nome,
                      descricao: produto.descricao,
                      preco_base: produto.preco_base,
                      comprimento: produto.comprimento,
                      subcategoria_id: produto.subcategoria_id,
                    })
                  }
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
          ))}
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.nome}` : 'Novo produto'}
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
