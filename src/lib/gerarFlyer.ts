// Gera flyers de Instagram (imagem estática, formato feed 1080x1350) a partir de fotos do
// Banco de Mídia — remove o fundo do produto e monta a peça direto no navegador via Canvas,
// no mesmo espírito do gerarReels.ts (processamento roda no dispositivo do usuário).
//
// A remoção de fundo usa @imgly/background-removal (WASM/ONNX Runtime Web). Os arquivos de
// modelo (~40-80MB) são baixados do CDN da IMG.LY na primeira execução e cacheados pelo
// navegador — nenhuma foto do usuário sai do dispositivo dele, só os pesos do modelo são
// baixados de fora. Auto-hospedar esses arquivos em /public (ver "Custom Asset Serving" no
// README do pacote) é uma otimização futura se algum dia precisarmos tirar essa dependência
// do CDN externo.
//
// Paleta propositalmente monocromática (preto/branco/cinza): o sistema é multi-tenant e não
// existe hoje uma cor de marca configurável por empresa (só nome_empresa/logo_url/telefone/
// site em `empresas`) — um acento colorido fixo aqui entraria em conflito com a marca de
// algum tenant. O logo de cada empresa já traz sua própria cor pro flyer.

const LARGURA = 1080
const ALTURA = 1350

export interface DadosMarcaFlyer {
  nomeEmpresa: string
  logoUrl: string | null
  telefone: string | null
  site: string | null
  instagramUsername: string | null
}

let fontesCarregadas: Promise<void> | null = null

function carregarFontes(): Promise<void> {
  if (!fontesCarregadas) {
    // Assets de /public são servidos sob o base path do Vite (`/nautic-crm/` em produção),
    // não a partir da raiz do domínio — daí o BASE_URL em vez de um caminho absoluto fixo.
    const base = import.meta.env.BASE_URL
    fontesCarregadas = (async () => {
      const [display, corpo] = await Promise.all([
        new FontFace('Flyer Display', `url(${base}fonts/SpaceGrotesk-Bold.ttf)`, { weight: '700' }).load(),
        new FontFace('Flyer Corpo', `url(${base}fonts/Inter-Regular.ttf)`, { weight: '400' }).load(),
      ])
      document.fonts.add(display)
      document.fonts.add(corpo)
    })()
  }
  return fontesCarregadas
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

// Recorta a margem transparente ao redor do produto (a remoção de fundo preserva o tamanho
// original da foto, com a sobra vazia) escaneando o canal alfa pra achar a caixa delimitadora
// do que sobrou visível.
function recortarTransparencia(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const LIMIAR_ALFA = 10
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alfa = data[(y * width + x) * 4 + 3]
      if (alfa > LIMIAR_ALFA) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return canvas
  const w = maxX - minX + 1
  const h = maxY - minY + 1
  const recortado = document.createElement('canvas')
  recortado.width = w
  recortado.height = h
  recortado.getContext('2d')!.drawImage(canvas, minX, minY, w, h, 0, 0, w, h)
  return recortado
}

async function removerFundoRecortado(url: string): Promise<HTMLCanvasElement> {
  // Import dinâmico (mesmo padrão do html2pdf.js em GerarContratoModal.tsx/Orcamentos.tsx):
  // o pacote arrasta o glue JS do onnxruntime-web (~1.5MB) — só vale baixar isso quando o
  // usuário realmente pede pra gerar um flyer, não em toda carga da página de Marketing.
  const { removeBackground } = await import('@imgly/background-removal')
  const blob = await removeBackground(url, { output: { format: 'image/png', quality: 1 } })
  const img = await carregarImagem(URL.createObjectURL(blob))
  const bruto = document.createElement('canvas')
  bruto.width = img.width
  bruto.height = img.height
  bruto.getContext('2d')!.drawImage(img, 0, 0)
  return recortarTransparencia(bruto)
}

function caminhoArredondado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Desenha o produto (já sem fundo) centralizado num card branco arredondado, escalado pra
// caber sem distorcer, com sombra suave por baixo. O Canvas calcula a sombra a partir do
// alfa da própria imagem via shadow*, sem precisar montar uma máscara à parte.
function desenharCardProduto(
  ctx: CanvasRenderingContext2D,
  produto: HTMLCanvasElement,
  x: number,
  y: number,
  tamanho: number
) {
  ctx.save()
  caminhoArredondado(ctx, x, y, tamanho, tamanho, 36)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.clip()

  const margem = tamanho * 0.08
  const areaUtil = tamanho - margem * 2
  const escala = Math.min(areaUtil / produto.width, areaUtil / produto.height)
  const w = produto.width * escala
  const h = produto.height * escala
  const px = x + (tamanho - w) / 2
  const py = y + (tamanho - h) / 2

  ctx.shadowColor = 'rgba(0, 0, 0, 0.32)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 14
  ctx.drawImage(produto, px, py, w, h)
  ctx.restore()
}

function desenharNomeEmpresa(ctx: CanvasRenderingContext2D, nome: string) {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 32px "Flyer Display"'
  ctx.fillText(nome, 60, 78)
}

const FONTE_SELO = '600 14px "Flyer Corpo"'

function larguraSelo(ctx: CanvasRenderingContext2D, texto: string): number {
  ctx.font = FONTE_SELO
  return ctx.measureText(texto.toUpperCase()).width + 44
}

function desenharSelo(ctx: CanvasRenderingContext2D, cx: number, y: number, texto: string, cor: string) {
  const largura = larguraSelo(ctx, texto)
  const x = cx - largura / 2
  caminhoArredondado(ctx, x, y, largura, 38, 19)
  ctx.strokeStyle = cor
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = cor
  ctx.font = FONTE_SELO
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(texto.toUpperCase(), cx, y + 20)
  ctx.textBaseline = 'alphabetic'
}

// Selo alinhado pela borda direita (usado na tag de canto do cabeçalho, que fica a uma
// distância fixa da margem direita em vez de centralizado).
function desenharSeloAlinhadoDireita(ctx: CanvasRenderingContext2D, xDireita: number, y: number, texto: string, cor: string) {
  const largura = larguraSelo(ctx, texto)
  desenharSelo(ctx, xDireita - largura / 2, y, texto, cor)
}

async function desenharCabecalho(ctx: CanvasRenderingContext2D, marca: DadosMarcaFlyer, tagCanto?: string | null) {
  if (marca.logoUrl) {
    try {
      const logo = await carregarImagem(marca.logoUrl)
      const alturaLogo = 56
      const larguraLogo = (logo.width / logo.height) * alturaLogo
      ctx.drawImage(logo, 60, 40, larguraLogo, alturaLogo)
    } catch {
      desenharNomeEmpresa(ctx, marca.nomeEmpresa)
    }
  } else {
    desenharNomeEmpresa(ctx, marca.nomeEmpresa)
  }

  if (tagCanto) {
    desenharSeloAlinhadoDireita(ctx, LARGURA - 60, 55, tagCanto, 'rgba(255,255,255,0.55)')
  }
}

// Monta a linha "Rótulo  valor" centralizada — não dá pra confiar em espaços múltiplos numa
// única string (fontes variam de largura), então mede cada parte e desenha lado a lado.
function desenharLinhaContato(ctx: CanvasRenderingContext2D, y: number, rotulo: string, valor: string) {
  ctx.font = '600 24px "Flyer Corpo"'
  const larguraRotulo = ctx.measureText(rotulo).width
  ctx.font = '400 24px "Flyer Corpo"'
  const larguraValor = ctx.measureText(valor).width
  const espaco = 10
  const xInicio = LARGURA / 2 - (larguraRotulo + espaco + larguraValor) / 2

  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '600 24px "Flyer Corpo"'
  ctx.fillText(rotulo, xInicio, y)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '400 24px "Flyer Corpo"'
  ctx.fillText(valor, xInicio + larguraRotulo + espaco, y)
}

function desenharContato(ctx: CanvasRenderingContext2D, marca: DadosMarcaFlyer, yInicial: number): number {
  const linhas: [string, string][] = []
  if (marca.instagramUsername) linhas.push(['Instagram', `@${marca.instagramUsername}`])
  if (marca.telefone) linhas.push(['WhatsApp', marca.telefone])
  if (marca.site) linhas.push(['Site', marca.site])

  let y = yInicial
  for (const [rotulo, valor] of linhas) {
    desenharLinhaContato(ctx, y, rotulo, valor)
    y += 40
  }
  return y
}

function desenharFundo(ctx: CanvasRenderingContext2D) {
  const gradiente = ctx.createLinearGradient(0, 0, 0, ALTURA)
  gradiente.addColorStop(0, '#161616')
  gradiente.addColorStop(1, '#0A0A0A')
  ctx.fillStyle = gradiente
  ctx.fillRect(0, 0, LARGURA, ALTURA)
}

function canvasParaBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem do flyer.'))),
      'image/jpeg',
      0.92
    )
  })
}

export interface OpcoesFlyerPadrao {
  fotoUrl: string
  nomeProduto: string
  categoria?: string | null
  tagline?: string | null
  marca: DadosMarcaFlyer
}

export async function montarFlyerPadrao(opcoes: OpcoesFlyerPadrao): Promise<Blob> {
  await carregarFontes()
  const produto = await removerFundoRecortado(opcoes.fotoUrl)

  const canvas = document.createElement('canvas')
  canvas.width = LARGURA
  canvas.height = ALTURA
  const ctx = canvas.getContext('2d')!
  desenharFundo(ctx)
  await desenharCabecalho(ctx, opcoes.marca, opcoes.categoria)

  const tamanhoCard = 860
  const xCard = (LARGURA - tamanhoCard) / 2
  const yCard = 175
  desenharCardProduto(ctx, produto, xCard, yCard, tamanhoCard)

  let y = yCard + tamanhoCard + 95
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 50px "Flyer Display"'
  ctx.fillText(opcoes.nomeProduto, LARGURA / 2, y)

  if (opcoes.tagline) {
    y += 38
    ctx.font = '400 23px "Flyer Corpo"'
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.fillText(opcoes.tagline, LARGURA / 2, y)
  }

  y += 32
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(LARGURA / 2 - 60, y)
  ctx.lineTo(LARGURA / 2 + 60, y)
  ctx.stroke()

  desenharContato(ctx, opcoes.marca, y + 50)

  return canvasParaBlob(canvas)
}

export interface OpcoesFlyerAntesDepois {
  fotoUrlAntes: string
  fotoUrlDepois: string
  labelAntes?: string
  labelDepois?: string
  titulo: string
  subtitulo?: string | null
  tagCanto?: string | null
  marca: DadosMarcaFlyer
}

export async function montarFlyerAntesDepois(opcoes: OpcoesFlyerAntesDepois): Promise<Blob> {
  await carregarFontes()
  const [antes, depois] = await Promise.all([
    removerFundoRecortado(opcoes.fotoUrlAntes),
    removerFundoRecortado(opcoes.fotoUrlDepois),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = LARGURA
  canvas.height = ALTURA
  const ctx = canvas.getContext('2d')!
  desenharFundo(ctx)
  await desenharCabecalho(ctx, opcoes.marca, opcoes.tagCanto)

  const tamanhoCard = 430
  const espaco = 40
  const yCard = 175
  const x1 = (LARGURA - (tamanhoCard * 2 + espaco)) / 2
  const x2 = x1 + tamanhoCard + espaco

  desenharCardProduto(ctx, antes, x1, yCard, tamanhoCard)
  desenharCardProduto(ctx, depois, x2, yCard, tamanhoCard)

  const cx = LARGURA / 2
  const cy = yCard + tamanhoCard / 2
  ctx.beginPath()
  ctx.arc(cx, cy, 26, 0, Math.PI * 2)
  ctx.fillStyle = '#0A0A0A'
  ctx.fill()
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - 7, cy - 9)
  ctx.lineTo(cx + 7, cy)
  ctx.lineTo(cx - 7, cy + 9)
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()

  desenharSelo(ctx, x1 + tamanhoCard / 2, yCard + tamanhoCard + 25, opcoes.labelAntes ?? 'Antes', 'rgba(255,255,255,0.45)')
  desenharSelo(ctx, x2 + tamanhoCard / 2, yCard + tamanhoCard + 25, opcoes.labelDepois ?? 'Depois', '#FFFFFF')

  let y = yCard + tamanhoCard + 145
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 46px "Flyer Display"'
  for (const linha of opcoes.titulo.split('\n')) {
    ctx.fillText(linha, LARGURA / 2, y)
    y += 54
  }

  if (opcoes.subtitulo) {
    ctx.font = '400 22px "Flyer Corpo"'
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.fillText(opcoes.subtitulo, LARGURA / 2, y)
    y += 34
  } else {
    y += 14
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(LARGURA / 2 - 60, y)
  ctx.lineTo(LARGURA / 2 + 60, y)
  ctx.stroke()

  desenharContato(ctx, opcoes.marca, y + 50)

  return canvasParaBlob(canvas)
}
