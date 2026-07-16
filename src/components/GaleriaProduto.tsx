import { useEffect, useState } from 'react'
import { Star, Trash2, Plus } from 'lucide-react'
import Modal from '@/components/Modal'
import {
  listFotosProduto,
  uploadFotoProduto,
  setFotoPrincipal,
  deleteFoto,
  listVideosProduto,
  createVideoProduto,
  deleteVideoProduto,
} from '@/lib/api'
import type { FotoProduto, VideoProduto } from '@/types'

function extrairYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export default function GaleriaProduto({
  produtoId,
  nomeProduto,
  onClose,
  onAlterar,
}: {
  produtoId: string
  nomeProduto: string
  onClose: () => void
  onAlterar: () => void
}) {
  const [fotos, setFotos] = useState<FotoProduto[]>([])
  const [videos, setVideos] = useState<VideoProduto[]>([])
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [urlVideo, setUrlVideo] = useState('')
  const [tituloVideo, setTituloVideo] = useState('')

  async function carregar() {
    try {
      const [f, v] = await Promise.all([listFotosProduto(produtoId), listVideosProduto(produtoId)])
      setFotos(f)
      setVideos(v)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar mídia')
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoId])

  async function handleUpload(file: File) {
    setEnviandoFoto(true)
    try {
      await uploadFotoProduto(produtoId, file)
      await carregar()
      onAlterar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar foto')
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function handlePrincipal(fotoId: string) {
    try {
      await setFotoPrincipal(produtoId, fotoId)
      await carregar()
      onAlterar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao definir foto principal')
    }
  }

  async function handleExcluirFoto(foto: FotoProduto) {
    if (!confirm('Excluir esta foto?')) return
    try {
      await deleteFoto(foto)
      await carregar()
      onAlterar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir foto')
    }
  }

  async function handleAdicionarVideo() {
    if (!urlVideo.trim()) return
    try {
      await createVideoProduto({
        produto_id: produtoId,
        url_youtube: urlVideo.trim(),
        titulo: tituloVideo.trim(),
      })
      setUrlVideo('')
      setTituloVideo('')
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar vídeo')
    }
  }

  async function handleExcluirVideo(id: string) {
    if (!confirm('Excluir este vídeo?')) return
    try {
      await deleteVideoProduto(id)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir vídeo')
    }
  }

  return (
    <Modal title={`Mídia — ${nomeProduto}`} onClose={onClose} size="xl">
      <div className="space-y-6">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-hull-900">Fotos</p>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-wake-500 hover:text-wake-600">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              {enviandoFoto ? 'Enviando…' : 'Adicionar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={enviandoFoto}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          {fotos.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma foto ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {fotos.map((foto) => (
                <div key={foto.id} className="group relative overflow-hidden rounded-md border border-foam-200">
                  <img src={foto.url_imagem} alt="" className="h-24 w-full object-cover" />
                  {foto.principal && (
                    <span className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-brass-500 px-2 py-0.5 text-[10px] font-medium text-hull-900">
                      <Star className="h-2.5 w-2.5" strokeWidth={2} fill="currentColor" />
                      Principal
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-hull-950/70 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!foto.principal ? (
                      <button
                        onClick={() => handlePrincipal(foto.id)}
                        className="text-[10px] text-foam-100 hover:text-brass-400"
                      >
                        Tornar principal
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      onClick={() => handleExcluirFoto(foto)}
                      className="text-foam-100 hover:text-signal-red"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-hull-900">Vídeos (YouTube)</p>
          <div className="mb-3 flex gap-2">
            <input
              value={urlVideo}
              onChange={(e) => setUrlVideo(e.target.value)}
              placeholder="Link do YouTube"
              className="input"
            />
            <input
              value={tituloVideo}
              onChange={(e) => setTituloVideo(e.target.value)}
              placeholder="Título (opcional)"
              className="input"
            />
            <button
              onClick={handleAdicionarVideo}
              disabled={!urlVideo.trim()}
              className="shrink-0 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400 disabled:opacity-40"
            >
              Adicionar
            </button>
          </div>
          {videos.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum vídeo ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {videos.map((video) => {
                const ytId = extrairYoutubeId(video.url_youtube)
                return (
                  <div
                    key={video.id}
                    className="group relative overflow-hidden rounded-md border border-foam-200"
                  >
                    {ytId ? (
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt={video.titulo ?? ''}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center bg-hull-900/[0.04] text-xs text-slate-400">
                        Link inválido
                      </div>
                    )}
                    <p className="truncate px-1.5 py-1 text-[10px] text-slate-500">
                      {video.titulo || 'Sem título'}
                    </p>
                    <button
                      onClick={() => handleExcluirVideo(video.id)}
                      className="absolute right-1 top-1 rounded-full bg-hull-950/70 p-1 text-foam-100 opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
