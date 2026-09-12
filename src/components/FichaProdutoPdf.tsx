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

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────

function formatarValorCampo(
  campo: CampoPersonalizado,
  valor: string | number | boolean | null
): string | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (campo.tipo === 'booleano') return valor ? 'Sim' : 'Não'
  if (campo.tipo === 'numero' && campo.unidade) return `${valor} ${campo.unidade}`
  return String(valor)
}

// ─── ESTILOS INLINE (compatível com html2pdf / print) ────────────────────────

const S = {
  page: {
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    background: '#ffffff',
    color: '#0f172a',
    WebkitFontSmoothing: 'antialiased',
  } as React.CSSProperties,

  // Capa / foto hero — página inteira
  heroWrap: {
    position: 'relative',
    width: '100%',
    height: '230mm',
    overflow: 'hidden',
    background: '#0f172a',
    pageBreakAfter: 'always',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,

  heroImg: {
    width: '100%',
    height: '170mm',
    objectFit: 'cover',
    display: 'block',
    flexShrink: 0,
  } as React.CSSProperties,

  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '170mm',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
  } as React.CSSProperties,

  heroBadge: {
    position: 'absolute',
    top: 24,
    left: 32,
    background: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#fff',
  } as React.CSSProperties,

  heroLogo: {
    position: 'absolute',
    top: 18,
    right: 28,
    height: 36,
    objectFit: 'contain',
  } as React.CSSProperties,

  heroContent: {
    position: 'absolute',
    bottom: '62mm',
    left: 32,
    right: 32,
  } as React.CSSProperties,

  heroTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: 36,
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.1,
    margin: 0,
    textShadow: '0 2px 12px rgba(0,0,0,0.4)',
  } as React.CSSProperties,

  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 8,
    lineHeight: 1.5,
  } as React.CSSProperties,

  heroBottom: {
    flex: 1,
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
  } as React.CSSProperties,

  heroPrice: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: 28,
    fontWeight: 700,
    color: '#ffffff',
  } as React.CSSProperties,

  heroContact: {
    textAlign: 'right' as const,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.6,
  } as React.CSSProperties,

  // Seção de conteúdo
  section: {
    padding: '28px 32px',
    pageBreakInside: 'avoid' as const,
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: '#6b7280',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,

  // Grid de especificações
  specGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1px',
    background: '#e5e7eb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  } as React.CSSProperties,

  specCell: {
    background: '#ffffff',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  } as React.CSSProperties,

  specCellAlt: {
    background: '#f9fafb',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  } as React.CSSProperties,

  specLabel: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#9ca3af',
  } as React.CSSProperties,

  specValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#0f172a',
  } as React.CSSProperties,

  // Descrição
  descricao: {
    fontSize: 13,
    lineHeight: 1.75,
    color: '#374151',
    textAlign: 'justify' as const,
    whiteSpace: 'pre-wrap' as const,
  } as React.CSSProperties,

  // Itens inclusos
  itensGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px 24px',
  } as React.CSSProperties,

  itemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.4,
  } as React.CSSProperties,

  itemDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#0f172a',
    flexShrink: 0,
    marginTop: 5,
  } as React.CSSProperties,

  // Foto secundária — página inteira
  fotoFullPage: {
    width: '100%',
    height: '260mm',
    objectFit: 'cover',
    display: 'block',
    pageBreakAfter: 'always',
    pageBreakInside: 'avoid',
  } as React.CSSProperties,

  // Grid de fotos pequenas
  fotosGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    pageBreakInside: 'avoid' as const,
  } as React.CSSProperties,

  fotoGridItem: {
    width: '100%',
    aspectRatio: '4/3',
    objectFit: 'cover' as const,
    borderRadius: 6,
    display: 'block',
  } as React.CSSProperties,

  // Rodapé
  rodape: {
    borderTop: '1px solid #e5e7eb',
    padding: '14px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 10,
    color: '#9ca3af',
  } as React.CSSProperties,

  // Caixa de preço no corpo
  precoBox: {
    background: '#0f172a',
    borderRadius: 10,
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '0 32px 28px',
  } as React.CSSProperties,

  precoLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
  } as React.CSSProperties,

  precoValor: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: 30,
    fontWeight: 700,
    color: '#ffffff',
  } as React.CSSProperties,
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
  const fotoCapa = todasFotos[0] ?? null
  // Fotos 2 e 3 → full page; restantes → grid 2 colunas
  const foto2 = todasFotos[1] ?? null
  const foto3 = todasFotos[2] ?? null
  const fotosGrid = todasFotos.slice(3)

  // Especificações técnicas
  const specs: { label: string; value: string }[] = []
  if (produto.comprimento) specs.push({ label: 'Comprimento', value: `${produto.comprimento} m` })
  if (produto.ano) specs.push({ label: 'Ano', value: String(produto.ano) })
  if (mostrarMotor) {
    if (produto.motorizacao_tipo) specs.push({ label: 'Motorização', value: produto.motorizacao_tipo })
    if (produto.motorizacao_potencia) specs.push({ label: 'Potência', value: produto.motorizacao_potencia })
    if (produto.motorizacao_marca_modelo) specs.push({ label: 'Motor', value: produto.motorizacao_marca_modelo })
    if (produto.combustivel) specs.push({ label: 'Combustível', value: produto.combustivel })
    if (produto.horas_uso) specs.push({ label: 'Horas de uso', value: produto.horas_uso })
    if (produto.ultima_revisao) specs.push({ label: 'Última revisão', value: produto.ultima_revisao })
  }

  // Campos personalizados
  const camposComValor = campos
    .map((c) => ({
      label: c.nome,
      value: formatarValorCampo(c, produto.atributos?.[c.id] ?? null),
    }))
    .filter((c): c is { label: string; value: string } => c.value !== null)

  const todasSpecs = [...specs, ...camposComValor]

  const subtitulo = mostrarMotor
    ? [produto.motorizacao_tipo, produto.motorizacao_potencia, produto.combustivel]
        .filter(Boolean)
        .join(' · ')
    : subcategoria?.nome ?? ''

  const contatoEmpresa = [empresa?.telefone, empresa?.email].filter(Boolean).join('  ·  ')
  const dataAtual = new Date().toLocaleDateString('pt-BR')

  const wrapStyle: React.CSSProperties = {
    ...S.page,
    pageBreakAfter: pageBreakAfter ? 'always' : 'auto',
  }

  return (
    <div style={wrapStyle}>

      {/* ── PÁGINA 1: CAPA COM FOTO HERO ─────────────────────────────────── */}
      <div style={S.heroWrap}>
        {/* Imagem hero */}
        {fotoCapa ? (
          <img
            src={fotoCapa.url_imagem}
            alt={produto.nome}
            style={S.heroImg}
            crossOrigin="anonymous"
          />
        ) : (
          <div style={{ ...S.heroImg, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 48 }}>⛵</span>
          </div>
        )}

        {/* Overlay gradiente */}
        <div style={S.heroOverlay} />

        {/* Badge seminovo/novo */}
        <div style={S.heroBadge}>
          {vendidoComoEsta ? 'Seminovo' : 'Novo'}
        </div>

        {/* Logo da empresa */}
        {empresa?.logo_url && (
          <img
            src={empresa.logo_url}
            alt={empresa.nome_empresa ?? ''}
            style={S.heroLogo}
            crossOrigin="anonymous"
          />
        )}

        {/* Nome e subtítulo sobre a foto */}
        <div style={S.heroContent}>
          <h1 style={S.heroTitle}>{produto.nome}</h1>
          {subtitulo && <p style={S.heroSubtitle}>{subtitulo}</p>}
        </div>

        {/* Barra inferior escura com preço e contato */}
        <div style={S.heroBottom}>
          <div>
            {incluirPreco && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
                  Valor
                </div>
                <div style={S.heroPrice}>{formatPreco(produto.preco_base)}</div>
              </>
            )}
            {!incluirPreco && empresa?.nome_empresa && (
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{empresa.nome_empresa}</div>
            )}
          </div>
          <div style={S.heroContact}>
            {empresa?.nome_empresa && (
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: 3 }}>
                {empresa.nome_empresa}
              </div>
            )}
            {contatoEmpresa && <div>{contatoEmpresa}</div>}
            <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.35)' }}>{dataAtual}</div>
          </div>
        </div>
      </div>

      {/* ── PÁGINA 2: SPECS + DESCRIÇÃO + ITENS ──────────────────────────── */}

      {/* Especificações técnicas */}
      {todasSpecs.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionLabel}>Ficha técnica</div>
          <div style={S.specGrid}>
            {todasSpecs.map((s, i) => (
              <div key={s.label} style={i % 2 === 0 ? S.specCell : S.specCellAlt}>
                <span style={S.specLabel}>{s.label}</span>
                <span style={S.specValue}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descrição */}
      {produto.descricao && (
        <div style={S.section}>
          <div style={S.sectionLabel}>Sobre o produto</div>
          <p style={S.descricao}>{produto.descricao}</p>
        </div>
      )}

      {/* Itens inclusos */}
      {itensInclusos.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionLabel}>Itens inclusos</div>
          <div style={S.itensGrid}>
            {itensInclusos.map((item) => (
              <div key={item.id} style={S.itemRow}>
                <div style={S.itemDot} />
                <span>
                  {item.nome}
                  {item.quantidade && item.quantidade > 1 ? ` (×${item.quantidade})` : ''}
                  {item.descricao ? <span style={{ color: '#6b7280' }}> — {item.descricao}</span> : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Caixa de preço no corpo (quando há conteúdo na pág 2) */}
      {incluirPreco && (todasSpecs.length > 0 || produto.descricao || itensInclusos.length > 0) && (
        <div style={S.precoBox}>
          <div>
            <div style={S.precoLabel}>Valor total</div>
            <div style={S.precoValor}>{formatPreco(produto.preco_base)}</div>
          </div>
          {empresa?.nome_empresa && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{empresa.nome_empresa}</div>
              {contatoEmpresa && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>{contatoEmpresa}</div>}
            </div>
          )}
        </div>
      )}

      {/* ── FOTOS ADICIONAIS — uma por página (full bleed) ────────────────── */}
      {foto2 && (
        <img
          src={foto2.url_imagem}
          alt=""
          style={S.fotoFullPage}
          crossOrigin="anonymous"
        />
      )}
      {foto3 && (
        <img
          src={foto3.url_imagem}
          alt=""
          style={S.fotoFullPage}
          crossOrigin="anonymous"
        />
      )}

      {/* ── GRID DE FOTOS RESTANTES (2 colunas) ─────────────────────────── */}
      {fotosGrid.length > 0 && (
        <div style={{ padding: '28px 32px', pageBreakBefore: 'always' }}>
          <div style={S.sectionLabel}>Galeria de fotos</div>
          <div style={S.fotosGrid}>
            {fotosGrid.map((f) => (
              <img
                key={f.id}
                src={f.url_imagem}
                alt=""
                style={S.fotoGridItem}
                crossOrigin="anonymous"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── RODAPÉ ────────────────────────────────────────────────────────── */}
      <div style={S.rodape}>
        <span>
          {empresa?.nome_empresa ?? ''}{contatoEmpresa ? ` · ${contatoEmpresa}` : ''}
        </span>
        <span>Documento gerado em {dataAtual}</span>
      </div>

    </div>
  )
}
