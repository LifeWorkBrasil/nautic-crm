import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Megaphone,
  Sparkles,
  Copy,
  Check,
  Save,
  ImageOff,
  Instagram,
  Link2,
  CalendarClock,
  X,
  ChevronDown,
  Trash2,
} from 'lucide-react'
import {
  listMidiaBanco,
  gerarLegendaSocial,
  listPostsMarketing,
  salvarPostMarketing,
  excluirPostMarketing,
  cancelarAgendamentoPost,
  agendarPostExistente,
  getInstagramStatus,
  getInstagramConectarUrl,
  publicarNoInstagram,
} from '@/lib/api'
import type { MidiaBancoItem, PostMarketing, InstagramStatus } from '@/types'

const ANTECEDENCIA_MINIMA_MS = 5 * 60 * 1000

function formatarDatetimeLocal(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(
    data.getMinutes()
  )}`
}

const TONS = ['Profissional', 'Descontraído', 'Urgente/Promocional', 'Inspirador']
const PROVEDORES = [
  { valor: 'claude' as const, label: 'Claude' },
  { valor: 'gemini' as const, label: 'Gemini' },
]

export default function Marketing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [midia, setMidia] = useState<MidiaBancoItem[]>([])
  const [carregandoMidia, setCarregandoMidia] = useState(true)
  const [selecionado, setSelecionado] = useState<MidiaBancoItem | null>(null)

  const [tom, setTom] = useState(TONS[0])
  const [provedor, setProvedor] = useState<'claude' | 'gemini'>('claude')
  const [legenda, setLegenda] = useState('')
  const [origemLegenda, setOrigemLegenda] = useState<'claude' | 'gemini' | 'manual' | null>(null)
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [ultimoPostSalvo, setUltimoPostSalvo] = useState<PostMarketing | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarAgendamento, setMostrarAgendamento] = useState(false)
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [programando, setProgramando] = useState(false)

  const [posts, setPosts] = useState<PostMarketing[]>([])
  const [carregandoPosts, setCarregandoPosts] = useState(true)

  const [instagram, setInstagram] = useState<InstagramStatus | null>(null)
  const [avisoInstagram, setAvisoInstagram] = useState<string | null>(null)
  const [publicandoId, setPublicandoId] = useState<string | null>(null)

  const [itensAbertos, setItensAbertos] = useState<Set<string>>(new Set())
  const [agendandoItemId, setAgendandoItemId] = useState<string | null>(null)
  const [dataAgendamentoItem, setDataAgendamentoItem] = useState('')
  const [programandoItemId, setProgramandoItemId] = useState<string | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  useEffect(() => {
    listMidiaBanco()
      .then(setMidia)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregandoMidia(false))
    listPostsMarketing()
      .then(setPosts)
      .catch(() => {})
      .finally(() => setCarregandoPosts(false))
    getInstagramStatus()
      .then(setInstagram)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const status = searchParams.get('instagram')
    if (!status) return
    if (status === 'conectado') {
      setAvisoInstagram('Instagram conectado com sucesso.')
      getInstagramStatus().then(setInstagram).catch(() => {})
    } else if (status === 'erro') {
      setAvisoInstagram(searchParams.get('instagram_msg') || 'Não foi possível conectar o Instagram.')
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('instagram')
      next.delete('instagram_msg')
      return next
    }, { replace: true })
  }, [searchParams, setSearchParams])

  function selecionar(item: MidiaBancoItem) {
    setSelecionado(item)
    setLegenda('')
    setOrigemLegenda(null)
    setUltimoPostSalvo(null)
    setErro(null)
    setMostrarAgendamento(false)
    setDataAgendamento('')
  }

  async function handleGerar() {
    if (!selecionado) return
    setGerando(true)
    setErro(null)
    setUltimoPostSalvo(null)
    try {
      const texto = await gerarLegendaSocial({
        nome: selecionado.nome,
        descricao: selecionado.descricao,
        tom,
        precoBase: selecionado.precoBase,
        provider: provedor,
      })
      setLegenda(texto)
      setOrigemLegenda(provedor)
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
        provedor_ia: origemLegenda ?? 'manual',
      })
      setPosts((prev) => [novo, ...prev])
      setUltimoPostSalvo(novo)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleProgramar() {
    if (!selecionado || !legenda || !dataAgendamento) return
    const dataEscolhida = new Date(dataAgendamento)
    if (dataEscolhida.getTime() < Date.now() + ANTECEDENCIA_MINIMA_MS) {
      setErro('Escolha um horário com pelo menos 5 minutos de antecedência.')
      return
    }
    setProgramando(true)
    setErro(null)
    try {
      const novo = await salvarPostMarketing({
        produto_id: selecionado.origem === 'produto' ? selecionado.origemId : null,
        captacao_id: selecionado.origem === 'captacao' ? selecionado.origemId : null,
        tom,
        legenda_gerada: legenda,
        foto_urls: selecionado.fotos.map((f) => f.url_imagem),
        provedor_ia: origemLegenda ?? 'manual',
        agendado_para: dataEscolhida.toISOString(),
      })
      setPosts((prev) => [novo, ...prev])
      setUltimoPostSalvo(novo)
      setMostrarAgendamento(false)
      setDataAgendamento('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao programar publicação')
    } finally {
      setProgramando(false)
    }
  }

  async function handleCancelarAgendamento(postId: string) {
    setErro(null)
    try {
      await cancelarAgendamentoPost(postId)
      const atualiza = (p: PostMarketing) =>
        p.id === postId ? { ...p, agendado_para: null, status_agendamento: null, erro_agendamento: null } : p
      setPosts((prev) => prev.map(atualiza))
      setUltimoPostSalvo((prev) => (prev ? atualiza(prev) : prev))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao cancelar agendamento')
    }
  }

  async function handlePublicarInstagram(postId: string) {
    setPublicandoId(postId)
    setErro(null)
    try {
      const { media_id } = await publicarNoInstagram(postId)
      const atualiza = (p: PostMarketing) =>
        p.id === postId
          ? { ...p, instagram_media_id: media_id, publicado_instagram_em: new Date().toISOString() }
          : p
      setPosts((prev) => prev.map(atualiza))
      setUltimoPostSalvo((prev) => (prev ? atualiza(prev) : prev))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao publicar no Instagram')
    } finally {
      setPublicandoId(null)
    }
  }

  async function handleExcluirPost(postId: string) {
    if (!confirm('Excluir esta legenda do histórico? Essa ação não pode ser desfeita.')) return
    setExcluindoId(postId)
    setErro(null)
    try {
      await excluirPostMarketing(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setUltimoPostSalvo((prev) => (prev?.id === postId ? null : prev))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir legenda')
    } finally {
      setExcluindoId(null)
    }
  }

  function toggleItemAberto(postId: string) {
    setItensAbertos((prev) => {
      const next = new Set(prev)
      next.has(postId) ? next.delete(postId) : next.add(postId)
      return next
    })
  }

  function abrirAgendamentoItem(postId: string) {
    setAgendandoItemId((atual) => (atual === postId ? null : postId))
    setDataAgendamentoItem('')
    setErro(null)
  }

  async function handleConfirmarAgendamentoItem(post: PostMarketing) {
    if (!dataAgendamentoItem) return
    const dataEscolhida = new Date(dataAgendamentoItem)
    if (dataEscolhida.getTime() < Date.now() + ANTECEDENCIA_MINIMA_MS) {
      setErro('Escolha um horário com pelo menos 5 minutos de antecedência.')
      return
    }
    setProgramandoItemId(post.id)
    setErro(null)
    try {
      if (post.instagram_media_id) {
        // Já publicado: agendar uma repostagem cria um novo item no histórico.
        const novo = await salvarPostMarketing({
          produto_id: post.produto_id,
          captacao_id: post.captacao_id,
          tom: post.tom,
          legenda_gerada: post.legenda_gerada,
          foto_urls: post.foto_urls,
          provedor_ia: post.provedor_ia,
          agendado_para: dataEscolhida.toISOString(),
        })
        setPosts((prev) => [novo, ...prev])
      } else {
        const atualizado = await agendarPostExistente(post.id, dataEscolhida.toISOString())
        setPosts((prev) => prev.map((p) => (p.id === post.id ? atualizado : p)))
      }
      setAgendandoItemId(null)
      setDataAgendamentoItem('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao programar publicação')
    } finally {
      setProgramandoItemId(null)
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

      {avisoInstagram && (
        <div className="mb-5 flex items-center justify-between rounded-md border border-wake-400/40 bg-wake-400/5 px-4 py-2.5 text-sm text-hull-900">
          {avisoInstagram}
          <button onClick={() => setAvisoInstagram(null)} className="text-xs text-slate-400 hover:text-hull-900">
            Fechar
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between rounded-md border border-foam-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <Instagram className="h-5 w-5 text-brass-400" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium text-hull-900">
              {instagram?.conectado ? `Conectado como @${instagram.instagram_username}` : 'Instagram não conectado'}
            </p>
            <p className="text-[11px] text-slate-400">
              {instagram?.conectado
                ? 'Você pode publicar legendas geradas direto no feed.'
                : 'Conecte a conta do Instagram do cliente para publicar direto pelo CRM.'}
            </p>
          </div>
        </div>
        {!instagram?.conectado && (
          <a
            href={getInstagramConectarUrl()}
            className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400"
          >
            <Link2 className="h-4 w-4" strokeWidth={1.75} />
            Conectar Instagram
          </a>
        )}
      </div>

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

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">Gerar com</span>
                <select
                  value={provedor}
                  onChange={(e) => setProvedor(e.target.value as 'claude' | 'gemini')}
                  className="input"
                >
                  {PROVEDORES.map((p) => (
                    <option key={p.valor} value={p.valor}>
                      {p.label}
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

              <div className="space-y-3 border-t border-foam-200 pt-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-hull-900">Legenda</span>
                  <textarea
                    rows={8}
                    value={legenda}
                    onChange={(e) => {
                      setLegenda(e.target.value)
                      setOrigemLegenda(e.target.value ? 'manual' : null)
                      setUltimoPostSalvo(null)
                    }}
                    placeholder="Gere com IA acima ou escreva sua própria legenda aqui."
                    className="input resize-none"
                  />
                </label>
                {legenda && (
                  <div className="flex flex-wrap items-center gap-3">
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
                    {instagram?.conectado && (
                      <button
                        onClick={() => setMostrarAgendamento((v) => !v)}
                        className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400"
                      >
                        <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                        Programar
                      </button>
                    )}
                    {ultimoPostSalvo && !ultimoPostSalvo.instagram_media_id && ultimoPostSalvo.status_agendamento !== 'agendado' && (
                      <span className="flex items-center gap-1.5 text-sm text-signal-green">
                        <Check className="h-4 w-4" strokeWidth={2} />
                        Salvo
                      </span>
                    )}
                    {ultimoPostSalvo?.status_agendamento === 'agendado' && (
                      <span className="flex items-center gap-1.5 text-sm text-signal-green">
                        <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                        Programado para{' '}
                        {ultimoPostSalvo.agendado_para && new Date(ultimoPostSalvo.agendado_para).toLocaleString('pt-BR')}
                      </span>
                    )}
                    {ultimoPostSalvo && instagram?.conectado && !ultimoPostSalvo.instagram_media_id && (
                      <button
                        onClick={() => handlePublicarInstagram(ultimoPostSalvo.id)}
                        disabled={publicandoId === ultimoPostSalvo.id}
                        className="flex items-center gap-2 rounded-md bg-brass-400 px-3 py-2 text-sm font-medium text-hull-900 hover:bg-brass-500 disabled:opacity-50"
                      >
                        <Instagram className="h-4 w-4" strokeWidth={1.75} />
                        {publicandoId === ultimoPostSalvo.id ? 'Publicando…' : 'Publicar no Instagram'}
                      </button>
                    )}
                    {ultimoPostSalvo?.instagram_media_id && (
                      <span className="flex items-center gap-1.5 text-sm text-signal-green">
                        <Check className="h-4 w-4" strokeWidth={2} />
                        Publicado no Instagram
                      </span>
                    )}
                  </div>
                )}
                {mostrarAgendamento && (
                  <div className="flex flex-wrap items-end gap-3 rounded-md border border-foam-200 bg-foam-100 p-3">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-hull-900">Publicar em</span>
                      <input
                        type="datetime-local"
                        value={dataAgendamento}
                        min={formatarDatetimeLocal(new Date(Date.now() + ANTECEDENCIA_MINIMA_MS))}
                        onChange={(e) => setDataAgendamento(e.target.value)}
                        className="input"
                      />
                    </label>
                    <button
                      onClick={handleProgramar}
                      disabled={programando || !dataAgendamento}
                      className="flex items-center gap-2 rounded-md bg-hull-900 px-3 py-2 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-50"
                    >
                      <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                      {programando ? 'Programando…' : 'Confirmar agendamento'}
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
              </div>
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
          <div className="space-y-2">
            {posts.map((post) => {
              const aberto = itensAbertos.has(post.id)
              const publicado = !!post.instagram_media_id
              const agendado = post.status_agendamento === 'agendado'
              const comErro = post.status_agendamento === 'erro'
              const podePublicar = !!instagram?.conectado && !!post.foto_urls && post.foto_urls.length > 0

              return (
                <div key={post.id} className="rounded-md border border-foam-200">
                  <button
                    onClick={() => toggleItemAberto(post.id)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  >
                    <span className="truncate text-sm font-medium text-hull-900">
                      {post.produto_nome ?? 'Sem produto vinculado'}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      {publicado && (
                        <span className="flex items-center gap-1 rounded-full bg-signal-green/10 px-2 py-0.5 text-[11px] text-signal-green">
                          <Instagram className="h-3 w-3" strokeWidth={1.75} />
                          Publicado
                        </span>
                      )}
                      {!publicado && agendado && (
                        <span className="flex items-center gap-1 rounded-full bg-brass-200/40 px-2 py-0.5 text-[11px] text-hull-900">
                          <CalendarClock className="h-3 w-3" strokeWidth={1.75} />
                          Agendado
                        </span>
                      )}
                      {!publicado && comErro && (
                        <span className="flex items-center gap-1 rounded-full bg-signal-red/10 px-2 py-0.5 text-[11px] text-signal-red">
                          Falha
                        </span>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`}
                        strokeWidth={1.75}
                      />
                    </div>
                  </button>

                  {aberto && (
                    <div className="space-y-3 border-t border-foam-200 p-3">
                      <p className="whitespace-pre-wrap text-sm text-hull-900">{post.legenda_gerada}</p>
                      <p className="text-[11px] text-slate-400">
                        {post.tom ? `Tom: ${post.tom} · ` : ''}
                        {post.provedor_ia
                          ? `${
                              post.provedor_ia === 'gemini'
                                ? 'Gemini'
                                : post.provedor_ia === 'manual'
                                  ? 'Manual'
                                  : 'Claude'
                            } · `
                          : ''}
                        {new Date(post.criado_em).toLocaleString('pt-BR')}
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        {publicado && (
                          <span className="flex items-center gap-1.5 text-sm text-signal-green">
                            <Check className="h-4 w-4" strokeWidth={2} />
                            Publicado em{' '}
                            {post.publicado_instagram_em &&
                              new Date(post.publicado_instagram_em).toLocaleString('pt-BR')}
                          </span>
                        )}
                        {agendado && (
                          <>
                            <span className="flex items-center gap-1.5 text-sm text-hull-900">
                              <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                              Agendado para{' '}
                              {post.agendado_para && new Date(post.agendado_para).toLocaleString('pt-BR')}
                            </span>
                            <button
                              onClick={() => handleCancelarAgendamento(post.id)}
                              className="text-[11px] text-slate-400 hover:text-signal-red"
                            >
                              Cancelar agendamento
                            </button>
                          </>
                        )}
                        {comErro && (
                          <span className="text-sm text-signal-red">
                            Falha ao publicar{post.erro_agendamento ? `: ${post.erro_agendamento}` : ''}
                          </span>
                        )}
                        {podePublicar && !publicado && (
                          <button
                            onClick={() => handlePublicarInstagram(post.id)}
                            disabled={publicandoId === post.id}
                            className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400 disabled:opacity-50"
                          >
                            <Instagram className="h-4 w-4" strokeWidth={1.75} />
                            {publicandoId === post.id ? 'Publicando…' : 'Publicar agora'}
                          </button>
                        )}
                        {podePublicar && !agendado && (
                          <button
                            onClick={() => abrirAgendamentoItem(post.id)}
                            className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400"
                          >
                            <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                            {publicado ? 'Programar repostagem' : 'Programar'}
                          </button>
                        )}
                        <button
                          onClick={() => handleExcluirPost(post.id)}
                          disabled={excluindoId === post.id}
                          className="ml-auto flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-signal-red/80 hover:border-signal-red/40 hover:text-signal-red disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          {excluindoId === post.id ? 'Excluindo…' : 'Excluir'}
                        </button>
                      </div>

                      {agendandoItemId === post.id && (
                        <div className="flex flex-wrap items-end gap-3 rounded-md border border-foam-200 bg-foam-100 p-3">
                          <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-hull-900">Publicar em</span>
                            <input
                              type="datetime-local"
                              value={dataAgendamentoItem}
                              min={formatarDatetimeLocal(new Date(Date.now() + ANTECEDENCIA_MINIMA_MS))}
                              onChange={(e) => setDataAgendamentoItem(e.target.value)}
                              className="input"
                            />
                          </label>
                          <button
                            onClick={() => handleConfirmarAgendamentoItem(post)}
                            disabled={programandoItemId === post.id || !dataAgendamentoItem}
                            className="flex items-center gap-2 rounded-md bg-hull-900 px-3 py-2 text-sm font-medium text-foam-50 hover:bg-hull-800 disabled:opacity-50"
                          >
                            <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                            {programandoItemId === post.id ? 'Programando…' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => setAgendandoItemId(null)}
                            className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900 hover:border-wake-400"
                          >
                            <X className="h-4 w-4" strokeWidth={1.75} />
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
