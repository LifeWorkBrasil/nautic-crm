import { useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, Download } from 'lucide-react'
import {
  listUsuarios,
  listLeads,
  listHistoricoPorPeriodo,
  listOrcamentosPorPeriodo,
  listProdutos,
  listCategorias,
  listSubcategorias,
  listGrupos,
} from '@/lib/api'
import { exportarTabelaExcel } from '@/lib/exportarExcel'
import { formatBRL } from '@/lib/format'
import type { StatusCRM, Produto } from '@/types'

const STATUS_ESTOQUE_LABEL: Record<Produto['status_estoque'], string> = {
  disponivel: 'Disponível',
  esgotado: 'Esgotado',
  oculto: 'Oculto',
}

function formatarDataInput(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`
}

interface LinhaAtividade {
  vendedor: string
  contatos: number
  emAndamento: number
  concluidas: number
  perdidos: number
  produtosTrabalhados: number
  listaProdutos: string
}

export default function Relatorios() {
  const [aba, setAba] = useState<'atividade' | 'catalogo'>('atividade')

  // ---- Atividade por vendedor/data ----
  const [dataInicio, setDataInicio] = useState(() =>
    formatarDataInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  )
  const [dataFim, setDataFim] = useState(() => formatarDataInput(new Date()))
  const [gerandoAtividade, setGerandoAtividade] = useState(false)
  const [linhasAtividade, setLinhasAtividade] = useState<LinhaAtividade[] | null>(null)
  const [erroAtividade, setErroAtividade] = useState<string | null>(null)

  async function gerarRelatorioAtividade() {
    setGerandoAtividade(true)
    setErroAtividade(null)
    try {
      const inicioISO = new Date(`${dataInicio}T00:00:00`).toISOString()
      const fimISO = new Date(`${dataFim}T23:59:59`).toISOString()

      const [usuarios, leads, historico, orcamentos] = await Promise.all([
        listUsuarios(),
        listLeads(),
        listHistoricoPorPeriodo(inicioISO, fimISO),
        listOrcamentosPorPeriodo(inicioISO, fimISO),
      ])

      const leadsNoPeriodo = leads.filter((l) => l.criado_em >= inicioISO && l.criado_em <= fimISO)
      const emAndamentoStatus: StatusCRM[] = ['Lead', 'Proposta Enviada', 'Negociação']

      function montarLinha(vendedorNome: string, vendedorId: string | null): LinhaAtividade {
        const leadsDoVendedor = leads.filter((l) => (l.vendedor_id ?? null) === vendedorId)
        const leadsNoPeriodoDoVendedor = leadsNoPeriodo.filter(
          (l) => (l.vendedor_id ?? null) === vendedorId
        )
        const contatos = historico.filter((h) => (h.vendedor_id ?? null) === vendedorId).length
        const emAndamento = leadsDoVendedor.filter((l) => emAndamentoStatus.includes(l.status_crm)).length
        const concluidas = leadsNoPeriodoDoVendedor.filter((l) => l.status_crm === 'Venda Concluída').length
        const perdidos = leadsNoPeriodoDoVendedor.filter((l) => l.status_crm === 'Perdido').length
        const produtos = new Set(
          orcamentos
            .filter((o) => (o.vendedor_id ?? null) === vendedorId && o.produto_nome)
            .map((o) => o.produto_nome as string)
        )
        return {
          vendedor: vendedorNome,
          contatos,
          emAndamento,
          concluidas,
          perdidos,
          produtosTrabalhados: produtos.size,
          listaProdutos: Array.from(produtos).join(', '),
        }
      }

      const linhas = usuarios.map((u) => montarLinha(u.nome, u.id))

      const temSemVendedor =
        leads.some((l) => !l.vendedor_id) ||
        historico.some((h) => !h.vendedor_id) ||
        orcamentos.some((o) => !o.vendedor_id)
      if (temSemVendedor) linhas.push(montarLinha('Sem vendedor', null))

      setLinhasAtividade(linhas)
    } catch (e) {
      setErroAtividade(e instanceof Error ? e.message : 'Erro ao gerar relatório')
    } finally {
      setGerandoAtividade(false)
    }
  }

  function exportarAtividade() {
    if (!linhasAtividade) return
    exportarTabelaExcel(
      `atividade-${dataInicio}-a-${dataFim}`,
      ['Vendedor', 'Contatos registrados', 'Em andamento (atual)', 'Vendas concluídas', 'Perdidos', 'Produtos distintos', 'Quais produtos'],
      linhasAtividade.map((l) => [
        l.vendedor,
        l.contatos,
        l.emAndamento,
        l.concluidas,
        l.perdidos,
        l.produtosTrabalhados,
        l.listaProdutos,
      ])
    )
  }

  // ---- Catálogo de produtos ----
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categoriaPorId, setCategoriaPorId] = useState<Map<string, string>>(new Map())
  const [subcategoriaPorId, setSubcategoriaPorId] = useState<
    Map<string, { nome: string; categoria_id: string }>
  >(new Map())
  const [grupoPorId, setGrupoPorId] = useState<Map<string, string>>(new Map())
  const [filtroStatus, setFiltroStatus] = useState<'todos' | Produto['status_estoque']>('todos')
  const [erroCatalogo, setErroCatalogo] = useState<string | null>(null)

  useEffect(() => {
    if (aba !== 'catalogo' || produtos.length > 0) return
    setCarregandoCatalogo(true)
    Promise.all([listProdutos(), listCategorias(), listSubcategorias(), listGrupos()])
      .then(([p, categorias, subcategorias, grupos]) => {
        setProdutos(p)
        setCategoriaPorId(new Map(categorias.map((c) => [c.id, c.nome])))
        setSubcategoriaPorId(new Map(subcategorias.map((s) => [s.id, { nome: s.nome, categoria_id: s.categoria_id }])))
        setGrupoPorId(new Map(grupos.map((g) => [g.id, g.nome])))
      })
      .catch((e) => setErroCatalogo(e instanceof Error ? e.message : 'Erro ao carregar catálogo'))
      .finally(() => setCarregandoCatalogo(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba])

  const linhasCatalogo = useMemo(() => {
    return produtos
      .filter((p) => filtroStatus === 'todos' || p.status_estoque === filtroStatus)
      .map((p) => {
        const sub = p.subcategoria_id ? subcategoriaPorId.get(p.subcategoria_id) : undefined
        const categoria = sub ? categoriaPorId.get(sub.categoria_id) : undefined
        const grupo = p.grupo_id ? grupoPorId.get(p.grupo_id) : undefined
        return {
          nome: p.nome,
          categoria: categoria ?? '',
          subcategoria: sub?.nome ?? '',
          grupo: grupo ?? '',
          preco: p.preco_base,
          status: STATUS_ESTOQUE_LABEL[p.status_estoque],
          origem: p.origem_captacao === 'Terceiro' ? 'Terceiro' : 'Próprio',
        }
      })
  }, [produtos, filtroStatus, categoriaPorId, subcategoriaPorId, grupoPorId])

  const valorTotalCatalogo = useMemo(
    () => linhasCatalogo.reduce((soma, l) => soma + (l.preco || 0), 0),
    [linhasCatalogo]
  )

  function exportarCatalogo() {
    exportarTabelaExcel(
      'catalogo-produtos',
      ['Nome', 'Categoria', 'Subcategoria', 'Grupo', 'Preço', 'Status', 'Origem'],
      linhasCatalogo.map((l) => [l.nome, l.categoria, l.subcategoria, l.grupo, l.preco, l.status, l.origem])
    )
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">Somente para admins</p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          Relatórios
        </h1>
      </header>

      <div className="mb-6 flex gap-1 border-b border-foam-200">
        <button
          onClick={() => setAba('atividade')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            aba === 'atividade' ? 'border-brass-500 text-hull-900' : 'border-transparent text-slate-400'
          }`}
        >
          Atividade por vendedor
        </button>
        <button
          onClick={() => setAba('catalogo')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            aba === 'catalogo' ? 'border-brass-500 text-hull-900' : 'border-transparent text-slate-400'
          }`}
        >
          Catálogo de produtos
        </button>
      </div>

      {aba === 'atividade' && (
        <div className="rounded-md border border-foam-200 bg-white p-5">
          <p className="mb-1 text-sm font-medium text-hull-900">Atividade por vendedor e período</p>
          <p className="mb-4 text-[11px] text-slate-400">
            "Em andamento" mostra o estado atual dos leads de cada vendedor. Os demais números
            (contatos, concluídas, perdidos, produtos) são contados dentro do período escolhido.
          </p>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-hull-900">De</span>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="input text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-hull-900">Até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="input text-sm"
              />
            </label>
            <button
              onClick={gerarRelatorioAtividade}
              disabled={gerandoAtividade}
              className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-50"
            >
              {gerandoAtividade ? 'Gerando…' : 'Gerar relatório'}
            </button>
            {linhasAtividade && (
              <button
                onClick={exportarAtividade}
                className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm text-hull-900 hover:border-wake-400"
              >
                <Download className="h-4 w-4" strokeWidth={1.75} />
                Exportar Excel
              </button>
            )}
          </div>

          {erroAtividade && (
            <div className="mb-4 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
              {erroAtividade}
            </div>
          )}

          {linhasAtividade && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-foam-200 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-3">Vendedor</th>
                    <th className="py-2 pr-3">Contatos</th>
                    <th className="py-2 pr-3">Em andamento</th>
                    <th className="py-2 pr-3">Concluídas</th>
                    <th className="py-2 pr-3">Perdidos</th>
                    <th className="py-2 pr-3">Produtos</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasAtividade.map((l) => (
                    <tr key={l.vendedor} className="border-b border-foam-200/60">
                      <td className="py-2 pr-3 text-hull-900">{l.vendedor}</td>
                      <td className="py-2 pr-3 font-mono">{l.contatos}</td>
                      <td className="py-2 pr-3 font-mono">{l.emAndamento}</td>
                      <td className="py-2 pr-3 font-mono">{l.concluidas}</td>
                      <td className="py-2 pr-3 font-mono">{l.perdidos}</td>
                      <td className="py-2 pr-3 font-mono" title={l.listaProdutos}>
                        {l.produtosTrabalhados}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {aba === 'catalogo' && (
        <div className="rounded-md border border-foam-200 bg-white p-5">
          <p className="mb-4 text-sm font-medium text-hull-900">Catálogo de produtos</p>

          {erroCatalogo && (
            <div className="mb-4 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
              {erroCatalogo}
            </div>
          )}

          {carregandoCatalogo ? (
            <p className="text-sm text-slate-400">Carregando…</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-hull-900">Status</span>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
                    className="input text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="disponivel">Disponível</option>
                    <option value="esgotado">Esgotado</option>
                    <option value="oculto">Oculto</option>
                  </select>
                </label>
                <button
                  onClick={exportarCatalogo}
                  className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm text-hull-900 hover:border-wake-400"
                >
                  <Download className="h-4 w-4" strokeWidth={1.75} />
                  Exportar Excel
                </button>
                <span className="ml-auto flex items-center gap-1.5 text-sm text-slate-500">
                  <FileSpreadsheet className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                  {linhasCatalogo.length} produto(s) — valor total {formatBRL(valorTotalCatalogo)}
                </span>
              </div>

              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-foam-200 text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-3">Nome</th>
                      <th className="py-2 pr-3">Categoria</th>
                      <th className="py-2 pr-3">Subcategoria</th>
                      <th className="py-2 pr-3">Grupo</th>
                      <th className="py-2 pr-3">Preço</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasCatalogo.map((l, i) => (
                      <tr key={i} className="border-b border-foam-200/60">
                        <td className="py-2 pr-3 text-hull-900">{l.nome}</td>
                        <td className="py-2 pr-3 text-slate-500">{l.categoria}</td>
                        <td className="py-2 pr-3 text-slate-500">{l.subcategoria}</td>
                        <td className="py-2 pr-3 text-slate-500">{l.grupo}</td>
                        <td className="py-2 pr-3 font-mono">{formatBRL(l.preco)}</td>
                        <td className="py-2 pr-3">{l.status}</td>
                        <td className="py-2 pr-3 text-slate-500">{l.origem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
