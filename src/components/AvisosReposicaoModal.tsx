import { useEffect, useState } from 'react'
import { MessageCircle, Check } from 'lucide-react'
import Modal from '@/components/Modal'
import { listAvisosReposicao, marcarAvisoNotificado } from '@/lib/api'
import { linkWhatsappComTexto } from '@/lib/whatsapp'
import type { AvisoReposicao } from '@/types'
import { mensagemErro } from '@/lib/errors'

export default function AvisosReposicaoModal({
  produtoId,
  nomeProduto,
  onClose,
}: {
  produtoId: string
  nomeProduto: string
  onClose: () => void
}) {
  const [avisos, setAvisos] = useState<AvisoReposicao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      setAvisos(await listAvisosReposicao(produtoId))
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao carregar avisos'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoId])

  async function marcarNotificado(id: string) {
    try {
      await marcarAvisoNotificado(id)
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao marcar como notificado'))
    }
  }

  const pendentes = avisos.filter((a) => !a.notificado)
  const jaNotificados = avisos.filter((a) => a.notificado)

  return (
    <Modal title={`Avise-me — ${nomeProduto}`} onClose={onClose} size="md">
      <div className="space-y-4">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        {carregando ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : avisos.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhum cliente pediu para ser avisado da reposição deste produto ainda.
          </p>
        ) : (
          <>
            {pendentes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Aguardando aviso ({pendentes.length})
                </p>
                {pendentes.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-foam-200 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="text-hull-900">{a.nome}</p>
                      <p className="text-xs text-slate-400">{a.telefone}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={linkWhatsappComTexto(
                          a.telefone,
                          `Olá, ${a.nome}! O produto "${nomeProduto}" que você pediu para ser avisado já voltou ao estoque. 😊`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-signal-green hover:opacity-80"
                      >
                        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                        WhatsApp
                      </a>
                      <button
                        onClick={() => marcarNotificado(a.id)}
                        className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Marcar notificado
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {jaNotificados.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Já notificados ({jaNotificados.length})
                </p>
                {jaNotificados.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-foam-200 px-3 py-2 text-sm text-slate-400"
                  >
                    <span>{a.nome}</span>
                    <span className="text-xs">{a.telefone}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
