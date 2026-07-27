import { useState } from 'react'
import { Clapperboard } from 'lucide-react'
import Modal from '@/components/Modal'
import { gerarVideoReels } from '@/lib/gerarReels'
import { uploadVideoReels, publicarReelsInstagram } from '@/lib/api'
import { usePermissoes } from '@/lib/PermissoesContext'
import type { EstiloTrilha } from '@/lib/gerarReels'

const OPCOES_TRILHA: { valor: EstiloTrilha; label: string }[] = [
  { valor: 'sem_musica', label: 'Sem música' },
  { valor: 'calma', label: 'Calma' },
  { valor: 'energica', label: 'Enérgica' },
  { valor: 'corporativa', label: 'Corporativa' },
]

export default function GerarReelsModal({
  postId,
  fotoUrls,
  onClose,
  onPublicado,
}: {
  postId: string
  fotoUrls: string[]
  onClose: () => void
  onPublicado: (mediaId: string) => void
}) {
  const { perfil } = usePermissoes()
  const [trilha, setTrilha] = useState<EstiloTrilha>('calma')
  const [etapa, setEtapa] = useState<'escolher' | 'gerando' | 'enviando' | 'publicando' | 'erro'>('escolher')
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)

  async function gerarEPublicar() {
    if (!perfil?.empresa_id) return
    setErro(null)
    try {
      setEtapa('gerando')
      const video = await gerarVideoReels(fotoUrls, trilha, setProgresso)

      setEtapa('enviando')
      const videoUrl = await uploadVideoReels(perfil.empresa_id, postId, video)

      setEtapa('publicando')
      const { media_id } = await publicarReelsInstagram(postId, videoUrl)

      onPublicado(media_id)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar/publicar o Reels')
      setEtapa('erro')
    }
  }

  const emAndamento = etapa === 'gerando' || etapa === 'enviando' || etapa === 'publicando'

  return (
    <Modal title="Gerar Reels" onClose={onClose} size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Monta um vídeo curto (slideshow das {fotoUrls.length} fotos deste post) direto no seu
          navegador e publica como Reels no Instagram. A trilha é gerada por aqui mesmo — sem
          usar músicas de terceiros.
        </p>

        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        {!emAndamento ? (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Trilha de fundo
              </span>
              <select
                value={trilha}
                onChange={(e) => setTrilha(e.target.value as EstiloTrilha)}
                className="input"
              >
                {OPCOES_TRILHA.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={gerarEPublicar}
              className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50"
            >
              <Clapperboard className="h-4 w-4" strokeWidth={1.75} />
              Gerar e publicar
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-hull-900">
              {etapa === 'gerando' && `Gerando vídeo… ${Math.round(progresso * 100)}%`}
              {etapa === 'enviando' && 'Enviando vídeo…'}
              {etapa === 'publicando' && 'Publicando no Instagram… isso pode levar até um minuto.'}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foam-200">
              <div
                className="h-full bg-brass-400 transition-all"
                style={{
                  width:
                    etapa === 'gerando'
                      ? `${progresso * 100}%`
                      : etapa === 'enviando'
                        ? '100%'
                        : '100%',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
