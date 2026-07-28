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
import FichaProdutoPdf from '@/components/FichaProdutoPdf'
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
          const fotosDoProduto = fotos.filter((f) => f.produto_id === produto.id)
          const itensDoProduto = itensInclusos.filter((it) => it.produto_id === produto.id)
          const camposDoProduto = campos.filter(
            (c) =>
              c.categoria_id === (sub?.categoria_id ?? null) ||
              (produto.grupo_id && c.grupo_id === produto.grupo_id)
          )

          return (
            <FichaProdutoPdf
              key={produto.id}
              produto={produto}
              subcategoria={sub}
              fotos={fotosDoProduto}
              itensInclusos={itensDoProduto}
              campos={camposDoProduto}
              incluirPreco={incluirPrecos}
              pageBreakAfter={i < produtosDisponiveis.length - 1}
              empresa={empresa}
            />
          )
        })}
      </div>
    </div>
  )
}
