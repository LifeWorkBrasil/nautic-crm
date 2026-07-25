import { useEffect, useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import Modal from '@/components/Modal'
import { CampoTexto } from '@/components/campos'
import { listLeads, listFotosProduto, listVideosProduto } from '@/lib/api'
import { linkWhatsappComTexto } from '@/lib/whatsapp'
import { formatBRL } from '@/lib/format'
import type { ClienteLead, Produto, FotoProduto, VideoProduto } from '@/types'

const MAX_FOTOS_WHATSAPP = 6

function montarMensagemPadrao(produto: Produto, fotos: FotoProduto[], videos: VideoProduto[]): string {
  const linhas = [
    `Olá! Segue mais informações sobre o *${produto.nome}*${produto.comprimento ? ` (${produto.comprimento}m)` : ''}:`,
    '',
    produto.descricao,
    '',
    `Valor: ${formatBRL(produto.preco_base)}`,
  ]

  const fotosLimitadas = fotos.slice(0, MAX_FOTOS_WHATSAPP)
  if (fotosLimitadas.length > 0) {
    linhas.push('', 'Fotos:', ...fotosLimitadas.map((f) => f.url_imagem))
  }
  if (videos.length > 0) {
    linhas.push('', 'Vídeo:', ...videos.map((v) => v.url_youtube))
  }

  return linhas.join('\n')
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
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listLeads(), listFotosProduto(produto.id), listVideosProduto(produto.id)])
      .then(([leads, fotos, videos]) => {
        setClientes(leads)
        setMensagem(montarMensagemPadrao(produto, fotos, videos))
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
            <CampoTexto label="Número de WhatsApp" value={telefoneManual} onChange={setTelefoneManual} />
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

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Mensagem</span>
            <textarea
              rows={10}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="input resize-none"
            />
          </label>

          <a
            href={podeEnviar ? linkWhatsappComTexto(telefone, mensagem) : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!podeEnviar}
            onClick={(e) => {
              if (!podeEnviar) e.preventDefault()
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
        </div>
      )}
    </Modal>
  )
}
