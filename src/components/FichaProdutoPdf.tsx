import { formatPreco } from '@/lib/format'
import type { Produto, SubcategoriaProduto, FotoProduto, ProdutoItemIncluso, CampoPersonalizado } from '@/types'

export const MAX_FOTOS_FICHA_PDF = 10

function formatarValorCampo(campo: CampoPersonalizado, valor: string | number | boolean | null): string | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (campo.tipo === 'booleano') return valor ? 'Sim' : 'Não'
  if (campo.tipo === 'numero' && campo.unidade) return `${valor} ${campo.unidade}`
  return String(valor)
}

export default function FichaProdutoPdf({
  produto,
  subcategoria,
  fotos,
  itensInclusos,
  campos,
  incluirPreco,
  pageBreakAfter = false,
}: {
  produto: Produto
  subcategoria: SubcategoriaProduto | undefined
  fotos: FotoProduto[]
  itensInclusos: ProdutoItemIncluso[]
  campos: CampoPersonalizado[]
  incluirPreco: boolean
  pageBreakAfter?: boolean
}) {
  const vendidoComoEsta = subcategoria?.vendido_como_esta ?? false
  const requerMotor = subcategoria?.requer_motor ?? true
  const fotosDoProduto = fotos.slice(0, MAX_FOTOS_FICHA_PDF)
  const itensDoProduto = vendidoComoEsta ? itensInclusos : []

  return (
    <div
      className="space-y-4 p-10"
      style={{ pageBreakAfter: pageBreakAfter ? 'always' : 'auto', minHeight: '250mm' }}
    >
      {fotosDoProduto.length > 0 ? (
        <div>
          <div className="aspect-video overflow-hidden rounded-md bg-hull-900/[0.04]">
            <img
              src={fotosDoProduto[0].url_imagem}
              alt={produto.nome}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
          {fotosDoProduto.length > 1 && (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {fotosDoProduto.slice(1).map((f) => (
                <img
                  key={f.id}
                  src={f.url_imagem}
                  alt=""
                  className="aspect-square rounded-md object-cover"
                  crossOrigin="anonymous"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-md bg-hull-900/[0.04] text-sm text-slate-400">
          Sem fotos
        </div>
      )}

      <div>
        <h2 className="font-display text-2xl text-hull-900">
          {produto.nome}
          {produto.comprimento ? ` (${produto.comprimento}m)` : ''}
        </h2>
        {incluirPreco && (
          <p className="mt-1 font-mono text-lg text-hull-900">{formatPreco(produto.preco_base)}</p>
        )}
        {produto.descricao && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {produto.descricao}
          </p>
        )}
      </div>

      {vendidoComoEsta && (requerMotor || itensDoProduto.length > 0) && (
        <div className="rounded-md border border-foam-200 p-4">
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
          {itensDoProduto.length > 0 && (
            <div className={requerMotor ? 'mt-3 border-t border-foam-200 pt-3' : ''}>
              <p className="mb-1.5 text-xs font-medium text-hull-900">Itens inclusos</p>
              <ul className="space-y-1 text-xs text-slate-500">
                {itensDoProduto.map((item) => (
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
        <div className="rounded-md border border-foam-200 p-4">
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
    </div>
  )
}
