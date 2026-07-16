import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, FileDown, Link2, ChevronRight, Building2, FileText, Plus, Trash2 } from 'lucide-react'
import {
  listProdutos,
  listMotores,
  listAcessorios,
  listLeads,
  createLead,
  criarOrcamento,
  getEmpresaConfig,
  listManuaisProduto,
} from '@/lib/api'
import { formatBRL } from '@/lib/format'
import type { Produto, Motor, Acessorio, ClienteLead, EmpresaConfig, ManualProduto } from '@/types'

const PASSOS = ['Cliente & Barco', 'Motorização', 'Opcionais', 'Pagamento', 'Visualização & Envio']

export default function Orcamentos() {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [motores, setMotores] = useState<Motor[]>([])
  const [acessorios, setAcessorios] = useState<Acessorio[]>([])
  const [leads, setLeads] = useState<ClienteLead[]>([])
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null)

  const [passo, setPasso] = useState(0)
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [novoClienteNome, setNovoClienteNome] = useState('')
  const [produtoId, setProdutoId] = useState<string | null>(null)
  const [motorId, setMotorId] = useState<string | null>(null)
  const [acessoriosSelecionados, setAcessoriosSelecionados] = useState<Set<string>>(new Set())
  const [dataPrevistaEntrega, setDataPrevistaEntrega] = useState('')
  const [entradaPercentual, setEntradaPercentual] = useState(100)
  const [parcelas, setParcelas] = useState<{ percentual: number }[]>([])

  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [manuais, setManuais] = useState<ManualProduto[]>([])
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!produtoId) {
      setManuais([])
      return
    }
    listManuaisProduto(produtoId)
      .then(setManuais)
      .catch(() => setManuais([]))
  }, [produtoId])

  useEffect(() => {
    async function carregar() {
      try {
        const [md, mo, ac, ld, emp] = await Promise.all([
          listProdutos(),
          listMotores(),
          listAcessorios(),
          listLeads(),
          getEmpresaConfig(),
        ])
        setProdutos(md)
        setMotores(mo.filter((m) => m.ativo))
        setAcessorios(ac)
        setLeads(ld)
        setEmpresa(emp)
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao carregar dados')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const cliente = leads.find((l) => l.id === clienteId) ?? null
  const produto = produtos.find((p) => p.id === produtoId) ?? null
  const motor = motores.find((m) => m.id === motorId) ?? null

  const acessoriosDisponiveis = useMemo(
    () => acessorios.filter((a) => a.produto_id === null || a.produto_id === produtoId),
    [acessorios, produtoId]
  )

  const totalAcessorios = useMemo(
    () =>
      acessoriosDisponiveis
        .filter((a) => acessoriosSelecionados.has(a.id))
        .reduce((soma, a) => soma + a.preco, 0),
    [acessoriosDisponiveis, acessoriosSelecionados]
  )

  const total = (produto?.preco_base ?? 0) + (motor?.preco ?? 0) + totalAcessorios

  const somaParcelas = parcelas.reduce((soma, p) => soma + p.percentual, 0)
  const somaPagamento = entradaPercentual + somaParcelas
  const pagamentoValido = Math.abs(somaPagamento - 100) < 0.01

  function adicionarParcela() {
    setParcelas((prev) => [...prev, { percentual: 0 }])
  }

  function atualizarParcela(index: number, percentual: number) {
    setParcelas((prev) => prev.map((p, i) => (i === index ? { percentual } : p)))
  }

  function removerParcela(index: number) {
    setParcelas((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleAcessorio(id: string) {
    setAcessoriosSelecionados((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function usarNovoCliente() {
    if (!novoClienteNome.trim()) return
    try {
      const lead = await createLead({
        nome: novoClienteNome.trim(),
        email: '',
        telefone: '',
        status_crm: 'Lead',
        origem: 'Gerador de orçamentos',
        observacoes: '',
      })
      setLeads((prev) => [lead, ...prev])
      setClienteId(lead.id)
      setNovoClienteNome('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar cliente')
    }
  }

  async function gerarPdf() {
    if (!previewRef.current) return
    setGerandoPdf(true)
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      const nomeArquivo = `orcamento-${produto?.nome ?? 'proposta'}-${cliente?.nome ?? 'cliente'}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      await html2pdf()
        .set({
          margin: 10,
          filename: `${nomeArquivo}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(previewRef.current)
        .save()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar PDF')
    } finally {
      setGerandoPdf(false)
    }
  }

  async function salvarOrcamento() {
    if (!clienteId || !produtoId) return
    setSalvando(true)
    try {
      await criarOrcamento({
        cliente_id: clienteId,
        produto_id: produtoId,
        motor_id: motorId,
        acessorio_ids: Array.from(acessoriosSelecionados),
        valor_total: total,
        validade_dias: empresa?.validade_orcamento_dias ?? 15,
        data_prevista_entrega: dataPrevistaEntrega || null,
        entrada_percentual: entradaPercentual,
        parcelas,
      })
      setSalvo(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar orçamento')
    } finally {
      setSalvando(false)
    }
  }

  const podeAvancar =
    (passo === 0 && clienteId !== null && produtoId !== null) ||
    (passo === 1 && motorId !== null) ||
    passo === 2 ||
    (passo === 3 && pagamentoValido) ||
    passo === 4

  if (carregando) {
    return <div className="p-8 text-sm text-slate-400">Carregando dados…</div>
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">
          Proposta comercial
        </p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          Gerador de orçamentos
        </h1>
      </header>

      {erro && (
        <div className="mb-5 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      {produtos.length === 0 && (
        <div className="mb-5 rounded-md border border-brass-400/40 bg-brass-200/20 px-4 py-2.5 text-sm text-hull-900">
          Nenhum produto cadastrado ainda. Cadastre pelo menos um no Catálogo antes de gerar um
          orçamento.
        </div>
      )}

      <ol className="mb-8 flex items-center gap-2 text-sm">
        {PASSOS.map((p, i) => (
          <li key={p} className="flex items-center gap-2">
            <button
              onClick={() => i <= passo && setPasso(i)}
              className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs ${
                i === passo
                  ? 'bg-hull-900 text-foam-50'
                  : i < passo
                    ? 'bg-brass-400 text-hull-900'
                    : 'bg-foam-200 text-slate-400'
              }`}
            >
              {i < passo ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
            </button>
            <span className={i === passo ? 'text-hull-900' : 'text-slate-400'}>{p}</span>
            {i < PASSOS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-foam-200" />}
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-md border border-foam-200 bg-white p-6">
          {passo === 0 && (
            <div className="space-y-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-hull-900">Cliente</label>
                <select
                  value={clienteId ?? ''}
                  onChange={(e) => setClienteId(e.target.value || null)}
                  className="input"
                >
                  <option value="">Selecione um cliente…</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <input
                    value={novoClienteNome}
                    onChange={(e) => setNovoClienteNome(e.target.value)}
                    placeholder="Ou cadastre um cliente novo…"
                    className="input"
                  />
                  <button
                    onClick={usarNovoCliente}
                    disabled={!novoClienteNome.trim()}
                    className="shrink-0 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400 disabled:opacity-40"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-hull-900">Produto</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {produtos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProdutoId(p.id)}
                      className={`rounded-md border p-3 text-left transition-colors ${
                        produtoId === p.id
                          ? 'border-brass-500 bg-brass-200/20'
                          : 'border-foam-200 hover:border-wake-400'
                      }`}
                    >
                      <p className="font-display text-base text-hull-900">{p.nome}</p>
                      <p className="text-xs text-slate-500">{p.descricao}</p>
                      <p className="mt-1 font-mono text-xs text-slate-600">
                        {formatBRL(p.preco_base)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {passo === 1 && (
            <div>
              <p className="mb-2 text-sm font-medium text-hull-900">
                Motores compatíveis com {produto?.nome}
              </p>
              {motores.length === 0 && (
                <p className="text-sm text-slate-400">Nenhum motor ativo cadastrado.</p>
              )}
              <div className="space-y-2">
                {motores.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMotorId(m.id)}
                    className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
                      motorId === m.id
                        ? 'border-brass-500 bg-brass-200/20'
                        : 'border-foam-200 hover:border-wake-400'
                    }`}
                  >
                    <span>
                      <span className="font-medium text-hull-900">
                        {m.marca} {m.modelo}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {m.potencia} HP · {m.combustivel}
                      </span>
                    </span>
                    <span className="font-mono text-sm text-slate-600">{formatBRL(m.preco)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {passo === 2 && (
            <div>
              <p className="mb-2 text-sm font-medium text-hull-900">Opcionais disponíveis</p>
              {acessoriosDisponiveis.length === 0 && (
                <p className="text-sm text-slate-400">Nenhum acessório disponível para este produto.</p>
              )}
              <div className="space-y-2">
                {acessoriosDisponiveis.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-center justify-between rounded-md border border-foam-200 p-3 hover:border-wake-400"
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={acessoriosSelecionados.has(a.id)}
                        onChange={() => toggleAcessorio(a.id)}
                        className="h-4 w-4 accent-brass-500"
                      />
                      <span>
                        <span className="text-hull-900">{a.nome}</span>
                        <span className="ml-2 text-xs text-slate-400">{a.categoria}</span>
                      </span>
                    </span>
                    <span className="font-mono text-sm text-slate-600">{formatBRL(a.preco)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {passo === 3 && (
            <div className="space-y-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-hull-900">
                  Data prevista de entrega
                </label>
                <input
                  type="date"
                  value={dataPrevistaEntrega}
                  onChange={(e) => setDataPrevistaEntrega(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-hull-900">Entrada (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={entradaPercentual}
                    onChange={(e) => setEntradaPercentual(Number(e.target.value))}
                    className="input w-32"
                  />
                  <span className="font-mono text-sm text-slate-600">
                    {formatBRL(total * (entradaPercentual / 100))}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-hull-900">Parcelas</p>
                  <button
                    onClick={adicionarParcela}
                    className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    Adicionar parcela
                  </button>
                </div>
                {parcelas.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma parcela — pagamento só com entrada.</p>
                ) : (
                  <div className="space-y-2">
                    {parcelas.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-md border border-foam-200 p-3"
                      >
                        <span className="w-20 shrink-0 text-sm text-slate-500">Parcela {i + 1}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={p.percentual}
                          onChange={(e) => atualizarParcela(i, Number(e.target.value))}
                          className="input w-24"
                        />
                        <span className="text-xs text-slate-400">%</span>
                        <span className="ml-auto font-mono text-sm text-slate-600">
                          {formatBRL(total * (p.percentual / 100))}
                        </span>
                        <button
                          onClick={() => removerParcela(i)}
                          className="text-signal-red/80 hover:text-signal-red"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className={`rounded-md border px-4 py-2.5 text-sm ${
                  pagamentoValido
                    ? 'border-signal-green/30 bg-signal-green/5 text-signal-green'
                    : 'border-signal-red/30 bg-signal-red/5 text-signal-red'
                }`}
              >
                Soma: {somaPagamento.toFixed(2)}%{' '}
                {pagamentoValido ? '— confere com o total' : '— precisa totalizar 100%'}
              </div>
            </div>
          )}

          {passo === 4 && (
            <div className="space-y-5">
              <div ref={previewRef} className="space-y-5 bg-white p-1">
                <div className="flex items-center gap-3 border-b border-foam-200 pb-4">
                  {empresa?.logo_url ? (
                    <img src={empresa.logo_url} alt={empresa.nome_empresa} className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-hull-900/[0.06] text-slate-400">
                      <Building2 className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-hull-900">
                      {empresa?.nome_empresa ?? 'Sua empresa'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Válido por {empresa?.validade_orcamento_dias ?? 15} dias
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">Proposta</p>
                  <h2 className="font-display text-2xl text-hull-900">{produto?.nome}</h2>
                  <p className="text-sm text-slate-500">Preparado para {cliente?.nome ?? 'cliente'}</p>
                  {dataPrevistaEntrega && (
                    <p className="text-xs text-slate-400">
                      Entrega prevista:{' '}
                      {new Date(`${dataPrevistaEntrega}T00:00:00`).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="aspect-video overflow-hidden rounded-md bg-hull-900/[0.04]">
                  {produto?.foto_principal_url && (
                    <img
                      src={produto.foto_principal_url}
                      alt={produto.nome}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>

                <dl className="divide-y divide-foam-200 rounded-md border border-foam-200">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <dt className="text-slate-500">Casco {produto?.nome}</dt>
                    <dd className="font-mono text-hull-900">{formatBRL(produto?.preco_base ?? 0)}</dd>
                  </div>
                  {motor && (
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <dt className="text-slate-500">
                        Motor {motor.marca} {motor.modelo}
                      </dt>
                      <dd className="font-mono text-hull-900">{formatBRL(motor.preco)}</dd>
                    </div>
                  )}
                  {acessoriosDisponiveis
                    .filter((a) => acessoriosSelecionados.has(a.id))
                    .map((a) => (
                      <div key={a.id} className="flex justify-between px-4 py-2.5 text-sm">
                        <dt className="text-slate-500">{a.nome}</dt>
                        <dd className="font-mono text-hull-900">{formatBRL(a.preco)}</dd>
                      </div>
                    ))}
                  <div className="flex justify-between px-4 py-3 text-sm font-medium">
                    <dt className="text-hull-900">Total</dt>
                    <dd className="font-mono text-hull-900">{formatBRL(total)}</dd>
                  </div>
                  {entradaPercentual > 0 && (
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <dt className="text-slate-500">Entrada ({entradaPercentual}%)</dt>
                      <dd className="font-mono text-hull-900">
                        {formatBRL(total * (entradaPercentual / 100))}
                      </dd>
                    </div>
                  )}
                  {parcelas.map((p, i) => (
                    <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                      <dt className="text-slate-500">
                        Parcela {i + 1} ({p.percentual}%)
                      </dt>
                      <dd className="font-mono text-hull-900">{formatBRL(total * (p.percentual / 100))}</dd>
                    </div>
                  ))}
                </dl>

                {empresa?.termos_condicoes && (
                  <p className="text-xs leading-relaxed text-slate-400">{empresa.termos_condicoes}</p>
                )}
              </div>

              {manuais.length > 0 && (
                <div className="rounded-md border border-foam-200 bg-white p-4">
                  <p className="mb-2 text-sm font-medium text-hull-900">Manuais inclusos</p>
                  <ul className="space-y-1.5">
                    {manuais.map((m) => (
                      <li key={m.id}>
                        <a
                          href={m.url_arquivo}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm text-wake-500 hover:text-wake-600"
                        >
                          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {m.nome_arquivo}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={gerarPdf}
                  disabled={gerandoPdf || !produto}
                  className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-60"
                >
                  <FileDown className="h-4 w-4" strokeWidth={1.75} />
                  {gerandoPdf ? 'Gerando PDF…' : 'Gerar PDF'}
                </button>
                <button
                  onClick={salvarOrcamento}
                  disabled={salvando || salvo}
                  className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2.5 text-sm font-medium text-hull-900 hover:border-wake-400 disabled:opacity-60"
                >
                  {salvo ? <Check className="h-4 w-4" strokeWidth={2} /> : null}
                  {salvo ? 'Orçamento salvo' : salvando ? 'Salvando…' : 'Salvar no CRM'}
                </button>
                <button
                  disabled
                  title="Disponível em breve — link público de cotação ainda não implementado"
                  className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2.5 text-sm font-medium text-slate-400"
                >
                  <Link2 className="h-4 w-4" strokeWidth={1.75} />
                  Copiar link da cotação
                </button>
              </div>
              {salvo && (
                <p className="text-xs text-signal-green">
                  Orçamento gravado em "Rascunho" — o PDF ainda não está implementado nesta versão.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-between border-t border-foam-200 pt-5">
            <button
              onClick={() => setPasso((p) => Math.max(0, p - 1))}
              disabled={passo === 0}
              className="text-sm text-slate-400 disabled:opacity-0 hover:text-hull-900"
            >
              Voltar
            </button>
            {passo < PASSOS.length - 1 && (
              <button
                onClick={() => setPasso((p) => Math.min(PASSOS.length - 1, p + 1))}
                disabled={!podeAvancar}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-md border border-foam-200 bg-hull-900 p-5 text-foam-100">
          <p className="text-[11px] uppercase tracking-[0.18em] text-brass-400/90">Total</p>
          <p className="mt-1 font-display text-3xl text-foam-50">{formatBRL(total)}</p>
          <dl className="mt-4 space-y-1.5 border-t border-hull-800 pt-4 text-xs">
            <div className="flex justify-between">
              <dt className="text-slate-400">Casco</dt>
              <dd className="font-mono">{formatBRL(produto?.preco_base ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Motor</dt>
              <dd className="font-mono">{formatBRL(motor?.preco ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Opcionais ({acessoriosSelecionados.size})</dt>
              <dd className="font-mono">{formatBRL(totalAcessorios)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
