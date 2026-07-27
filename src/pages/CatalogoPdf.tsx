import { useEffect, useRef, useState } from 'react'
import { FileDown, Building2 } from 'lucide-react'
import {
  listProdutos,
  listCategorias,
  listSubcategorias,
  listGrupos,
  listCamposPersonalizados,
  listTodasFotosProdutos,
  listTodosItensInclusos,
  getEmpresaConfig,
} from '@/lib/api'
import { formatPreco } from '@/lib/format'
import type {
  Produto,
  CategoriaProduto,
  SubcategoriaProduto,
  GrupoProduto,
  CampoPersonalizado,
  FotoProduto,
  ProdutoItemIncluso,
  EmpresaConfig,
} from '@/types'

const MAX_FOTOS_POR_PRODUTO = 10

function formatarValorCampo(campo: CampoPersonalizado, valor: string | number | boolean | null): string | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (campo.tipo === 'booleano') return valor ? 'Sim' : 'Não'
  if (campo.tipo === 'numero' && campo.unidade) return `${valor} ${campo.unidade}`
  return String(valor)
}

export default function CatalogoPdf() {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [incluirPrecos, setIncluirPrecos] = useState(true)

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([])
  const [grupos, setGrupos] = useState<GrupoProduto[]>([])
  const [campos, setCampos] = useState<CampoPersonalizado[]>([])
  const [fotos, setFotos] = useState<FotoProduto[]>([])
  const [itensInclusos, setItensInclusos] = useState<ProdutoItemIncluso[]>([])
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      listProdutos(),
      listCategorias(),
      listSubcategorias(),
      listGrupos(),
      listCamposPersonalizados(),
      listTodasFotosProdutos(),
      listTodosItensInclusos(),
      getEmpresaConfig(),
    ])
      .then(([p, cat, sub, gr, cp, ft, ii, emp]) => {
        setProdutos(p)
        setCategorias(cat)
        setSubcategorias(sub)
        setGrupos(gr)
        setCampos(cp)
        setFotos(ft)
        setItensInclusos(ii)
        setEmpresa(emp)
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar dados'))
      .finally(() => setCarregando(false))
  }, [])

  const produtosDisponiveis = produtos
    .filter((p) => p.status_estoque === 'disponivel')
    .slice()
    .sort((a, b) => {
      const subA = subcategorias.find((s) => s.id === a.subcategoria_id)
      const subB = subcategorias.find((s) => s.id === b.subcategoria_id)
      const catA = categorias.find((c) => c.id === subA?.categoria_id)
      const catB = categorias.find((c) => c.id === subB?.categoria_id)
      return (
        (catA?.ordem ?? 0) - (catB?.ordem ?? 0) ||
        (subA?.ordem ?? 0) - (subB?.ordem ?? 0) ||
        a.nome.localeCompare(b.nome)
      )
    })

  async function gerarPdf() {
    if (!containerRef.current) return
    setGerando(true)
    setErro(null)
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      const nomeArquivo = `catalogo-${(empresa?.nome_empresa ?? 'produtos')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}.pdf`

      await html2pdf()
        .set({
          margin: 10,
          filename: nomeArquivo,
          image: { type: 'jpeg', quality: 0.92 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(containerRef.current)
        .save()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar PDF')
    } finally {
      setGerando(false)
    }
  }

  if (carregando) {
    return <div className="p-8 text-sm text-slate-400">Carregando dados…</div>
  }

  return (
    <div className="p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">Divulgação</p>
          <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
            Catálogo em PDF
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-hull-900">
            <input
              type="checkbox"
              checked={incluirPrecos}
              onChange={(e) => setIncluirPrecos(e.target.checked)}
              className="h-4 w-4 accent-brass-500"
            />
            Incluir preços
          </label>
          <button
            onClick={gerarPdf}
            disabled={gerando || produtosDisponiveis.length === 0}
            className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" strokeWidth={1.75} />
            {gerando ? 'Gerando PDF…' : 'Gerar PDF'}
          </button>
        </div>
      </header>

      {erro && (
        <div className="mb-5 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      <p className="mb-5 text-sm text-slate-500">
        {produtosDisponiveis.length === 0
          ? 'Nenhum produto disponível para incluir no catálogo (só entram produtos com status "Disponível").'
          : `${produtosDisponiveis.length} produto(s) disponível(is) entram no catálogo — um por página. A prévia abaixo é exatamente o que vira o PDF.`}
      </p>

      <div ref={containerRef} className="mx-auto max-w-3xl bg-white">
        <div
          className="flex flex-col items-center justify-center gap-4 p-16 text-center"
          style={{ pageBreakAfter: 'always', minHeight: '250mm' }}
        >
          {empresa?.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nome_empresa} className="h-24 w-24 object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-md bg-hull-900/[0.06] text-slate-400">
              <Building2 className="h-10 w-10" strokeWidth={1.5} />
            </div>
          )}
          <h2 className="font-display text-4xl text-hull-900">{empresa?.nome_empresa ?? 'Catálogo'}</h2>
          <p className="text-sm text-slate-400">
            Catálogo gerado em {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {produtosDisponiveis.map((produto, i) => {
          const sub = subcategorias.find((s) => s.id === produto.subcategoria_id)
          const vendidoComoEsta = sub?.vendido_como_esta ?? false
          const requerMotor = sub?.requer_motor ?? true
          const fotosDoProduto = fotos
            .filter((f) => f.produto_id === produto.id)
            .slice(0, MAX_FOTOS_POR_PRODUTO)
          const itensDoProduto = vendidoComoEsta
            ? itensInclusos.filter((it) => it.produto_id === produto.id)
            : []
          const camposDoProduto = campos.filter(
            (c) =>
              c.categoria_id === (sub?.categoria_id ?? null) ||
              (produto.grupo_id && c.grupo_id === produto.grupo_id)
          )

          return (
            <div
              key={produto.id}
              className="space-y-4 p-10"
              style={{
                pageBreakAfter: i < produtosDisponiveis.length - 1 ? 'always' : 'auto',
                minHeight: '250mm',
              }}
            >
              {fotosDoProduto.length > 0 ? (
                <div>
                  <div className="aspect-video overflow-hidden rounded-md bg-hull-900/[0.04]">
                    <img
                      src={fotosDoProduto[0].url_imagem}
                      alt={produto.nome}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  {fotosDoProduto.length > 1 && (
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {fotosDoProduto.slice(1).map((f) => (
                        <img
                          key={f.id}
                          src={f.url_imagem}
                          alt=""
                          className="aspect-square rounded-md object-cover"
                          crossOrigin="anonymous"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-md bg-hull-900/[0.04] text-sm text-slate-400">
                  Sem fotos
                </div>
              )}

              <div>
                <h2 className="font-display text-2xl text-hull-900">
                  {produto.nome}
                  {produto.comprimento ? ` (${produto.comprimento}m)` : ''}
                </h2>
                {incluirPrecos && (
                  <p className="mt-1 font-mono text-lg text-hull-900">{formatPreco(produto.preco_base)}</p>
                )}
                {produto.descricao && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {produto.descricao}
                  </p>
                )}
              </div>

              {vendidoComoEsta && (requerMotor || itensDoProduto.length > 0) && (
                <div className="rounded-md border border-foam-200 p-4">
                  {requerMotor && (
                    <>
                      <p className="mb-2 text-sm font-medium text-hull-900">Dados do checklist</p>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        {produto.ano && (
                          <>
                            <dt className="text-slate-400">Ano</dt>
                            <dd className="text-hull-900">{produto.ano}</dd>
                          </>
                        )}
                        {produto.motorizacao_tipo && (
                          <>
                            <dt className="text-slate-400">Motorização</dt>
                            <dd className="text-hull-900">{produto.motorizacao_tipo}</dd>
                          </>
                        )}
                        {produto.motorizacao_potencia && (
                          <>
                            <dt className="text-slate-400">Potência</dt>
                            <dd className="text-hull-900">{produto.motorizacao_potencia}</dd>
                          </>
                        )}
                        {produto.motorizacao_marca_modelo && (
                          <>
                            <dt className="text-slate-400">Marca/modelo do motor</dt>
                            <dd className="text-hull-900">{produto.motorizacao_marca_modelo}</dd>
                          </>
                        )}
                        {produto.combustivel && (
                          <>
                            <dt className="text-slate-400">Combustível</dt>
                            <dd className="text-hull-900">{produto.combustivel}</dd>
                          </>
                        )}
                        {produto.horas_uso && (
                          <>
                            <dt className="text-slate-400">Horas de uso</dt>
                            <dd className="text-hull-900">{produto.horas_uso}</dd>
                          </>
                        )}
                        {produto.ultima_revisao && (
                          <>
                            <dt className="text-slate-400">Última revisão</dt>
                            <dd className="text-hull-900">{produto.ultima_revisao}</dd>
                          </>
                        )}
                      </dl>
                    </>
                  )}
                  {itensDoProduto.length > 0 && (
                    <div className={requerMotor ? 'mt-3 border-t border-foam-200 pt-3' : ''}>
                      <p className="mb-1.5 text-xs font-medium text-hull-900">Itens inclusos</p>
                      <ul className="space-y-1 text-xs text-slate-500">
                        {itensDoProduto.map((item) => (
                          <li key={item.id}>
                            {item.nome}
                            {item.descricao ? ` — ${item.descricao}` : ''}
                            {item.quantidade ? ` (x${item.quantidade})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {camposDoProduto.length > 0 && (
                <div className="rounded-md border border-foam-200 p-4">
                  <p className="mb-2 text-sm font-medium text-hull-900">Informações adicionais</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {camposDoProduto.map((campo) => {
                      const valorFormatado = formatarValorCampo(campo, produto.atributos?.[campo.id] ?? null)
                      if (valorFormatado === null) return null
                      return (
                        <div key={campo.id} className="contents">
                          <dt className="text-slate-400">{campo.nome}</dt>
                          <dd className="text-hull-900">{valorFormatado}</dd>
                        </div>
                      )
                    })}
                  </dl>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
