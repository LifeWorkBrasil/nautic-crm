import { useEffect, useState } from 'react'
import { Megaphone, Sparkles, Copy, Check, Save, ImageOff } from 'lucide-react'
import {
  listMidiaBanco,
  gerarLegendaSocial,
  listPostsMarketing,
  salvarPostMarketing,
} from '@/lib/api'
import type { MidiaBancoItem, PostMarketing } from '@/types'

const TONS = ['Profissional', 'Descontraído', 'Urgente/Promocional', 'Inspirador']

export default function Marketing() {
  const [midia, setMidia] = useState<MidiaBancoItem[]>([])
  const [carregandoMidia, setCarregandoMidia] = useState(true)
  const [selecionado, setSelecionado] = useState<MidiaBancoItem | null>(null)

  const [tom, setTom] = useState(TONS[0])
  const [legenda, setLegenda] = useState('')
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [posts, setPosts] = useState<PostMarketing[]>([])
  const [carregandoPosts, setCarregandoPosts] = useState(true)

  useEffect(() => {
    listMidiaBanco()
      .then(setMidia)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregandoMidia(false))
    listPostsMarketing()
      .then(setPosts)
      .catch(() => {})
      .finally(() => setCarregandoPosts(false))
  }, [])

  function selecionar(item: MidiaBancoItem) {
    setSelecionado(item)
    setLegenda('')
    setSalvo(false)
    setErro(null)
  }

  async function handleGerar() {
    if (!selecionado) return
    setGerando(true)
    setErro(null)
    setSalvo(false)
    try {
      const texto = await gerarLegendaSocial({
        nome: selecionado.nome,
        descricao: selecionado.descricao,
        tom,
        precoBase: selecionado.precoBase,
      })
      setLegenda(texto)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar legenda')
    } finally {
      setGerando(false)
    }
  }

  async function handleCopiar() {
    await navigator.clipboard.writeText(legenda)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  async function handleSalvar() {
    if (!selecionado || !legenda) return
    setSalvando(true)
    try {
      const novo = await salvarPostMarketing({
        produto_id: selecionado.origem === 'produto' ? selecionado.origemId : null,
        captacao_id: selecionado.origem === 'captacao' ? selecionado.origemId : null,
        tom,
        legenda_gerada: legenda,
        foto_urls: selecionado.fotos.map((f) => f.url_imagem),
      })
      setPosts((prev) => [novo, ...prev])
      setSalvo(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">
          Conteúdo para redes sociais
        </p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          Marketing
        </h1>
      </header>

      {erro && (
        <div className="mb-5 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        {/* Banco de Mídia */}
        <div className="rounded-md border border-foam-200 bg-white p-5">
          <p className="mb-1 text-sm font-medium text-hull-900">Banco de Mídia</p>
          <p className="mb-4 text-[11px] text-slate-400">
            Selecione um produto ou captação para gerar uma legenda a partir das fotos.
          </p>

          {carregandoMidia ? (
            <p className="text-sm text-slate-400">Carregando mídia…</p>
          ) : midia.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nenhum produto ou captação com fotos cadastradas ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {midia.map((item) => {
                const capa = item.fotos.find((f) => f.principal) ?? item.fotos[0]
                const ativo =
                  selecionado?.origem === item.origem && selecionado?.origemId === item.origemId
                return (
                  <button
                    key={`${item.origem}-${item.origemId}`}
                    onClick={() => selecionar(item)}
                    className={`overflow-hidden rounded-md border text-left transition-colors ${
                      ativo ? 'border-wake-400 ring-1 ring-wake-400' : 'border-foam-200 hover:border-wake-400/60'
                    }`}
                  >
                    <div className="flex aspect-square items-center justify-center overflow-hidden bg-foam-100">
                      {capa ? (
                        <img
                          src={capa.url_imagem}
                          alt={item.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageOff className="h-6 w-6 text-slate-300" strokeWidth={1.5} />
                      )}
                    </div>
                    <p className="truncate px-2 py-1.5 text-[11px] text-hull-900">{item.nome}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Social Mídia */}
        <div className="space-y-5 rounded-md border border-foam-200 bg-white p-5">
          <p className="text-sm font-medium text-hull-900">Social Mídia</p>

          {!selecionado ? (
            <p className="text-sm text-slate-400">
              Selecione um item no Banco de Mídia ao lado para começar.
            </p>
          ) : (
            <>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-hull-900">Produto</span>
                <p className="rounded-md border border-foam-200 bg-foam-100 px-3 py-2 text-sm text-hull-900">
                  {selecionado.nome}
                </p>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">Tom desejado</span>
                <select value={tom} onChange={(e) => setTom(e.target.value)} className="input">
                  {TONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={handleGerar}
                disabled={gerando}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                {gerando ? 'Gerando…' : 'Gerar legenda com IA'}
              </button>

              {legenda && (
                <div className="space-y-3 border-t border-foam-200 pt-4">
                  <textarea
                    rows={8}
                    value={legenda}
                    onChange={(e) => {
                      setLegenda(e.target.value)
                      setSalvo(false)
                    }}
                    className="input resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopiar}
                      className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400"
                    >
                      {copiado ? (
                        <Check className="h-4 w-4 text-signal-green" strokeWidth={2} />
                      ) : (
                        <Copy className="h-4 w-4" strokeWidth={1.75} />
                      )}
                      {copiado ? 'Copiado' : 'Copiar'}
                    </button>
                    <button
                      onClick={handleSalvar}
                      disabled={salvando}
                      className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" strokeWidth={1.75} />
                      {salvando ? 'Salvando…' : 'Salvar no histórico'}
                    </button>
                    {salvo && (
                      <span className="flex items-center gap-1.5 text-sm text-signal-green">
                        <Check className="h-4 w-4" strokeWidth={2} />
                        Salvo
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Histórico */}
      <div className="mt-6 rounded-md border border-foam-200 bg-white p-5">
        <p className="mb-4 flex items-center gap-2 text-sm font-medium text-hull-900">
          <Megaphone className="h-4 w-4 text-brass-400" strokeWidth={1.75} />
          Histórico de legendas
        </p>
        {carregandoPosts ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma legenda salva ainda.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-md border border-foam-200 p-3">
                <p className="whitespace-pre-wrap text-sm text-hull-900">{post.legenda_gerada}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  {post.tom ? `Tom: ${post.tom} · ` : ''}
                  {new Date(post.criado_em).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
