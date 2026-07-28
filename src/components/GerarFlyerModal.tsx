import { useEffect, useState } from 'react'
import { Image as ImageIcon, Instagram, RotateCcw } from 'lucide-react'
import Modal from '@/components/Modal'
import { montarFlyerPadrao, montarFlyerAntesDepois } from '@/lib/gerarFlyer'
import type { DadosMarcaFlyer } from '@/lib/gerarFlyer'
import {
  getEmpresaConfig,
  getInstagramStatus,
  uploadFlyerMarketing,
  atualizarFotosPostMarketing,
  publicarNoInstagram,
} from '@/lib/api'
import { usePermissoes } from '@/lib/PermissoesContext'

type Template = 'padrao' | 'antes_depois'
type Etapa = 'escolher' | 'gerando' | 'pre_visualizar' | 'enviando' | 'publicando'

export default function GerarFlyerModal({
  postId,
  fotoUrls,
  nomeProduto,
  onClose,
  onPublicado,
}: {
  postId: string
  fotoUrls: string[]
  nomeProduto: string
  onClose: () => void
  onPublicado: (mediaId: string) => void
}) {
  const { perfil } = usePermissoes()
  const [template, setTemplate] = useState<Template>('padrao')
  const [fotoPrincipal, setFotoPrincipal] = useState(fotoUrls[0] ?? '')
  const [fotoAntes, setFotoAntes] = useState(fotoUrls[0] ?? '')
  const [fotoDepois, setFotoDepois] = useState(fotoUrls[1] ?? fotoUrls[0] ?? '')
  const [categoria, setCategoria] = useState('')
  const [tagline, setTagline] = useState('')
  const [titulo, setTitulo] = useState('Antes e depois')
  const [subtitulo, setSubtitulo] = useState('')
  const [removerFundo, setRemoverFundo] = useState(true)

  const [etapa, setEtapa] = useState<Etapa>('escolher')
  const [erro, setErro] = useState<string | null>(null)
  const [flyerBlob, setFlyerBlob] = useState<Blob | null>(null)
  const [flyerUrl, setFlyerUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (flyerUrl) URL.revokeObjectURL(flyerUrl)
    }
  }, [flyerUrl])

  async function montarDadosMarca(): Promise<DadosMarcaFlyer> {
    const [empresa, instagram] = await Promise.all([getEmpresaConfig(), getInstagramStatus()])
    return {
      nomeEmpresa: empresa?.nome_empresa ?? 'Minha Empresa',
      logoUrl: empresa?.logo_url ?? null,
      telefone: empresa?.telefone ?? null,
      site: empresa?.site ?? null,
      instagramUsername: instagram?.conectado ? instagram.instagram_username : null,
    }
  }

  async function gerar() {
    setErro(null)
    try {
      setEtapa('gerando')
      const marca = await montarDadosMarca()
      const blob =
        template === 'padrao'
          ? await montarFlyerPadrao({
              fotoUrl: fotoPrincipal,
              nomeProduto,
              categoria: categoria || null,
              tagline: tagline || null,
              marca,
              removerFundo,
            })
          : await montarFlyerAntesDepois({
              fotoUrlAntes: fotoAntes,
              fotoUrlDepois: fotoDepois,
              titulo,
              subtitulo: subtitulo || null,
              marca,
              removerFundo,
            })
      setFlyerBlob(blob)
      setFlyerUrl(URL.createObjectURL(blob))
      setEtapa('pre_visualizar')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar o flyer')
      setEtapa('escolher')
    }
  }

  function gerarNovamente() {
    if (flyerUrl) URL.revokeObjectURL(flyerUrl)
    setFlyerBlob(null)
    setFlyerUrl(null)
    setErro(null)
    setEtapa('escolher')
  }

  async function publicar() {
    if (!perfil?.empresa_id || !flyerBlob) return
    setErro(null)
    try {
      setEtapa('enviando')
      const urlPublica = await uploadFlyerMarketing(perfil.empresa_id, postId, flyerBlob)
      await atualizarFotosPostMarketing(postId, [urlPublica])

      setEtapa('publicando')
      const { media_id } = await publicarNoInstagram(postId)

      onPublicado(media_id)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao publicar o flyer')
      setEtapa('pre_visualizar')
    }
  }

  const emAndamento = etapa === 'gerando' || etapa === 'enviando' || etapa === 'publicando'
  const podeGerar =
    template === 'padrao' ? !!fotoPrincipal : !!fotoAntes && !!fotoDepois && !!titulo.trim()

  return (
    <Modal title="Gerar Flyer" onClose={onClose} size="md">
      <div className="space-y-4">
        {etapa === 'escolher' && (
          <p className="text-sm text-slate-500">
            Monta uma imagem pronta pra postar no feed do Instagram (1080x1350), direto no seu
            navegador — com a logo e os dados de contato da empresa. Removendo o fundo, a
            primeira geração pode demorar um pouco mais (baixa o modelo de remoção de fundo).
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
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Modelo</span>
              <select value={template} onChange={(e) => setTemplate(e.target.value as Template)} className="input">
                <option value="padrao">Produto em destaque</option>
                <option value="antes_depois">Antes e depois</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-hull-900">
              <input
                type="checkbox"
                checked={removerFundo}
                onChange={(e) => setRemoverFundo(e.target.checked)}
                className="h-4 w-4 accent-brass-500"
              />
              Remover fundo da foto
            </label>

            {template === 'padrao' ? (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">Foto do produto</span>
                  <select value={fotoPrincipal} onChange={(e) => setFotoPrincipal(e.target.value)} className="input">
                    {fotoUrls.map((url, i) => (
                      <option key={url} value={url}>
                        Foto {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">
                    Categoria (opcional)
                  </span>
                  <input
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ex.: DECORAÇÃO, GAMER, CASA…"
                    className="input"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">
                    Frase de destaque (opcional)
                  </span>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Ex.: Feito sob encomenda"
                    className="input"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">Foto — antes</span>
                  <select value={fotoAntes} onChange={(e) => setFotoAntes(e.target.value)} className="input">
                    {fotoUrls.map((url, i) => (
                      <option key={url} value={url}>
                        Foto {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">Foto — depois</span>
                  <select value={fotoDepois} onChange={(e) => setFotoDepois(e.target.value)} className="input">
                    {fotoUrls.map((url, i) => (
                      <option key={url} value={url}>
                        Foto {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">Título</span>
                  <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">
                    Subtítulo (opcional)
                  </span>
                  <input
                    value={subtitulo}
                    onChange={(e) => setSubtitulo(e.target.value)}
                    placeholder="Ex.: Mande a peça danificada e receba uma réplica sob medida"
                    className="input"
                  />
                </label>
              </>
            )}

            <button
              onClick={gerar}
              disabled={!podeGerar}
              className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
            >
              <ImageIcon className="h-4 w-4" strokeWidth={1.75} />
              Gerar flyer
            </button>
          </>
        )}

        {etapa === 'pre_visualizar' && flyerUrl && (
          <>
            <img
              src={flyerUrl}
              alt="Pré-visualização do flyer"
              className="mx-auto aspect-[4/5] w-full max-w-[280px] rounded-md border border-foam-200 object-cover"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={gerarNovamente}
                className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2 text-sm font-medium text-hull-900 hover:border-wake-400"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
                Gerar novamente
              </button>
              <button
                onClick={publicar}
                className="flex items-center gap-2 rounded-md bg-brass-400 px-4 py-2 text-sm font-medium text-hull-900 hover:bg-brass-500"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.75} />
                Publicar no Instagram
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Publicar substitui as fotos deste post pelo flyer — a legenda salva continua a
              mesma.
            </p>
          </>
        )}

        {emAndamento && (
          <div className="space-y-2">
            <p className="text-sm text-hull-900">
              {etapa === 'gerando' && 'Gerando flyer… isso pode levar alguns segundos.'}
              {etapa === 'enviando' && 'Enviando flyer…'}
              {etapa === 'publicando' && 'Publicando no Instagram… isso pode levar até um minuto.'}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foam-200">
              <div className="h-full w-full animate-pulse bg-brass-400" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
