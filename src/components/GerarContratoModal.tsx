import { useEffect, useRef, useState } from 'react'
import { Building2, FileDown } from 'lucide-react'
import Modal from '@/components/Modal'
import { formatBRL } from '@/lib/format'
import { preencherMinuta } from '@/lib/contratos'
import {
  listLeads,
  listOrcamentosCliente,
  listMinutas,
  listContrapropostasCliente,
  criarContraproposta,
  getEmpresaConfig,
} from '@/lib/api'
import type {
  ClienteLead,
  OrcamentoDetalhado,
  MinutaContrato,
  EmpresaConfig,
  Contraproposta,
  ContrapropostaVeiculo,
  ContrapropostaImovel,
} from '@/types'

type ContrapropostaComItens = Contraproposta & {
  veiculo: ContrapropostaVeiculo | null
  imovel: ContrapropostaImovel | null
}

export default function GerarContratoModal({
  minutaInicial,
  clienteIdInicial,
  onClose,
}: {
  minutaInicial?: MinutaContrato
  clienteIdInicial?: string
  onClose: () => void
}) {
  const [minutas, setMinutas] = useState<MinutaContrato[]>([])
  const [minutaId, setMinutaId] = useState(minutaInicial?.id ?? '')
  const [leads, setLeads] = useState<ClienteLead[]>([])
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null)

  const [clienteId, setClienteId] = useState<string | null>(clienteIdInicial ?? null)
  const [orcamentos, setOrcamentos] = useState<OrcamentoDetalhado[]>([])
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null)

  const [temTrading, setTemTrading] = useState(false)
  const [contrapropostas, setContrapropostas] = useState<ContrapropostaComItens[]>([])
  const [contrapropostaId, setContrapropostaId] = useState<string | 'nova' | ''>('')
  const [tipoTradingNovo, setTipoTradingNovo] = useState<'veiculo' | 'imovel'>('veiculo')
  const [tradingVeiculo, setTradingVeiculo] = useState({
    tipo_veiculo: '',
    marca_modelo: '',
    ano: '',
    valor_estimado: '',
  })
  const [tradingImovel, setTradingImovel] = useState({ descricao: '', valor_estimado: '' })
  const [tradingCriado, setTradingCriado] = useState<ContrapropostaComItens | null>(null)

  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([listMinutas(), listLeads(), getEmpresaConfig()]).then(([m, l, e]) => {
      const ativas = m.filter((x) => x.ativo)
      setMinutas(ativas)
      setLeads(l)
      setEmpresa(e)
      setMinutaId((atual) => atual || ativas[0]?.id || '')
    })
  }, [])

  useEffect(() => {
    if (!clienteId) {
      setOrcamentos([])
      setOrcamentoId(null)
      setContrapropostas([])
      setContrapropostaId('')
      setTradingCriado(null)
      return
    }
    listOrcamentosCliente(clienteId).then((o) => {
      setOrcamentos(o)
      setOrcamentoId(o[0]?.id ?? null)
    })
    listContrapropostasCliente(clienteId).then(setContrapropostas)
  }, [clienteId])

  const cliente = leads.find((l) => l.id === clienteId) ?? null
  const orcamento = orcamentos.find((o) => o.id === orcamentoId) ?? null
  const minuta = minutas.find((m) => m.id === minutaId) ?? minutaInicial ?? null
  const contrapropostaExistente = contrapropostas.find((c) => c.id === contrapropostaId) ?? null

  const trading = !temTrading
    ? null
    : tradingCriado
      ? { contraproposta: tradingCriado, veiculo: tradingCriado.veiculo, imovel: tradingCriado.imovel }
      : contrapropostaExistente
        ? {
            contraproposta: contrapropostaExistente,
            veiculo: contrapropostaExistente.veiculo,
            imovel: contrapropostaExistente.imovel,
          }
        : null

  const textoContrato = !minuta
    ? ''
    : cliente
      ? preencherMinuta(minuta.corpo, { cliente, orcamento, empresa, trading })
      : minuta.corpo

  async function handleRegistrarTradingNovo() {
    if (!clienteId) return
    setErro(null)
    try {
      const veiculo =
        tipoTradingNovo === 'veiculo' && tradingVeiculo.tipo_veiculo.trim()
          ? {
              tipo_veiculo: tradingVeiculo.tipo_veiculo,
              marca_modelo: tradingVeiculo.marca_modelo || null,
              ano: tradingVeiculo.ano ? Number(tradingVeiculo.ano) : null,
              valor_estimado: tradingVeiculo.valor_estimado ? Number(tradingVeiculo.valor_estimado) : null,
            }
          : null
      const imovel =
        tipoTradingNovo === 'imovel' && tradingImovel.descricao.trim()
          ? {
              descricao: tradingImovel.descricao || null,
              valor_estimado: tradingImovel.valor_estimado ? Number(tradingImovel.valor_estimado) : null,
            }
          : null

      const contraproposta = await criarContraproposta({
        cliente_id: clienteId,
        orcamento_id: orcamentoId,
        veiculo,
        imovel,
      })

      setTradingCriado({
        ...contraproposta,
        veiculo: veiculo
          ? { id: '', contraproposta_id: contraproposta.id, ...veiculo }
          : null,
        imovel: imovel ? { id: '', contraproposta_id: contraproposta.id, ...imovel } : null,
      })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao registrar trading')
    }
  }

  async function gerarPdf() {
    if (!previewRef.current || !minuta) return
    setGerandoPdf(true)
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      const nomeArquivo = `contrato-${minuta.nome}-${cliente?.nome ?? 'cliente'}`
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

  return (
    <Modal
      title="Gerar contrato"
      onClose={onClose}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
            Fechar
          </button>
          <button
            onClick={gerarPdf}
            disabled={gerandoPdf || !cliente}
            className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" strokeWidth={1.75} />
            {gerandoPdf ? 'Gerando PDF…' : 'Gerar PDF'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Minuta</span>
            <select value={minutaId} onChange={(e) => setMinutaId(e.target.value)} className="input">
              {minutas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Cliente</span>
            <select
              value={clienteId ?? ''}
              onChange={(e) => setClienteId(e.target.value || null)}
              className="input"
            >
              <option value="">Selecione…</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {clienteId && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Orçamento do cliente</span>
            {orcamentos.length === 0 ? (
              <p className="text-sm text-slate-400">Este cliente ainda não tem orçamento salvo.</p>
            ) : (
              <select
                value={orcamentoId ?? ''}
                onChange={(e) => setOrcamentoId(e.target.value || null)}
                className="input"
              >
                {orcamentos.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.produto?.nome ?? 'Produto'} — {formatBRL(o.valor_total)} ({o.status})
                  </option>
                ))}
              </select>
            )}
          </label>
        )}

        {clienteId && (
          <div className="rounded-md border border-foam-200 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-hull-900">
              <input
                type="checkbox"
                checked={temTrading}
                onChange={(e) => {
                  setTemTrading(e.target.checked)
                  setContrapropostaId('')
                  setTradingCriado(null)
                }}
                className="h-4 w-4 accent-brass-500"
              />
              Tem bem de troca (trading)?
            </label>

            {temTrading && (
              <div className="mt-4 space-y-4">
                {contrapropostas.length > 0 && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm text-hull-900">Usar trading já registrado</span>
                    <select
                      value={contrapropostaId}
                      onChange={(e) => {
                        setContrapropostaId(e.target.value as string)
                        setTradingCriado(null)
                      }}
                      className="input"
                    >
                      <option value="">— Cadastrar um novo abaixo —</option>
                      {contrapropostas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.veiculo
                            ? `${c.veiculo.tipo_veiculo} ${c.veiculo.marca_modelo ?? ''}`
                            : c.imovel?.descricao ?? 'Bem de troca'}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {!contrapropostaId && !tradingCriado && (
                  <div className="space-y-3 border-t border-foam-200 pt-4">
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          checked={tipoTradingNovo === 'veiculo'}
                          onChange={() => setTipoTradingNovo('veiculo')}
                          className="accent-brass-500"
                        />
                        Veículo
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          checked={tipoTradingNovo === 'imovel'}
                          onChange={() => setTipoTradingNovo('imovel')}
                          className="accent-brass-500"
                        />
                        Imóvel
                      </label>
                    </div>

                    {tipoTradingNovo === 'veiculo' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={tradingVeiculo.tipo_veiculo}
                          onChange={(e) => setTradingVeiculo({ ...tradingVeiculo, tipo_veiculo: e.target.value })}
                          placeholder="Tipo (carro, moto…)"
                          className="input text-sm"
                        />
                        <input
                          value={tradingVeiculo.marca_modelo}
                          onChange={(e) => setTradingVeiculo({ ...tradingVeiculo, marca_modelo: e.target.value })}
                          placeholder="Marca/modelo"
                          className="input text-sm"
                        />
                        <input
                          value={tradingVeiculo.ano}
                          onChange={(e) => setTradingVeiculo({ ...tradingVeiculo, ano: e.target.value })}
                          placeholder="Ano"
                          className="input text-sm"
                        />
                        <input
                          value={tradingVeiculo.valor_estimado}
                          onChange={(e) =>
                            setTradingVeiculo({ ...tradingVeiculo, valor_estimado: e.target.value })
                          }
                          placeholder="Valor estimado (R$)"
                          className="input text-sm"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={tradingImovel.descricao}
                          onChange={(e) => setTradingImovel({ ...tradingImovel, descricao: e.target.value })}
                          placeholder="Descrição do imóvel"
                          className="input text-sm"
                        />
                        <input
                          value={tradingImovel.valor_estimado}
                          onChange={(e) => setTradingImovel({ ...tradingImovel, valor_estimado: e.target.value })}
                          placeholder="Valor estimado (R$)"
                          className="input text-sm"
                        />
                      </div>
                    )}
                    <button
                      onClick={handleRegistrarTradingNovo}
                      className="rounded-md border border-foam-200 px-3 py-1.5 text-xs text-hull-900 hover:border-wake-400"
                    >
                      Registrar trading
                    </button>
                  </div>
                )}
                {tradingCriado && (
                  <p className="text-xs text-signal-green">Trading registrado e vinculado a este contrato.</p>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-hull-900">Preview</p>
          {!minuta ? (
            <p className="text-sm text-slate-400">
              Nenhuma minuta de contrato ativa cadastrada. Crie uma em Parametrização › Minutas de
              Contrato.
            </p>
          ) : (
            <div
              ref={previewRef}
              className="space-y-4 rounded-md border border-foam-200 bg-white p-6 font-serif text-sm leading-relaxed text-hull-900"
            >
              <div className="flex items-center gap-3 border-b border-foam-200 pb-4">
                {empresa?.logo_url ? (
                  <img src={empresa.logo_url} alt={empresa.nome_empresa} className="h-10 w-10 object-contain" crossOrigin="anonymous" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-hull-900/[0.06] text-slate-400">
                    <Building2 className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-hull-900">{empresa?.nome_empresa ?? 'Sua empresa'}</p>
                  <p className="text-xs text-slate-400">{minuta.nome}</p>
                </div>
              </div>
              <div className="whitespace-pre-wrap">{textoContrato}</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
