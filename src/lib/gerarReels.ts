// Gera um vídeo curto no formato Reels (9:16) a partir das fotos de um post — um slideshow
// simples, gravado direto no navegador via Canvas + MediaRecorder, sem depender de nenhum
// serviço externo. A trilha de fundo é sintetizada por código (Web Audio API), nunca uma
// amostra de música de terceiros — evita qualquer questão de direito autoral.

export type EstiloTrilha = 'sem_musica' | 'calma' | 'energica' | 'corporativa'

const LARGURA = 720
const ALTURA = 1280
const DURACAO_POR_FOTO = 3

const PRESETS_TRILHA: Record<Exclude<EstiloTrilha, 'sem_musica'>, { notas: number[]; ataqueSegundos: number; ganho: number }> = {
  calma: { notas: [261.63, 329.63, 392.0], ataqueSegundos: 2, ganho: 0.12 },
  energica: { notas: [293.66, 369.99, 440.0, 523.25], ataqueSegundos: 0.3, ganho: 0.1 },
  corporativa: { notas: [220.0, 277.18, 329.63], ataqueSegundos: 1, ganho: 0.12 },
}

async function gerarTrilha(estilo: Exclude<EstiloTrilha, 'sem_musica'>, duracaoSegundos: number): Promise<AudioBuffer> {
  const sampleRate = 44100
  const ctx = new OfflineAudioContext(2, Math.ceil(duracaoSegundos * sampleRate), sampleRate)
  const preset = PRESETS_TRILHA[estilo]

  const master = ctx.createGain()
  master.gain.value = preset.ganho
  master.connect(ctx.destination)

  preset.notas.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, 0)
    gain.gain.linearRampToValueAtTime(1, preset.ataqueSegundos + i * 0.15)
    gain.gain.setValueAtTime(1, Math.max(0, duracaoSegundos - 1))
    gain.gain.linearRampToValueAtTime(0, duracaoSegundos)
    osc.connect(gain)
    gain.connect(master)
    osc.start(0)
    osc.stop(duracaoSegundos)
  })

  return ctx.startRendering()
}

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${url}`))
    img.src = url
  })
}

function desenharImagemCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  ctx.fillStyle = '#0a0f16'
  ctx.fillRect(0, 0, LARGURA, ALTURA)
  const escala = Math.max(LARGURA / img.width, ALTURA / img.height)
  const larguraDesenho = img.width * escala
  const alturaDesenho = img.height * escala
  const x = (LARGURA - larguraDesenho) / 2
  const y = (ALTURA - alturaDesenho) / 2
  ctx.drawImage(img, x, y, larguraDesenho, alturaDesenho)
}

function escolherMimeType(): string {
  const candidatos = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
  return candidatos.find((tipo) => MediaRecorder.isTypeSupported(tipo)) ?? 'video/webm'
}

export async function gerarVideoReels(
  fotoUrls: string[],
  estiloMusica: EstiloTrilha,
  onProgresso?: (fracao: number) => void
): Promise<Blob> {
  if (fotoUrls.length === 0) throw new Error('Este post não tem fotos para gerar o vídeo.')

  const imagens = await Promise.all(fotoUrls.slice(0, 10).map(carregarImagem))
  const duracaoTotal = imagens.length * DURACAO_POR_FOTO

  const canvas = document.createElement('canvas')
  canvas.width = LARGURA
  canvas.height = ALTURA
  const ctx2d = canvas.getContext('2d')
  if (!ctx2d) throw new Error('Canvas não suportado neste navegador.')

  const videoStream = canvas.captureStream(30)
  const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()]

  let audioCtx: AudioContext | null = null
  if (estiloMusica !== 'sem_musica') {
    const buffer = await gerarTrilha(estiloMusica, duracaoTotal)
    audioCtx = new AudioContext()
    const destino = audioCtx.createMediaStreamDestination()
    const fonte = audioCtx.createBufferSource()
    fonte.buffer = buffer
    fonte.connect(destino)
    fonte.start()
    tracks.push(...destino.stream.getAudioTracks())
  }

  const mimeType = escolherMimeType()
  const recorder = new MediaRecorder(new MediaStream(tracks), {
    mimeType,
    videoBitsPerSecond: 2_500_000,
  })
  const partes: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) partes.push(e.data)
  }

  const gravado = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(partes, { type: mimeType }))
  })

  recorder.start()
  const inicio = performance.now()

  // Usa setInterval em vez de requestAnimationFrame: rAF pausa se a aba perder o foco durante a
  // geração, travando o processo indefinidamente. setInterval continua rodando em segundo plano.
  await new Promise<void>((resolve) => {
    const intervalo = setInterval(() => {
      const decorrido = (performance.now() - inicio) / 1000
      const indice = Math.min(imagens.length - 1, Math.floor(decorrido / DURACAO_POR_FOTO))
      desenharImagemCover(ctx2d!, imagens[indice])
      onProgresso?.(Math.min(1, decorrido / duracaoTotal))
      if (decorrido >= duracaoTotal) {
        clearInterval(intervalo)
        resolve()
      }
    }, 1000 / 30)
  })

  recorder.stop()
  audioCtx?.close()

  return gravado
}
