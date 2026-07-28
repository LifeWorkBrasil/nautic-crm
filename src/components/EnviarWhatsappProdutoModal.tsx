import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Link2, Check, Copy, FileDown } from 'lucide-react'
import Modal from '@/components/Modal'
import { CampoTexto } from '@/components/campos'
import FichaProdutoPdf from '@/components/FichaProdutoPdf'
import {
  listLeads,
  criarLinkPublicoProduto,
  createLead,
  adicionarHistorico,
  listFotosProduto,
  listItensInclusosProduto,
  listCamposPersonalizados,
  getSubcategoriaPublica,
} from '@/lib/api'
import { linkWhatsappComTexto } from '@/lib/whatsapp'
import { formatPreco } from '@/lib/format'
import type {
  ClienteLead,
  Produto,
  LinkPublicoProduto,
  SubcategoriaProduto,
  FotoProduto,
  ProdutoItemIncluso,
  CampoPersonalizado,
} from '@/types'

const DIAS_VALIDADE_PADRAO = 14

function normalizarTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '')
  return digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos
}

function montarMensagemPadrao(produto: Produto): string {
  const linhas = [
    `Olá! Segue mais informações sobre o *${produto.nome}*${produto.comprimento ? ` (${produto.comprimento}m)` : ''}:`,
    '',
    produto.descricao,
    '',
    `Valor: ${formatPreco(produto.preco_base)}`,
  ]
  return linhas.join('\n')
}

function formatarDataInput(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`
}

function montarUrlLink(link: LinkPublicoProduto): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}p/${link.id}`
}

export default function EnviarWhatsappProdutoModal({
  produto,
  onClose,
}: {
  produto: Produto
  onClose: () => void
}) {
  const [clientes, setClientes] = useState<ClienteLead[]>([])
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null)
  const [modoManual, setModoManual] = useState(false)
  const [telefoneManual, setTelefoneManual] = useState('')
  const [nomeManual, setNomeManual] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [statusCrm, setStatusCrm] = useState<'idle' | 'salvando' | 'salvo' | 'erro'>('idle')

  const [expiraEm, setExpiraEm] = useState(() =>
    formatarDataInput(new Date(Date.now() + DIAS_VALIDADE_PADRAO * 24 * 60 * 60 * 1000))
  )
  const [gerandoLink, setGerandoLink] = useState(false)
  const [linkGerado, setLinkGerado] = useState<LinkPublicoProduto | null>(null)
  const [copiado, setCopiado] = useState(false)

  const [gerandoFicha, setGerandoFicha] = useState(false)
  const [dadosFicha, setDadosFicha] = useState<{
    subcategoria: SubcategoriaProduto | undefined
    fotos: FotoProduto[]
    itensInclusos: ProdutoItemIncluso[]
    campos: CampoPersonalizado[]
  } | null>(null)
  const fichaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listLeads()
      .then((leads) => {
        setClientes(leads)
        setMensagem(montarMensagemPadrao(produto))
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar dados'))
      .finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto.id])

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter((c) => c.nome.toLowerCase().includes(termo))
  }, [clientes, buscaCliente])

  const clienteSelecionado = clientes.find((c) => c.id === clienteSelecionadoId) ?? null
  const telefone = modoManual ? telefoneManual : clienteSelecionado?.telefone ?? ''
  const podeEnviar = Boolean(telefone.trim() && mensagem.trim())

  async function gerarLink() {
    setGerandoLink(true)
    setErro(null)
    try {
      const link = await criarLinkPublicoProduto({
        produto_id: produto.id,
        expira_em: new Date(`${expiraEm}T23:59:59`).toISOString(),
        cliente_nome: clienteSelecionado?.nome ?? null,
      })
      setLinkGerado(link)
      const url = montarUrlLink(link)
      const dataFormatada = new Date(link.expira_em).toLocaleDateString('pt-BR')
      setMensagem((atual) =>
        `${atual.trimEnd()}\n\nVeja fotos e detalhes completos aqui:\n${url}\n(link válido até ${dataFormatada})`
      )
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar link')
    } finally {
      setGerandoLink(false)
    }
  }

  async function copiarLink() {
    if (!linkGerado) return
    await navigator.clipboard.writeText(montarUrlLink(linkGerado))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  async function gerarFichaPdf() {
    setGerandoFicha(true)
    setErro(null)
    try {
      const [fotos, subcategoria, todosCampos] = await Promise.all([
        listFotosProduto(produto.id),
        produto.subcategoria_id ? getSubcategoriaPublica(produto.subcategoria_id) : Promise.resolve(null),
        listCamposPersonalizados(),
      ])
      const itensInclusos = subcategoria?.vendido_como_esta
        ? await listItensInclusosProduto(produto.id)
        : []
      const campos = todosCampos.filter(
        (c) =>
          c.categoria_id === (subcategoria?.categoria_id ?? null) ||
          (produto.grupo_id && c.grupo_id === produto.grupo_id)
      )
      setDadosFicha({ subcategoria: subcategoria ?? undefined, fotos, itensInclusos, campos })

      // dá um tick pro React montar a ficha no DOM antes do html2canvas capturar
      await new Promise((resolve) => setTimeout(resolve, 50))
      if (!fichaRef.current) throw new Error('Erro ao preparar a ficha')

      const { default: html2pdf } = await import('html2pdf.js')
      const nomeArquivo = `ficha-${produto.nome
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
        })
        .from(fichaRef.current)
        .save()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar a ficha em PDF')
    } finally {
      setGerandoFicha(false)
    }
  }

  async function registrarEnvioNoCrm() {
    setStatusCrm('salvando')
    try {
      let cliente = clienteSelecionado

      if (!cliente && modoManual && telefoneManual.trim()) {
        const alvo = normalizarTelefone(telefoneManual)
        cliente = clientes.find((c) => c.telefone && normalizarTelefone(c.telefone) === alvo) ?? null

        if (!cliente) {
          cliente = await createLead({
            nome: nomeManual.trim() || `Contato ${telefoneManual.trim()}`,
            email: '',
            telefone: telefoneManual.trim(),
            status_crm: 'Lead',
            origem: 'Envio de produto por WhatsApp',
          })
          setClientes((prev) => [cliente!, ...prev])
        }
      }

      if (!cliente) {
        setStatusCrm('idle')
        return
      }

      const textoHistorico = linkGerado
        ? `Enviado catálogo por WhatsApp: ${produto.nome} — ${montarUrlLink(linkGerado)}`
        : `Enviado catálogo por WhatsApp: ${produto.nome}`
      await adicionarHistorico(cliente.id, textoHistorico)
      setStatusCrm('salvo')
    } catch {
      setStatusCrm('erro')
    }
  }

  return (
    <Modal title={`Enviar "${produto.nome}" por WhatsApp`} onClose={onClose} size="lg">
      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="space-y-4">
          {erro && (
            <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-3 py-2 text-xs text-signal-red">
              {erro}
            </div>
          )}

          <div className="flex gap-1 border-b border-foam-200">
            <button
              onClick={() => setModoManual(false)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                !modoManual ? 'border-brass-500 text-hull-900' : 'border-transparent text-slate-400'
              }`}
            >
              Cliente do CRM
            </button>
            <button
              onClick={() => setModoManual(true)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                modoManual ? 'border-brass-500 text-hull-900' : 'border-transparent text-slate-400'
              }`}
            >
              Digitar número
            </button>
          </div>

          {modoManual ? (
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto label="Número de WhatsApp" value={telefoneManual} onChange={setTelefoneManual} />
              <CampoTexto label="Nome do cliente" value={nomeManual} onChange={setNomeManual} />
            </div>
          ) : (
            <div className="space-y-2">
              <CampoTexto label="Buscar cliente" value={buscaCliente} onChange={setBuscaCliente} />
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-foam-200 p-2">
                {clientesFiltrados.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-slate-400">Nenhum cliente encontrado.</p>
                ) : (
                  clientesFiltrados.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setClienteSelecionadoId(c.id)}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                        clienteSelecionadoId === c.id
                          ? 'bg-brass-200/30 text-hull-900'
                          : 'text-hull-900 hover:bg-foam-100'
                      }`}
                    >
                      <span>{c.nome}</span>
                      <span className="text-xs text-slate-400">{c.telefone || 'sem telefone'}</span>
                    </button>
                  ))
                )}
              </div>
              {clienteSelecionado && !clienteSelecionado.telefone && (
                <p className="text-xs text-signal-red">
                  Este cliente não tem telefone cadastrado. Adicione um telefone no CRM ou use "Digitar número".
                </p>
              )}
            </div>
          )}

          <div className="rounded-md border border-foam-200 bg-foam-100 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-hull-900">
              <Link2 className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              Link de apresentação
            </p>
            <p className="mb-2 text-[11px] text-slate-400">
              Gera uma página com fotos, preço e detalhes do produto — mais profissional do que
              mandar tudo em texto solto. O link para de funcionar depois da data de validade.
            </p>
            {!linkGerado ? (
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-hull-900">Válido até</span>
                  <input
                    type="date"
                    value={expiraEm}
                    min={formatarDataInput(new Date())}
                    onChange={(e) => setExpiraEm(e.target.value)}
                    className="input text-sm"
                  />
                </label>
                <button
                  onClick={gerarLink}
                  disabled={gerandoLink || !expiraEm}
                  className="flex items-center gap-2 rounded-md bg-hull-900 px-3 py-2 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-50"
                >
                  <Link2 className="h-4 w-4" strokeWidth={1.75} />
                  {gerandoLink ? 'Gerando…' : 'Gerar link e adicionar à mensagem'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 rounded-md border border-foam-200 bg-white px-3 py-2">
                <span className="truncate text-sm text-hull-900">{montarUrlLink(linkGerado)}</span>
                <button
                  onClick={copiarLink}
                  className="flex shrink-0 items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                >
                  {copiado ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-md border border-foam-200 bg-foam-100 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-hull-900">
              <FileDown className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              Ficha em PDF
            </p>
            <p className="mb-2 text-[11px] text-slate-400">
              Baixa uma ficha de 1 página (fotos, descrição, detalhes) desse produto. O WhatsApp
              não deixa anexar arquivo por link — depois de baixar, anexe o PDF manualmente na
              conversa.
            </p>
            <button
              onClick={gerarFichaPdf}
              disabled={gerandoFicha}
              className="flex items-center gap-2 rounded-md border border-foam-200 bg-white px-3 py-2 text-sm text-hull-900 hover:border-wake-400 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" strokeWidth={1.75} />
              {gerandoFicha ? 'Gerando…' : 'Baixar ficha em PDF'}
            </button>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Mensagem</span>
            <textarea
              rows={10}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="input resize-none"
            />
          </label>

          <div className="flex items-center gap-3">
            <a
              href={podeEnviar ? linkWhatsappComTexto(telefone, mensagem) : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!podeEnviar}
              onClick={(e) => {
                if (!podeEnviar) {
                  e.preventDefault()
                  return
                }
                registrarEnvioNoCrm()
              }}
              className={`flex w-fit items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium ${
                podeEnviar
                  ? 'bg-signal-green text-foam-50 hover:opacity-90'
                  : 'cursor-not-allowed bg-foam-200 text-slate-400'
              }`}
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              Abrir WhatsApp
            </a>
            {statusCrm === 'salvando' && <span className="text-xs text-slate-400">Salvando no CRM…</span>}
            {statusCrm === 'salvo' && (
              <span className="flex items-center gap-1 text-xs text-signal-green">
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                Registrado no CRM
              </span>
            )}
            {statusCrm === 'erro' && (
              <span className="text-xs text-signal-red">Não deu pra registrar no CRM.</span>
            )}
          </div>
        </div>
      )}

      {dadosFicha && (
        <div className="fixed left-[-9999px] top-0" aria-hidden="true">
          <div ref={fichaRef} className="w-[210mm] bg-white">
            <FichaProdutoPdf
              produto={produto}
              subcategoria={dadosFicha.subcategoria}
              fotos={dadosFicha.fotos}
              itensInclusos={dadosFicha.itensInclusos}
              campos={dadosFicha.campos}
              incluirPreco
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
