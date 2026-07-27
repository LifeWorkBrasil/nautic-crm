import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Anchor, MessageCircle, Building2, Youtube } from 'lucide-react'
import {
  getLinkPublicoProduto,
  getProdutoPublico,
  getSubcategoriaPublica,
  getEmpresaPublica,
  listFotosProduto,
  listVideosProduto,
  listItensInclusosProduto,
  listCamposPersonalizadosPublico,
} from '@/lib/api'
import { formatPreco } from '@/lib/format'
import { linkWhatsapp } from '@/lib/whatsapp'
import type {
  Produto,
  SubcategoriaProduto,
  FotoProduto,
  VideoProduto,
  ProdutoItemIncluso,
  CampoPersonalizado,
  EmpresaConfig,
} from '@/types'

function formatarValorCampo(campo: CampoPersonalizado, valor: string | number | boolean | null): string | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (campo.tipo === 'booleano') return valor ? 'Sim' : 'Não'
  if (campo.tipo === 'numero' && campo.unidade) return `${valor} ${campo.unidade}`
  return String(valor)
}

type Estado = 'carregando' | 'invalido' | 'ok'

export default function ProdutoPublico() {
  const { linkId } = useParams<{ linkId: string }>()
  const [estado, setEstado] = useState<Estado>('carregando')
  const [produto, setProduto] = useState<Produto | null>(null)
  const [subcategoria, setSubcategoria] = useState<SubcategoriaProduto | null>(null)
  const [empresa, setEmpresa] = useState<Pick<EmpresaConfig, 'id' | 'nome_empresa' | 'logo_url' | 'telefone'> | null>(
    null
  )
  const [fotos, setFotos] = useState<FotoProduto[]>([])
  const [videos, setVideos] = useState<VideoProduto[]>([])
  const [itensInclusos, setItensInclusos] = useState<ProdutoItemIncluso[]>([])
  const [campos, setCampos] = useState<CampoPersonalizado[]>([])
  const [fotoAtivaIdx, setFotoAtivaIdx] = useState(0)
  const [expiraEm, setExpiraEm] = useState<string | null>(null)

  useEffect(() => {
    if (!linkId) {
      setEstado('invalido')
      return
    }
    let cancelado = false
    async function carregar() {
      try {
        const link = await getLinkPublicoProduto(linkId!)
        if (!link) {
          if (!cancelado) setEstado('invalido')
          return
        }
        const [produtoData, emp, fotosData, videosData] = await Promise.all([
          getProdutoPublico(link.produto_id),
          getEmpresaPublica(link.empresa_id),
          listFotosProduto(link.produto_id),
          listVideosProduto(link.produto_id),
        ])
        if (!produtoData) {
          if (!cancelado) setEstado('invalido')
          return
        }
        const [sub, todosCampos] = await Promise.all([
          produtoData.subcategoria_id ? getSubcategoriaPublica(produtoData.subcategoria_id) : null,
          listCamposPersonalizadosPublico(link.empresa_id),
        ])
        const itens = sub?.vendido_como_esta ? await listItensInclusosProduto(link.produto_id) : []

        if (cancelado) return
        setProduto(produtoData)
        setSubcategoria(sub)
        setEmpresa(emp)
        setFotos(fotosData)
        setVideos(videosData)
        setItensInclusos(itens)
        setCampos(
          todosCampos.filter(
            (c) => c.categoria_id === (sub?.categoria_id ?? null) || (produtoData.grupo_id && c.grupo_id === produtoData.grupo_id)
          )
        )
        setExpiraEm(link.expira_em)
        setEstado('ok')
      } catch {
        if (!cancelado) setEstado('invalido')
      }
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [linkId])

  if (estado === 'carregando') {
    return <div className="flex min-h-screen items-center justify-center bg-foam-100 text-sm text-slate-400">Carregando…</div>
  }

  if (estado === 'invalido' || !produto) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foam-100 p-8">
        <div className="max-w-sm rounded-md border border-foam-200 bg-white p-6 text-center">
          <Anchor className="mx-auto mb-3 h-6 w-6 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-hull-900">Este link não existe mais ou já expirou.</p>
          <p className="mt-1.5 text-xs text-slate-400">Peça um novo link para quem te enviou.</p>
        </div>
      </div>
    )
  }

  const vendidoComoEsta = subcategoria?.vendido_como_esta ?? false
  const requerMotor = subcategoria?.requer_motor ?? true
  const fotoAtiva = fotos[fotoAtivaIdx] ?? fotos[0]

  return (
    <div className="min-h-screen bg-foam-100 pb-16">
      <header className="flex items-center gap-3 border-b border-foam-200 bg-white px-6 py-4">
        {empresa?.logo_url ? (
          <img src={empresa.logo_url} alt={empresa.nome_empresa} className="h-9 w-9 object-contain" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-hull-900/[0.06] text-slate-400">
            <Building2 className="h-4 w-4" strokeWidth={1.5} />
          </div>
        )}
        <p className="font-display text-lg text-hull-900">{empresa?.nome_empresa ?? 'Catálogo'}</p>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <div>
          {fotos.length > 0 ? (
            <div>
              <div className="aspect-video overflow-hidden rounded-md bg-hull-900/[0.04]">
                <img src={fotoAtiva.url_imagem} alt={produto.nome} className="h-full w-full object-cover" />
              </div>
              {fotos.length > 1 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto">
                  {fotos.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => setFotoAtivaIdx(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
                        i === fotoAtivaIdx ? 'border-wake-400' : 'border-transparent'
                      }`}
                    >
                      <img src={f.url_imagem} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-md bg-hull-900/[0.04] text-sm text-slate-400">
              Sem fotos
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl text-hull-900">
            {produto.nome}
            {produto.comprimento ? ` (${produto.comprimento}m)` : ''}
          </h1>
          <p className="mt-1 font-mono text-lg text-hull-900">{formatPreco(produto.preco_base)}</p>
          {produto.descricao && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{produto.descricao}</p>
          )}
        </div>

        {vendidoComoEsta && (requerMotor || itensInclusos.length > 0) && (
          <div className="rounded-md border border-foam-200 bg-white p-4">
            {requerMotor && (
              <>
                <p className="mb-2 text-sm font-medium text-hull-900">Dados do checklist</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {produto.ano && (
                    <>
                      <dt className="text-slate-400">Ano</dt>
                      <dd className="text-hull-900">{produto.ano}</dd>
                    </>
                  )}
                  {produto.motorizacao_tipo && (
                    <>
                      <dt className="text-slate-400">Motorização</dt>
                      <dd className="text-hull-900">{produto.motorizacao_tipo}</dd>
                    </>
                  )}
                  {produto.motorizacao_potencia && (
                    <>
                      <dt className="text-slate-400">Potência</dt>
                      <dd className="text-hull-900">{produto.motorizacao_potencia}</dd>
                    </>
                  )}
                  {produto.motorizacao_marca_modelo && (
                    <>
                      <dt className="text-slate-400">Marca/modelo do motor</dt>
                      <dd className="text-hull-900">{produto.motorizacao_marca_modelo}</dd>
                    </>
                  )}
                  {produto.combustivel && (
                    <>
                      <dt className="text-slate-400">Combustível</dt>
                      <dd className="text-hull-900">{produto.combustivel}</dd>
                    </>
                  )}
                  {produto.horas_uso && (
                    <>
                      <dt className="text-slate-400">Horas de uso</dt>
                      <dd className="text-hull-900">{produto.horas_uso}</dd>
                    </>
                  )}
                  {produto.ultima_revisao && (
                    <>
                      <dt className="text-slate-400">Última revisão</dt>
                      <dd className="text-hull-900">{produto.ultima_revisao}</dd>
                    </>
                  )}
                </dl>
              </>
            )}
            {itensInclusos.length > 0 && (
              <div className={requerMotor ? 'mt-3 border-t border-foam-200 pt-3' : ''}>
                <p className="mb-1.5 text-xs font-medium text-hull-900">Itens inclusos</p>
                <ul className="space-y-1 text-xs text-slate-500">
                  {itensInclusos.map((item) => (
                    <li key={item.id}>
                      {item.nome}
                      {item.descricao ? ` — ${item.descricao}` : ''}
                      {item.quantidade ? ` (x${item.quantidade})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {campos.length > 0 && (
          <div className="rounded-md border border-foam-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-hull-900">Informações adicionais</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {campos.map((campo) => {
                const valorFormatado = formatarValorCampo(campo, produto.atributos?.[campo.id] ?? null)
                if (valorFormatado === null) return null
                return (
                  <div key={campo.id} className="contents">
                    <dt className="text-slate-400">{campo.nome}</dt>
                    <dd className="text-hull-900">{valorFormatado}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        )}

        {videos.length > 0 && (
          <div className="rounded-md border border-foam-200 bg-white p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-hull-900">
              <Youtube className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              Vídeos
            </p>
            <ul className="space-y-1.5">
              {videos.map((v) => (
                <li key={v.id}>
                  <a
                    href={v.url_youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-wake-500 hover:text-wake-600"
                  >
                    {v.url_youtube}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {empresa?.telefone && (
          <a
            href={linkWhatsapp(empresa.telefone)}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-2 rounded-md bg-signal-green px-4 py-2.5 text-sm font-medium text-foam-50 hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
            Falar no WhatsApp
          </a>
        )}

        {expiraEm && (
          <p className="text-center text-[11px] text-slate-400">
            Link válido até {new Date(expiraEm).toLocaleDateString('pt-BR')}
          </p>
        )}
      </main>
    </div>
  )
}
