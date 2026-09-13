import { formatPreco } from '@/lib/format'
import type {
  Produto,
  SubcategoriaProduto,
  FotoProduto,
  ProdutoItemIncluso,
  CampoPersonalizado,
  EmpresaConfig,
} from '@/types'

export const MAX_FOTOS_FICHA_PDF = 20

function formatarValorCampo(
  campo: CampoPersonalizado,
  valor: string | number | boolean | null
): string | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (campo.tipo === 'booleano') return valor ? 'Sim' : 'Não'
  if (campo.tipo === 'numero' && campo.unidade) return `${valor} ${campo.unidade}`
  return String(valor)
}

// ─── ESTILOS ─────────────────────────────────────────────────────────────────
// Regra fundamental para html2pdf: NUNCA usar height em mm/% em imagens.
// Usar width:100% + aspect-ratio para deixar o browser calcular a altura.
// pageBreakAfter:'always' num div vazio força quebra de página confiável.

const PAGE_W = '190mm' // largura útil A4 com margens de 10mm

const S: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
    background: '#fff',
    color: '#0f172a',
    width: PAGE_W,
    margin: '0 auto',
  },

  // ── CAPA ──────────────────────────────────────────────────────────────────
  capaWrap: {
    position: 'relative',
    width: '100%',
    background: '#0f172a',
    pageBreakAfter: 'always',
    overflow: 'hidden',
  },
  capaImg: {
    display: 'block',
    width: '100%',
    // aspect-ratio mantém proporção real sem distorcer
    maxHeight: '160mm',
    objectFit: 'cover',
    objectPosition: 'center center',
  },
  capaOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    maxHeight: '160mm',
    background: 'linear-gradient(to bottom,rgba(0,0,0,.06) 0%,rgba(0,0,0,.55) 100%)',
    pointerEvents: 'none',
  },
  fabricanteLogo: {
    position: 'absolute',
    top: 14,
    left: 14,
    maxHeight: 44,
    maxWidth: 110,
    objectFit: 'contain',
    background: 'rgba(255,255,255,.92)',
    borderRadius: 7,
    padding: '5px 9px',
    boxShadow: '0 2px 8px rgba(0,0,0,.2)',
  },
  empresaLogo: {
    position: 'absolute',
    top: 14,
    right: 14,
    maxHeight: 34,
    maxWidth: 100,
    objectFit: 'contain',
  },
  capaTexto: {
    position: 'absolute',
    bottom: 72,
    left: 28,
    right: 28,
  },
  capaTitulo: {
    fontFamily: "'Georgia','Times New Roman',serif",
    fontSize: 32,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    lineHeight: 1.1,
    textShadow: '0 2px 10px rgba(0,0,0,.4)',
  },
  capaSubtitulo: {
    fontSize: 12,
    color: 'rgba(255,255,255,.75)',
    marginTop: 6,
  },
  capaBar: {
    background: '#0f172a',
    padding: '14px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capaPrecoLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,.45)',
    marginBottom: 3,
  },
  capaPreco: {
    fontFamily: "'Georgia','Times New Roman',serif",
    fontSize: 26,
    fontWeight: 700,
    color: '#fff',
  },
  capaContato: {
    textAlign: 'right' as const,
    fontSize: 10,
    color: 'rgba(255,255,255,.55)',
    lineHeight: 1.6,
  },

  // ── CONTEÚDO ──────────────────────────────────────────────────────────────
  secao: {
    padding: '20px 28px',
    pageBreakInside: 'avoid' as const,
  },
  secaoLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 7,
    marginBottom: 12,
  },
  specGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1px',
    background: '#e5e7eb',
    border: '1px solid #e5e7eb',
    borderRadius: 7,
    overflow: 'hidden',
  },
  specCell: {
    background: '#fff',
    padding: '9px 13px',
  },
  specCellAlt: {
    background: '#f9fafb',
    padding: '9px 13px',
  },
  specLabel: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#9ca3af',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#0f172a',
  },
  descricao: {
    fontSize: 13,
    lineHeight: 1.75,
    color: '#374151',
    textAlign: 'justify' as const,
    whiteSpace: 'pre-wrap' as const,
  },
  itensGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '5px 20px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 7,
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.4,
  },
  itemDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#0f172a',
    flexShrink: 0,
    marginTop: 5,
  },
  precoBox: {
    background: '#0f172a',
    borderRadius: 9,
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '0 28px 24px',
  },
  precoLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,.45)',
    marginBottom: 3,
  },
  precoValor: {
    fontFamily: "'Georgia','Times New Roman',serif",
    fontSize: 26,
    fontWeight: 700,
    color: '#fff',
  },

  // ── FOTOS ADICIONAIS ──────────────────────────────────────────────────────
  // Cada foto individual ocupa página inteira — width 100%, sem height fixo
  fotoFullWrap: {
    width: '100%',
    pageBreakAfter: 'always' as const,
    pageBreakInside: 'avoid' as const,
    overflow: 'hidden',
    background: '#f8fafc',
  },
  fotoFull: {
    display: 'block',
    width: '100%',
    objectFit: 'contain' as const,
    objectPosition: 'center center',
    maxHeight: '270mm',
  },

  // ── GALERIA (grid 2 col) ──────────────────────────────────────────────────
  galeriaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  galeriaImg: {
    display: 'block',
    width: '100%',
    objectFit: 'contain' as const,
    objectPosition: 'center',
    background: '#f8fafc',
    borderRadius: 5,
    aspectRatio: '4/3',
  },

  // ── RODAPÉ ────────────────────────────────────────────────────────────────
  rodape: {
    borderTop: '1px solid #e5e7eb',
    padding: '12px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#9ca3af',
  },
}

// Div invisível para forçar quebra de página no html2pdf
function PageBreak() {
  return <div style={{ pageBreakAfter: 'always', height: 1, overflow: 'hidden' }} />
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function FichaProdutoPdf({
  produto,
  subcategoria,
  fotos,
  itensInclusos,
  campos,
  incluirPreco,
  pageBreakAfter = false,
  empresa,
}: {
  produto: Produto
  subcategoria: SubcategoriaProduto | undefined
  fotos: FotoProduto[]
  itensInclusos: ProdutoItemIncluso[]
  campos: CampoPersonalizado[]
  incluirPreco: boolean
  pageBreakAfter?: boolean
  empresa?: Pick<EmpresaConfig, 'nome_empresa' | 'logo_url' | 'telefone' | 'email'> | null
}) {
  const vendidoComoEsta = subcategoria?.vendido_como_esta ?? false
  const requerMotor = subcategoria?.requer_motor ?? true
  const mostrarMotor = vendidoComoEsta && requerMotor

  const todasFotos = fotos.slice(0, MAX_FOTOS_FICHA_PDF)
  const fotoCapa   = todasFotos[0] ?? null
  const foto2      = todasFotos[1] ?? null
  const foto3      = todasFotos[2] ?? null
  const fotosGaleria = todasFotos.slice(3)

  // Specs técnicas
  const specs: { label: string; value: string }[] = []
  if (produto.marca) specs.push({ label: 'Fabricante', value: produto.marca })
  if (produto.comprimento) specs.push({ label: 'Comprimento', value: `${produto.comprimento} m` })
  if (produto.ano) specs.push({ label: 'Ano', value: String(produto.ano) })
  if (mostrarMotor) {
    if (produto.motorizacao_tipo)         specs.push({ label: 'Motorização',  value: produto.motorizacao_tipo })
    if (produto.motorizacao_potencia)     specs.push({ label: 'Potência',     value: produto.motorizacao_potencia })
    if (produto.motorizacao_marca_modelo) specs.push({ label: 'Motor',        value: produto.motorizacao_marca_modelo })
    if (produto.combustivel)              specs.push({ label: 'Combustível',  value: produto.combustivel })
    if (produto.horas_uso)                specs.push({ label: 'Horas de uso', value: produto.horas_uso })
    if (produto.ultima_revisao)           specs.push({ label: 'Últ. revisão', value: produto.ultima_revisao })
  }
  const camposComValor = campos
    .map((c) => ({ label: c.nome, value: formatarValorCampo(c, produto.atributos?.[c.id] ?? null) }))
    .filter((c): c is { label: string; value: string } => c.value !== null)
  const todasSpecs = [...specs, ...camposComValor]

  const subtitulo = mostrarMotor
    ? [produto.motorizacao_tipo, produto.motorizacao_potencia, produto.combustivel].filter(Boolean).join(' · ')
    : subcategoria?.nome ?? ''

  const contato = [empresa?.telefone, empresa?.email].filter(Boolean).join('  ·  ')
  const dataAtual = new Date().toLocaleDateString('pt-BR')

  const temConteudo = todasSpecs.length > 0 || !!produto.descricao || itensInclusos.length > 0

  return (
    <div style={{ ...S.root, pageBreakAfter: pageBreakAfter ? 'always' : 'auto' }}>

      {/* ── PÁGINA 1: CAPA ─────────────────────────────────────────────────── */}
      <div style={S.capaWrap}>
        {/* Imagem principal */}
        {fotoCapa
          ? <img src={fotoCapa.url_imagem} alt={produto.nome} style={S.capaImg} crossOrigin="anonymous" />
          : <div style={{ ...S.capaImg, height: '120mm', background: '#1e293b' }} />
        }
        {/* Overlay */}
        <div style={{ ...S.capaOverlay, bottom: 0 }} />

        {/* Logo fabricante — canto sup esquerdo */}
        {produto.fabricante_logo_url && (
          <img src={produto.fabricante_logo_url} alt={produto.marca ?? ''} style={S.fabricanteLogo} crossOrigin="anonymous" />
        )}
        {/* Logo empresa — canto sup direito */}
        {empresa?.logo_url && (
          <img src={empresa.logo_url} alt={empresa.nome_empresa ?? ''} style={S.empresaLogo} crossOrigin="anonymous" />
        )}
        {/* Título sobre a foto */}
        <div style={S.capaTexto}>
          <h1 style={S.capaTitulo}>{produto.nome}</h1>
          {subtitulo && <p style={S.capaSubtitulo}>{subtitulo}</p>}
        </div>
        {/* Barra inferior escura */}
        <div style={S.capaBar}>
          <div>
            {incluirPreco && (
              <>
                <div style={S.capaPrecoLabel}>Valor</div>
                <div style={S.capaPreco}>{formatPreco(produto.preco_base)}</div>
              </>
            )}
          </div>
          <div style={S.capaContato}>
            {empresa?.nome_empresa && <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.9)', marginBottom: 2 }}>{empresa.nome_empresa}</div>}
            {contato && <div>{contato}</div>}
            <div style={{ marginTop: 3, color: 'rgba(255,255,255,.3)' }}>{dataAtual}</div>
          </div>
        </div>
      </div>

      {/* ── PÁGINA 2: FICHA TÉCNICA + DESCRIÇÃO + ITENS + PREÇO ────────────── */}
      {temConteudo && (
        <>
          {/* Specs */}
          {todasSpecs.length > 0 && (
            <div style={S.secao}>
              <div style={S.secaoLabel}>Ficha técnica</div>
              <div style={S.specGrid}>
                {todasSpecs.map((s, i) => (
                  <div key={s.label} style={i % 2 === 0 ? S.specCell : S.specCellAlt}>
                    <div style={S.specLabel}>{s.label}</div>
                    <div style={S.specValue}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descrição */}
          {produto.descricao && (
            <div style={S.secao}>
              <div style={S.secaoLabel}>Sobre o produto</div>
              <p style={S.descricao}>{produto.descricao}</p>
            </div>
          )}

          {/* Itens inclusos */}
          {itensInclusos.length > 0 && (
            <div style={S.secao}>
              <div style={S.secaoLabel}>Itens inclusos</div>

              {/* Com logo — cards 3 colunas */}
              {itensInclusos.some((it) => it.logo_url) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                  {itensInclusos.filter((it) => it.logo_url).map((item) => (
                    <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: '10px 12px', background: '#f9fafb' }}>
                      <img src={item.logo_url!} alt={item.marca ?? item.nome} crossOrigin="anonymous" style={{ height: 28, maxWidth: 80, objectFit: 'contain', objectPosition: 'left', marginBottom: 6 }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                        {item.nome}{item.quantidade && item.quantidade > 1 ? ` (×${item.quantidade})` : ''}
                      </div>
                      {item.marca && <div style={{ fontSize: 10, color: '#6b7280' }}>{item.marca}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Sem logo — lista */}
              {itensInclusos.some((it) => !it.logo_url) && (
                <div style={S.itensGrid}>
                  {itensInclusos.filter((it) => !it.logo_url).map((item) => (
                    <div key={item.id} style={S.itemRow}>
                      <div style={S.itemDot} />
                      <span>
                        <span style={{ fontWeight: 600 }}>{item.nome}</span>
                        {item.quantidade && item.quantidade > 1 ? ` (×${item.quantidade})` : ''}
                        {item.marca ? <span style={{ color: '#6b7280' }}> · {item.marca}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Caixa de preço */}
          {incluirPreco && (
            <div style={S.precoBox}>
              <div>
                <div style={S.precoLabel}>Valor total</div>
                <div style={S.precoValor}>{formatPreco(produto.preco_base)}</div>
              </div>
              {empresa?.nome_empresa && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>{empresa.nome_empresa}</div>
                  {contato && <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{contato}</div>}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── FOTOS 2 e 3 — cada uma em página separada ──────────────────────── */}
      {foto2 && (
        <>
          <PageBreak />
          <div style={S.fotoFullWrap}>
            <img src={foto2.url_imagem} alt="" style={S.fotoFull} crossOrigin="anonymous" />
          </div>
        </>
      )}
      {foto3 && (
        <>
          <PageBreak />
          <div style={S.fotoFullWrap}>
            <img src={foto3.url_imagem} alt="" style={S.fotoFull} crossOrigin="anonymous" />
          </div>
        </>
      )}

      {/* ── GALERIA — grid 2 colunas, 2 fotos por linha ─────────────────────── */}
      {fotosGaleria.length > 0 && (
        <>
          <PageBreak />
          <div style={{ ...S.secao, paddingTop: 24 }}>
            <div style={S.secaoLabel}>Galeria de fotos</div>
            <div style={S.galeriaGrid}>
              {fotosGaleria.map((f) => (
                <img key={f.id} src={f.url_imagem} alt="" style={S.galeriaImg} crossOrigin="anonymous" />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── RODAPÉ ───────────────────────────────────────────────────────────── */}
      <div style={S.rodape}>
        <span>{empresa?.nome_empresa ?? ''}{contato ? ` · ${contato}` : ''}</span>
        <span>Documento gerado em {dataAtual}</span>
      </div>

    </div>
  )
}
