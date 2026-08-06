import { useEffect, useState } from 'react'
import { Send, ExternalLink, SkipForward, Square, Check, X as XIcon, Clock, Download } from 'lucide-react'
import Modal from '@/components/Modal'
import { linkWhatsappComTexto } from '@/lib/whatsapp'
import { adicionarHistorico, listMensagensModelo } from '@/lib/api'
import { PROVEDORES_ENVIO, montarMensagemPersonalizada } from '@/lib/envioMassa'
import type { ClienteLead, MensagemModelo } from '@/types'

type Etapa = 'mensagem' | 'fila'
type StatusEnvio = 'pendente' | 'aberto' | 'pulado'

const INTERVALO_PADRAO_SEGUNDOS = 10

export default function EnvioMassaModal({
  contatos,
  onClose,
  onConcluido,
}: {
  contatos: ClienteLead[]
  onClose: () => void
  onConcluido?: () => void
}) {
  const [etapa, setEtapa] = useState<Etapa>('mensagem')
  const [mensagem, setMensagem] = useState('')
  const [intervaloSegundos, setIntervaloSegundos] = useState(INTERVALO_PADRAO_SEGUNDOS)
  const [provedor, setProvedor] = useState<'assistido' | 'api_oficial'>('assistido')
  const [modelos, setModelos] = useState<MensagemModelo[]>([])
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState('')

  useEffect(() => {
    listMensagensModelo().then(setModelos).catch(() => {})
  }, [])

  const modeloSelecionado = modelos.find((m) => m.id === modeloSelecionadoId) ?? null

  function aplicarModelo(id: string) {
    setModeloSelecionadoId(id)
    const modelo = modelos.find((m) => m.id === id)
    if (modelo) setMensagem(modelo.texto)
  }

  const [indiceAtual, setIndiceAtual] = useState(0)
  const [statusPorIndice, setStatusPorIndice] = useState<StatusEnvio[]>(() =>
    contatos.map(() => 'pendente')
  )
  const [cooldownRestante, setCooldownRestante] = useState(0)

  // O intervalo é aplicado como um tempo mínimo de espera antes do botão liberar o próximo
  // envio — quem clica é sempre uma pessoa. Não dá pra abrir o WhatsApp sozinho num temporizador:
  // o navegador bloqueia window.open() quando ele não vem de um clique direto (testado).
  useEffect(() => {
    if (cooldownRestante <= 0) return
    const id = window.setInterval(() => {
      setCooldownRestante((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [cooldownRestante > 0])

  const contatoAtual = indiceAtual < contatos.length ? contatos[indiceAtual] : null
  const concluido = indiceAtual >= contatos.length
  const totalAbertos = statusPorIndice.filter((s) => s === 'aberto').length
  const totalPulados = statusPorIndice.filter((s) => s === 'pulado').length

  function abrirEContinuar() {
    if (!contatoAtual || cooldownRestante > 0) return
    const texto = montarMensagemPersonalizada(mensagem, contatoAtual)
    window.open(linkWhatsappComTexto(contatoAtual.telefone, texto), '_blank')
    setStatusPorIndice((prev) => prev.map((s, i) => (i === indiceAtual ? 'aberto' : s)))
    adicionarHistorico(contatoAtual.id, `Mensagem em massa aberta no WhatsApp: "${texto}"`).catch(() => {})
    setIndiceAtual((i) => i + 1)
    setCooldownRestante(intervaloSegundos)
  }

  function pular() {
    if (!contatoAtual) return
    setStatusPorIndice((prev) => prev.map((s, i) => (i === indiceAtual ? 'pulado' : s)))
    setIndiceAtual((i) => i + 1)
    setCooldownRestante(0)
  }

  function iniciar() {
    setEtapa('fila')
  }

  function parar() {
    onConcluido?.()
    onClose()
  }

  const primeiroContato = contatos[0]
  const preview = primeiroContato ? montarMensagemPersonalizada(mensagem, primeiroContato) : ''

  return (
    <Modal title="Enviar mensagem em massa" onClose={onClose} size="lg">
      <div className="space-y-4">
        {etapa === 'mensagem' && (
          <>
            <p className="text-sm text-slate-500">
              <strong className="text-hull-900">{contatos.length}</strong> contatos selecionados.
              Escreva a mensagem — use <code className="rounded bg-foam-100 px-1">{'{{nome}}'}</code>{' '}
              ou <code className="rounded bg-foam-100 px-1">{'{{primeiro_nome}}'}</code> pra
              personalizar.
            </p>

            {modelos.length > 0 && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">
                  Usar um modelo salvo (opcional)
                </span>
                <select
                  value={modeloSelecionadoId}
                  onChange={(e) => aplicarModelo(e.target.value)}
                  className="input"
                >
                  <option value="">Escrever mensagem do zero</option>
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} (/{m.atalho})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Mensagem</span>
              <textarea
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Oi {{primeiro_nome}}, aqui é o pessoal da..."
                className="input resize-none"
              />
            </label>

            {modeloSelecionado?.imagem_url && (
              <div className="flex items-center gap-3 rounded-md border border-brass-400/40 bg-brass-200/10 p-3 text-sm">
                <img
                  src={modeloSelecionado.imagem_url}
                  alt=""
                  className="h-14 w-14 rounded-md object-cover"
                />
                <div>
                  <p className="text-hull-900">
                    Esse modelo tem uma imagem — o WhatsApp não deixa anexar ela automaticamente
                    junto com o link, então baixe e anexe na conversa manualmente.
                  </p>
                  <a
                    href={modeloSelecionado.imagem_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                  >
                    <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Baixar imagem
                  </a>
                </div>
              </div>
            )}

            {mensagem.trim() && primeiroContato && (
              <div className="rounded-md border border-foam-200 bg-foam-100 p-3 text-sm">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                  Pré-visualização (para {primeiroContato.nome})
                </p>
                <p className="whitespace-pre-wrap text-hull-900">{preview}</p>
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Intervalo mínimo entre envios (segundos)
              </span>
              <input
                type="number"
                min={3}
                value={intervaloSegundos}
                onChange={(e) => setIntervaloSegundos(Math.max(3, Number(e.target.value) || 3))}
                className="input w-32"
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                O botão de abrir o próximo contato só libera depois desse tempo — você que clica em
                cada um, o navegador não deixa abrir o WhatsApp sozinho.
              </span>
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Como enviar</span>
              <div className="space-y-2">
                {PROVEDORES_ENVIO.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-start gap-2.5 rounded-md border p-3 text-sm ${
                      p.disponivel ? 'cursor-pointer border-foam-200' : 'cursor-not-allowed border-foam-200 opacity-50'
                    } ${provedor === p.id ? 'border-brass-500 bg-brass-200/20' : ''}`}
                  >
                    <input
                      type="radio"
                      checked={provedor === p.id}
                      disabled={!p.disponivel}
                      onChange={() => setProvedor(p.id)}
                      className="mt-0.5 h-4 w-4 accent-brass-500"
                    />
                    <span>
                      <span className="block font-medium text-hull-900">{p.nome}</span>
                      <span className="block text-xs text-slate-500">{p.descricao}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-foam-200 pt-4">
              <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
                Cancelar
              </button>
              <button
                onClick={iniciar}
                disabled={!mensagem.trim() || contatos.length === 0}
                className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                <Send className="h-4 w-4" strokeWidth={1.75} />
                Iniciar fila
              </button>
            </div>
          </>
        )}

        {etapa === 'fila' && (
          <>
            {!concluido ? (
              <div className="rounded-md border border-foam-200 bg-foam-100 p-3 text-sm">
                <p className="text-hull-900">
                  Contato <strong>{indiceAtual + 1}</strong> de <strong>{contatos.length}</strong>
                  {contatoAtual && <> — {contatoAtual.nome}</>}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Clique em "Abrir WhatsApp" pra enviar a esse contato e liberar o próximo.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-signal-green/30 bg-signal-green/5 p-3 text-sm text-hull-900">
                Fila concluída: <strong>{totalAbertos}</strong> abertos, <strong>{totalPulados}</strong>{' '}
                pulados.
              </div>
            )}

            <ul className="max-h-[40vh] space-y-1.5 overflow-y-auto">
              {contatos.map((contato, i) => (
                <li
                  key={contato.id}
                  className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                    i === indiceAtual && !concluido ? 'border-wake-400 bg-wake-500/5' : 'border-foam-200'
                  }`}
                >
                  <span className="truncate text-hull-900">{contato.nome}</span>
                  {statusPorIndice[i] === 'aberto' && (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-signal-green">
                      <Check className="h-3 w-3" strokeWidth={2} />
                      Aberto
                    </span>
                  )}
                  {statusPorIndice[i] === 'pulado' && (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-400">
                      <XIcon className="h-3 w-3" strokeWidth={2} />
                      Pulado
                    </span>
                  )}
                  {statusPorIndice[i] === 'pendente' && i !== indiceAtual && (
                    <span className="shrink-0 text-[11px] text-slate-400">Aguardando</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex justify-end gap-2 border-t border-foam-200 pt-4">
              {!concluido && (
                <>
                  <button
                    onClick={pular}
                    className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400"
                  >
                    <SkipForward className="h-4 w-4" strokeWidth={1.75} />
                    Pular
                  </button>
                  <button
                    onClick={abrirEContinuar}
                    disabled={cooldownRestante > 0}
                    className="flex items-center gap-2 rounded-md bg-brass-400 px-4 py-2 text-sm font-medium text-hull-900 hover:bg-brass-500 disabled:opacity-50"
                  >
                    {cooldownRestante > 0 ? (
                      <>
                        <Clock className="h-4 w-4" strokeWidth={1.75} />
                        Aguarde {cooldownRestante}s
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                        Abrir WhatsApp
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={parar}
                className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50"
              >
                <Square className="h-4 w-4" strokeWidth={1.75} />
                {concluido ? 'Fechar' : 'Parar e fechar'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
