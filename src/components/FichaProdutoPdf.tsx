import { formatPreco } from '@/lib/format'
import type {
  Produto,
  SubcategoriaProduto,
  FotoProduto,
  ProdutoItemIncluso,
  CampoPersonalizado,
  EmpresaConfig,
} from '@/types'

export const MAX_FOTOS_FICHA_PDF = 10

function formatarValorCampo(campo: CampoPersonalizado, valor: string | number | boolean | null): string | null {
  if (valor === null || valor === undefined || valor === '') return null
  if (campo.tipo === 'booleano') return valor ? 'Sim' : 'Não'
  if (campo.tipo === 'numero' && campo.unidade) return `${valor} ${campo.unidade}`
  return String(valor)
}

function TabelaFicha({ linhas }: { linhas: [string, string][] }) {
  return (
    <table className="w-full overflow-hidden rounded-md border border-foam-200 text-xs">
      <tbody>
        {linhas.map(([label, valor], i) => (
          <tr key={label} className={i % 2 === 0 ? 'bg-foam-100' : 'bg-white'}>
            <th className="w-1/2 border-b border-foam-200 px-3 py-2 text-left font-semibold uppercase tracking-wide text-hull-900">
              {label}
            </th>
            <td className="border-b border-foam-200 px-3 py-2 text-slate-600">{valor}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

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
  empresa?: Pick<EmpresaConfig, 'nome_empresa' | 'telefone' | 'email'> | null
}) {
  const vendidoComoEsta = subcategoria?.vendido_como_esta ?? false
  const requerMotor = subcategoria?.requer_motor ?? true
  const fotosDoProduto = fotos.slice(0, MAX_FOTOS_FICHA_PDF)
  const itensDoProduto = vendidoComoEsta ? itensInclusos : []
  const mostrarMotor = vendidoComoEsta && requerMotor

  const especificacoes: [string, string][] = []
  if (produto.comprimento) especificacoes.push(['Comprimento', `${produto.comprimento} m`])
  if (mostrarMotor) {
    if (produto.ano) especificacoes.push(['Ano', String(produto.ano)])
    if (produto.motorizacao_tipo) especificacoes.push(['Motorização', produto.motorizacao_tipo])
    if (produto.motorizacao_potencia) especificacoes.push(['Potência', produto.motorizacao_potencia])
    if (produto.motorizacao_marca_modelo)
      especificacoes.push(['Marca/modelo do motor', produto.motorizacao_marca_modelo])
    if (produto.combustivel) especificacoes.push(['Combustível', produto.combustivel])
    if (produto.horas_uso) especificacoes.push(['Horas de uso', produto.horas_uso])
    if (produto.ultima_revisao) especificacoes.push(['Última revisão', produto.ultima_revisao])
  }

  const subtitulo = mostrarMotor
    ? [produto.motorizacao_tipo, produto.motorizacao_potencia, produto.combustivel, produto.horas_uso ? `${produto.horas_uso} de uso` : null]
        .filter(Boolean)
        .join(' · ')
    : ''

  const camposComValor = campos
    .map((campo) => [campo.nome, formatarValorCampo(campo, produto.atributos?.[campo.id] ?? null)] as const)
    .filter((par): par is [string, string] => par[1] !== null)

  const contatoEmpresa = [empresa?.telefone, empresa?.email].filter(Boolean).join(' · ')

  return (
    <div
      className="space-y-5 p-10"
      style={{ pageBreakAfter: pageBreakAfter ? 'always' : 'auto', minHeight: '250mm' }}
    >
      <span className="inline-block rounded-full bg-wake-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-wake-500">
        {vendidoComoEsta ? 'Seminovo' : 'Novo'}
      </span>

      <div>
        <h2 className="font-display text-3xl leading-tight text-hull-900">{produto.nome}</h2>
        {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
      </div>

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

      {produto.descricao && (
        <p className="whitespace-pre-wrap text-justify text-sm leading-relaxed text-slate-600">
          {produto.descricao}
        </p>
      )}

      {especificacoes.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-wake-500">
            Ficha técnica
          </p>
          <TabelaFicha linhas={especificacoes} />
        </div>
      )}

      {itensDoProduto.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-wake-500">
            Itens inclusos
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
            {itensDoProduto.map((item) => (
              <li key={item.id} className="flex gap-1.5">
                <span className="text-wake-500">•</span>
                <span>
                  {item.nome}
                  {item.descricao ? ` — ${item.descricao}` : ''}
                  {item.quantidade ? ` (x${item.quantidade})` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {camposComValor.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-wake-500">
            Informações adicionais
          </p>
          <TabelaFicha linhas={camposComValor} />
        </div>
      )}

      {incluirPreco && (
        <div className="rounded-md bg-hull-900 px-4 py-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.14em] text-brass-400/90">Valor</p>
          <p className="font-display text-2xl text-foam-50">{formatPreco(produto.preco_base)}</p>
        </div>
      )}

      {empresa?.nome_empresa && (
        <div className="border-t border-foam-200 pt-3 text-center">
          <p className="text-sm font-medium text-hull-900">Fale com {empresa.nome_empresa}</p>
          {contatoEmpresa && <p className="mt-0.5 text-xs text-slate-500">{contatoEmpresa}</p>}
        </div>
      )}
    </div>
  )
}
