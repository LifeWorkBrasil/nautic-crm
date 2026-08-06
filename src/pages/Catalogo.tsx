import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Images, Pencil, Trash2, ListChecks, MessageCircle, Tag, BellRing, Eye, EyeOff } from 'lucide-react'
import Modal from '@/components/Modal'
import GaleriaProduto from '@/components/GaleriaProduto'
import ItensInclusosProduto from '@/components/ItensInclusosProduto'
import EnviarWhatsappProdutoModal from '@/components/EnviarWhatsappProdutoModal'
import CamposPersonalizadosModal from '@/components/CamposPersonalizadosModal'
import CampoDinamico from '@/components/CampoDinamico'
import AvisosReposicaoModal from '@/components/AvisosReposicaoModal'
import { CampoTexto, CampoNumero } from '@/components/campos'
import { formatPreco } from '@/lib/format'
import { useCrudTab } from '@/hooks/useCrudTab'
import { usePermissoes } from '@/lib/PermissoesContext'
import {
  listProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
  listCategorias,
  listSubcategorias,
  listGrupos,
  listCamposPersonalizados,
} from '@/lib/api'
import type {
  Produto,
  CategoriaProduto,
  SubcategoriaProduto,
  GrupoProduto,
  CampoPersonalizado,
} from '@/types'

type ProdutoForm = {
  nome: string
  descricao: string
  preco_base: number
  comprimento: number | null
  subcategoria_id: string
  grupo_id: string | null
  ano: number | null
  motorizacao_tipo: string | null
  motorizacao_potencia: string | null
  motorizacao_marca_modelo: string | null
  combustivel: string | null
  horas_uso: string | null
  ultima_revisao: string | null
  atributos: Record<string, string | number | boolean | null>
  status_estoque: 'disponivel' | 'esgotado' | 'oculto'
  data_reposicao: string | null
}

export default function Catalogo() {
  const { perfil } = usePermissoes()
  const { subcategoriaId } = useParams<{ subcategoriaId: string }>()
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([])
  const [grupos, setGrupos] = useState<GrupoProduto[]>([])
  const [campos, setCampos] = useState<CampoPersonalizado[]>([])
  const [produtoMidia, setProdutoMidia] = useState<Produto | null>(null)
  const [produtoItens, setProdutoItens] = useState<Produto | null>(null)
  const [produtoWhatsapp, setProdutoWhatsapp] = useState<Produto | null>(null)
  const [grupoFiltroId, setGrupoFiltroId] = useState<string | null>(null)
  const [gerenciandoCampos, setGerenciandoCampos] = useState<'categoria' | 'grupo' | null>(null)
  const [produtoAvisos, setProdutoAvisos] = useState<Produto | null>(null)

  function carregarCampos() {
    listCamposPersonalizados().then(setCampos)
  }

  useEffect(() => {
    Promise.all([listCategorias(), listSubcategorias(), listGrupos(), listCamposPersonalizados()]).then(
      ([c, s, g, cp]) => {
        setCategorias(c)
        setSubcategorias(s)
        setGrupos(g)
        setCampos(cp)
      }
    )
  }, [])

  const subcategoria = subcategorias.find((s) => s.id === subcategoriaId)
  const categoria = categorias.find((c) => c.id === subcategoria?.categoria_id)
  const subcategoriaVendidoComoEsta = subcategoria?.vendido_como_esta ?? false
  const subcategoriaRequerMotor = subcategoria?.requer_motor ?? true
  const gruposDaSubcategoria = grupos.filter((g) => g.subcategoria_id === subcategoriaId)

  const listaProdutos = useCallback(() => listProdutos(subcategoriaId), [subcategoriaId])

  const produtoVazio: ProdutoForm = {
    nome: '',
    descricao: '',
    preco_base: 0,
    comprimento: null,
    subcategoria_id: subcategoriaId ?? '',
    grupo_id: null,
    ano: null,
    motorizacao_tipo: null,
    motorizacao_potencia: null,
    motorizacao_marca_modelo: null,
    combustivel: null,
    horas_uso: null,
    ultima_revisao: null,
    atributos: {},
    status_estoque: 'disponivel',
    data_reposicao: null,
  }

  const {
    itens,
    carregando,
    erro,
    setErro,
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
    setGrupoFiltroId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoriaId])

  async function alternarOculto(produto: Produto) {
    try {
      await updateProduto(produto.id, {
        status_estoque: produto.status_estoque === 'oculto' ? 'disponivel' : 'oculto',
      })
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar o produto')
    }
  }

  const camposRelevantes = campos.filter(
    (c) => c.categoria_id === categoria?.id || (form.grupo_id && c.grupo_id === form.grupo_id)
  )

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

      {gruposDaSubcategoria.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setGrupoFiltroId(null)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              grupoFiltroId === null
                ? 'border-brass-500 bg-brass-200/30 text-hull-900'
                : 'border-foam-200 text-slate-500 hover:border-wake-400'
            }`}
          >
            Todos
          </button>
          {gruposDaSubcategoria.map((g) => (
            <button
              key={g.id}
              onClick={() => setGrupoFiltroId(g.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                grupoFiltroId === g.id
                  ? 'border-brass-500 bg-brass-200/30 text-hull-900'
                  : 'border-foam-200 text-slate-500 hover:border-wake-400'
              }`}
            >
              {g.nome}
            </button>
          ))}
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum produto cadastrado nesta subcategoria ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itens
            .filter((produto) => !grupoFiltroId || produto.grupo_id === grupoFiltroId)
            .map((produto) => (
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
                {produto.grupo_id && (
                  <span className="rounded-full bg-wake-400/15 px-2 py-0.5 text-[10px] font-medium text-wake-600">
                    {grupos.find((g) => g.id === produto.grupo_id)?.nome ?? '—'}
                  </span>
                )}
                {produto.status_estoque === 'esgotado' && (
                  <span className="rounded-full bg-signal-red/10 px-2 py-0.5 text-[10px] font-medium text-signal-red">
                    Esgotado
                  </span>
                )}
                {produto.status_estoque === 'oculto' && (
                  <span className="rounded-full bg-hull-900/10 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    Oculto
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{produto.descricao}</p>
              <div className="mt-3 flex items-center justify-between border-t border-foam-200 pt-3">
                <span className="font-mono text-sm text-hull-900">
                  {formatPreco(produto.preco_base)}
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
                      grupo_id: produto.grupo_id,
                      ano: produto.ano,
                      motorizacao_tipo: produto.motorizacao_tipo,
                      motorizacao_potencia: produto.motorizacao_potencia,
                      motorizacao_marca_modelo: produto.motorizacao_marca_modelo,
                      combustivel: produto.combustivel,
                      horas_uso: produto.horas_uso,
                      ultima_revisao: produto.ultima_revisao,
                      atributos: produto.atributos ?? {},
                      status_estoque: produto.status_estoque,
                      data_reposicao: produto.data_reposicao,
                    })
                  }
                  className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Editar
                </button>
                {subcategoriaVendidoComoEsta && (
                  <button
                    onClick={() => setProdutoItens(produto)}
                    className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                  >
                    <ListChecks className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Itens inclusos
                  </button>
                )}
                <button
                  onClick={() => setProdutoWhatsapp(produto)}
                  className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  WhatsApp
                </button>
                {produto.status_estoque === 'esgotado' && (
                  <button
                    onClick={() => setProdutoAvisos(produto)}
                    className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                  >
                    <BellRing className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Avise-me
                  </button>
                )}
                <button
                  onClick={() => alternarOculto(produto)}
                  title={
                    produto.status_estoque === 'oculto'
                      ? 'Voltar a mostrar no catálogo'
                      : 'Ocultar do catálogo (venda suspensa)'
                  }
                  className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                >
                  {produto.status_estoque === 'oculto' ? (
                    <>
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Mostrar
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Ocultar
                    </>
                  )}
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
            <div className={subcategoriaRequerMotor ? 'grid grid-cols-2 gap-4' : ''}>
              <CampoNumero
                label="Preço base (R$)"
                value={form.preco_base}
                onChange={(v) => setForm({ ...form, preco_base: v })}
              />
              {subcategoriaRequerMotor && (
                <CampoNumero
                  label="Comprimento (m)"
                  value={form.comprimento ?? 0}
                  onChange={(v) => setForm({ ...form, comprimento: v || null })}
                />
              )}
            </div>

            <div className={form.status_estoque === 'esgotado' ? 'grid grid-cols-2 gap-4' : ''}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">
                  Status de estoque
                </span>
                <select
                  value={form.status_estoque}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status_estoque: e.target.value as ProdutoForm['status_estoque'],
                    })
                  }
                  className="input"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="esgotado">Esgotado</option>
                  <option value="oculto">Oculto</option>
                </select>
              </label>
              {form.status_estoque === 'esgotado' && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">
                    Previsão de reposição (opcional)
                  </span>
                  <input
                    type="date"
                    value={form.data_reposicao ?? ''}
                    onChange={(e) => setForm({ ...form, data_reposicao: e.target.value || null })}
                    className="input"
                  />
                </label>
              )}
            </div>
            {form.status_estoque === 'oculto' && (
              <p className="text-xs text-slate-400">
                Produtos ocultos somem do catálogo público e do interno de propostas.
              </p>
            )}

            {gruposDaSubcategoria.length > 0 && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">
                  Grupo (opcional)
                </span>
                <select
                  value={form.grupo_id ?? ''}
                  onChange={(e) => setForm({ ...form, grupo_id: e.target.value || null })}
                  className="input"
                >
                  <option value="">Nenhum</option>
                  {gruposDaSubcategoria.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="space-y-4 border-t border-foam-200 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Campos personalizados
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGerenciandoCampos('categoria')}
                    className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                  >
                    <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Gerenciar campos da categoria
                  </button>
                  {form.grupo_id && (
                    <button
                      type="button"
                      onClick={() => setGerenciandoCampos('grupo')}
                      className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                    >
                      <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Gerenciar campos do grupo
                    </button>
                  )}
                </div>
              </div>
              {camposRelevantes.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Nenhum campo personalizado ainda. Use "Gerenciar campos" para criar.
                </p>
              ) : (
                camposRelevantes.map((campo) => (
                  <CampoDinamico
                    key={campo.id}
                    campo={campo}
                    valor={form.atributos[campo.id] ?? null}
                    onChange={(v) =>
                      setForm({ ...form, atributos: { ...form.atributos, [campo.id]: v } })
                    }
                  />
                ))
              )}
            </div>

            {subcategoriaVendidoComoEsta && subcategoriaRequerMotor && (
              <div className="space-y-4 border-t border-foam-200 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Dados do checklist
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <CampoNumero
                    label="Ano"
                    value={form.ano ?? 0}
                    onChange={(v) => setForm({ ...form, ano: v || null })}
                  />
                  <CampoTexto
                    label="Combustível"
                    value={form.combustivel ?? ''}
                    onChange={(v) => setForm({ ...form, combustivel: v || null })}
                  />
                  <CampoTexto
                    label="Tipo de motorização"
                    value={form.motorizacao_tipo ?? ''}
                    onChange={(v) => setForm({ ...form, motorizacao_tipo: v || null })}
                  />
                  <CampoTexto
                    label="Potência"
                    value={form.motorizacao_potencia ?? ''}
                    onChange={(v) => setForm({ ...form, motorizacao_potencia: v || null })}
                  />
                  <CampoTexto
                    label="Marca/modelo do motor"
                    value={form.motorizacao_marca_modelo ?? ''}
                    onChange={(v) => setForm({ ...form, motorizacao_marca_modelo: v || null })}
                  />
                  <CampoTexto
                    label="Horas de uso"
                    value={form.horas_uso ?? ''}
                    onChange={(v) => setForm({ ...form, horas_uso: v || null })}
                  />
                  <CampoTexto
                    label="Última revisão"
                    value={form.ultima_revisao ?? ''}
                    onChange={(v) => setForm({ ...form, ultima_revisao: v || null })}
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {produtoMidia && perfil?.empresa_id && (
        <GaleriaProduto
          empresaId={perfil.empresa_id}
          produtoId={produtoMidia.id}
          nomeProduto={produtoMidia.nome}
          onClose={() => setProdutoMidia(null)}
          onAlterar={carregar}
        />
      )}

      {produtoItens && (
        <ItensInclusosProduto
          produtoId={produtoItens.id}
          nomeProduto={produtoItens.nome}
          onClose={() => setProdutoItens(null)}
          onAlterar={carregar}
        />
      )}

      {produtoWhatsapp && (
        <EnviarWhatsappProdutoModal produto={produtoWhatsapp} onClose={() => setProdutoWhatsapp(null)} />
      )}

      {produtoAvisos && (
        <AvisosReposicaoModal
          produtoId={produtoAvisos.id}
          nomeProduto={produtoAvisos.nome}
          onClose={() => setProdutoAvisos(null)}
        />
      )}

      {gerenciandoCampos === 'categoria' && categoria && (
        <CamposPersonalizadosModal
          categoriaId={categoria.id}
          titulo={categoria.nome}
          onClose={() => {
            setGerenciandoCampos(null)
            carregarCampos()
          }}
        />
      )}

      {gerenciandoCampos === 'grupo' && form.grupo_id && (
        <CamposPersonalizadosModal
          grupoId={form.grupo_id}
          titulo={gruposDaSubcategoria.find((g) => g.id === form.grupo_id)?.nome ?? 'Grupo'}
          onClose={() => {
            setGerenciandoCampos(null)
            carregarCampos()
          }}
        />
      )}
    </div>
  )
}
