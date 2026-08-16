import { useEffect, useRef, useState } from 'react'
import { Clapperboard, Music, X, Instagram, RotateCcw, CalendarClock } from 'lucide-react'
import Modal from '@/components/Modal'
import { gerarVideoReels } from '@/lib/gerarReels'
import { uploadVideoReels, publicarReelsInstagram, agendarReels } from '@/lib/api'
import { usePermissoes } from '@/lib/PermissoesContext'
import type { EstiloTrilha } from '@/lib/gerarReels'
import { mensagemErro } from '@/lib/errors'

const OPCOES_TRILHA: { valor: EstiloTrilha; label: string }[] = [
  { valor: 'sem_musica', label: 'Sem música' },
  { valor: 'calma', label: 'Calma' },
  { valor: 'energica', label: 'Enérgica' },
  { valor: 'corporativa', label: 'Corporativa' },
]

const ANTECEDENCIA_MINIMA_MS = 5 * 60 * 1000

function formatarDatetimeLocal(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(
    data.getMinutes()
  )}`
}

export default function GerarReelsModal({
  postId,
  fotoUrls,
  legenda,
  onClose,
  onPublicado,
  onAgendado,
}: {
  postId: string
  fotoUrls: string[]
  legenda: string
  onClose: () => void
  onPublicado: (mediaId: string) => void
  onAgendado: (agendadoPara: string) => void
}) {
  const { perfil } = usePermissoes()
  const [trilha, setTrilha] = useState<EstiloTrilha>('calma')
  const [arquivoAudio, setArquivoAudio] = useState<File | null>(null)
  const inputAudioRef = useRef<HTMLInputElement>(null)
  const [etapa, setEtapa] = useState<
    'escolher' | 'gerando' | 'pre_visualizar' | 'enviando' | 'publicando' | 'programando'
  >('escolher')
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [mostrarAgendamento, setMostrarAgendamento] = useState(false)
  const [dataAgendamento, setDataAgendamento] = useState('')

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  async function gerar() {
    if (!perfil?.empresa_id) return
    setErro(null)
    try {
      setEtapa('gerando')
      const video = await gerarVideoReels(fotoUrls, trilha, setProgresso, arquivoAudio)
      setVideoBlob(video)
      setVideoUrl(URL.createObjectURL(video))
      setEtapa('pre_visualizar')
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao gerar o vídeo'))
      setEtapa('escolher')
    }
  }

  function gerarNovamente() {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoBlob(null)
    setVideoUrl(null)
    setErro(null)
    setEtapa('escolher')
  }

  async function publicar() {
    if (!perfil?.empresa_id || !videoBlob) return
    setErro(null)
    try {
      setEtapa('enviando')
      const videoUrlPublica = await uploadVideoReels(perfil.empresa_id, postId, videoBlob)

      setEtapa('publicando')
      const { media_id } = await publicarReelsInstagram(postId, videoUrlPublica)

      onPublicado(media_id)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao publicar o Reels'))
      setEtapa('pre_visualizar')
    }
  }

  async function confirmarAgendamento() {
    if (!perfil?.empresa_id || !videoBlob || !dataAgendamento) return
    const dataEscolhida = new Date(dataAgendamento)
    if (dataEscolhida.getTime() < Date.now() + ANTECEDENCIA_MINIMA_MS) {
      setErro('Escolha um horário com pelo menos 5 minutos de antecedência.')
      return
    }
    setErro(null)
    try {
      setEtapa('enviando')
      const videoUrlPublica = await uploadVideoReels(perfil.empresa_id, postId, videoBlob)

      setEtapa('programando')
      await agendarReels(postId, videoUrlPublica, dataEscolhida.toISOString())

      onAgendado(dataEscolhida.toISOString())
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao programar o Reels'))
      setEtapa('pre_visualizar')
    }
  }

  const emAndamento =
    etapa === 'gerando' || etapa === 'enviando' || etapa === 'publicando' || etapa === 'programando'

  return (
    <Modal title="Gerar Reels" onClose={onClose} size="md">
      <div className="space-y-4">
        {etapa === 'escolher' && (
          <p className="text-sm text-slate-500">
            Monta um vídeo curto (slideshow das {fotoUrls.length} fotos deste post) direto no seu
            navegador. Escolha uma trilha gerada aqui mesmo ou envie uma música do seu computador —
            depois de gerado, você confere o vídeo antes de publicar.
          </p>
        )}

        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        {etapa === 'escolher' && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Trilha de fundo
              </span>
              <select
                value={trilha}
                onChange={(e) => setTrilha(e.target.value as EstiloTrilha)}
                disabled={!!arquivoAudio}
                className="input disabled:opacity-50"
              >
                {OPCOES_TRILHA.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Ou música do computador
              </span>
              <input
                ref={inputAudioRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setArquivoAudio(e.target.files?.[0] ?? null)}
              />
              {arquivoAudio ? (
                <div className="flex items-center justify-between rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900">
                  <span className="flex items-center gap-2 truncate">
                    <Music className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                    <span className="truncate">{arquivoAudio.name}</span>
                  </span>
                  <button
                    onClick={() => {
                      setArquivoAudio(null)
                      if (inputAudioRef.current) inputAudioRef.current.value = ''
                    }}
                    className="shrink-0 text-slate-400 hover:text-signal-red"
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => inputAudioRef.current?.click()}
                  className="flex items-center gap-2 rounded-md border border-dashed border-foam-200 px-3 py-2 text-sm text-slate-500 hover:border-wake-400 hover:text-hull-900"
                >
                  <Music className="h-4 w-4" strokeWidth={1.75} />
                  Escolher arquivo de áudio…
                </button>
              )}
              {arquivoAudio && (
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Substitui a trilha gerada acima. Use só música que você tem direito de publicar.
                </p>
              )}
            </div>

            <button
              onClick={gerar}
              className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50"
            >
              <Clapperboard className="h-4 w-4" strokeWidth={1.75} />
              Gerar vídeo
            </button>
          </>
        )}

        {etapa === 'pre_visualizar' && videoUrl && (
          <>
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              className="mx-auto aspect-[9/16] w-full max-w-[240px] rounded-md bg-black"
            />
            <div>
              <p className="mb-1.5 text-xs font-medium text-hull-900">Legenda</p>
              <p className="whitespace-pre-wrap rounded-md border border-foam-200 bg-foam-100 p-3 text-sm text-hull-900">
                {legenda || '(sem legenda)'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={gerarNovamente}
                className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm font-medium text-hull-900 hover:border-wake-400"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
                Gerar novamente
              </button>
              <button
                onClick={() => setMostrarAgendamento((v) => !v)}
                className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm font-medium text-hull-900 hover:border-wake-400"
              >
                <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                Programar
              </button>
              <button
                onClick={publicar}
                className="flex items-center gap-2 rounded-md bg-brass-400 px-4 py-2 text-sm font-medium text-hull-900 hover:bg-brass-500"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.75} />
                Publicar no Instagram
              </button>
            </div>

            {mostrarAgendamento && (
              <div className="flex flex-wrap items-end gap-3 rounded-md border border-foam-200 bg-foam-100 p-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-hull-900">Publicar em</span>
                  <input
                    type="datetime-local"
                    value={dataAgendamento}
                    min={formatarDatetimeLocal(new Date(Date.now() + ANTECEDENCIA_MINIMA_MS))}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    className="input text-sm"
                  />
                </label>
                <button
                  onClick={confirmarAgendamento}
                  disabled={!dataAgendamento}
                  className="flex items-center gap-2 rounded-md bg-hull-900 px-3 py-2 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-50"
                >
                  <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                  Confirmar agendamento
                </button>
                <button
                  onClick={() => setMostrarAgendamento(false)}
                  className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                  Cancelar
                </button>
              </div>
            )}
          </>
        )}

        {emAndamento && (
          <div className="space-y-2">
            <p className="text-sm text-hull-900">
              {etapa === 'gerando' && `Gerando vídeo… ${Math.round(progresso * 100)}%`}
              {etapa === 'enviando' && 'Enviando vídeo…'}
              {etapa === 'publicando' && 'Publicando no Instagram… isso pode levar até um minuto.'}
              {etapa === 'programando' && 'Programando publicação…'}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foam-200">
              <div
                className="h-full bg-brass-400 transition-all"
                style={{ width: etapa === 'gerando' ? `${progresso * 100}%` : '100%' }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
