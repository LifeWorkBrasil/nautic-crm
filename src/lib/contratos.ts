import { formatBRL } from './format'
import type {
  ClienteLead,
  OrcamentoDetalhado,
  EmpresaConfig,
  Contraproposta,
  ContrapropostaVeiculo,
  ContrapropostaImovel,
} from '@/types'

export interface DadosContrato {
  cliente: ClienteLead
  orcamento: OrcamentoDetalhado | null
  empresa: EmpresaConfig | null
  trading?: {
    contraproposta: Contraproposta
    veiculo: ContrapropostaVeiculo | null
    imovel: ContrapropostaImovel | null
  } | null
}

function documentoCliente(cliente: ClienteLead): string {
  if (cliente.tipo_pessoa === 'PJ') return cliente.cnpj || '—'
  return cliente.cpf || '—'
}

function enderecoCliente(cliente: ClienteLead): string {
  const partes = [cliente.endereco, cliente.cidade, cliente.estado, cliente.cep].filter(Boolean)
  return partes.length > 0 ? partes.join(', ') : '—'
}

function formatarData(data: string | null | undefined): string {
  if (!data) return 'A combinar'
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

function parcelasDetalhe(orcamento: OrcamentoDetalhado | null): string {
  if (!orcamento) return '—'
  const linhas = [`Entrada: ${orcamento.entrada_percentual}% (${formatBRL(orcamento.entrada_valor)})`]
  for (const p of orcamento.parcelas) {
    linhas.push(`Parcela ${p.numero}: ${p.percentual}% (${formatBRL(p.valor)})`)
  }
  return linhas.join('\n')
}

function tradingDescricao(dados: DadosContrato): string {
  const t = dados.trading
  if (!t) return 'Não há bem de troca nesta negociação.'
  if (t.veiculo) {
    const partes = [t.veiculo.tipo_veiculo, t.veiculo.marca_modelo, t.veiculo.ano ? `ano ${t.veiculo.ano}` : null]
      .filter(Boolean)
      .join(' ')
    return `${partes}${
      t.veiculo.valor_estimado ? ` — valor estimado ${formatBRL(t.veiculo.valor_estimado)}` : ''
    }`
  }
  if (t.imovel) {
    return `${t.imovel.descricao ?? 'Imóvel'}${
      t.imovel.valor_estimado ? ` — valor estimado ${formatBRL(t.imovel.valor_estimado)}` : ''
    }`
  }
  return 'Bem de troca registrado sem detalhamento.'
}

function normalizeToken(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[\s\-_]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

type Resolver = (d: DadosContrato) => string | null

const BRACKET_ALIASES: Record<string, Resolver> = {
  // Cliente
  NOME_DO_CLIENTE: (d) => d.cliente.nome || null,
  RAZAO_SOCIAL: (d) => d.cliente.razao_social || null,
  ENDERECO_COMPLETO: (d) => {
    const e = enderecoCliente(d.cliente)
    return e !== '—' ? e : null
  },
  CNPJ: (d) => d.cliente.cnpj || null,
  CPF: (d) => d.cliente.cpf || null,
  NUMERO_RG: (d) => d.cliente.rg || null,
  NOME_DO_REPREENTANTE_LEGAL: () => null,
  NACIONALIDADE: () => null,
  DATA_DE_NASCIMENTO: () => null,
  ESTADO_CIVIL: () => null,
  PROFISSAO: () => null,
  ORGAO_EXPEDIDOR: () => null,

  // Produto / embarcação
  TIPO_DE_PRODUTO: () => null,
  MODELO: (d) => d.orcamento?.produto?.nome ?? null,
  TAMANHO: (d) => (d.orcamento?.produto?.comprimento ? `${d.orcamento.produto.comprimento} m` : null),
  ANO: (d) => (d.orcamento?.produto?.ano ? String(d.orcamento.produto.ano) : null),
  SERIAL: () => null,

  // Motorização — cai no campo combinado do produto quando não há Motor vinculado
  // (caso "vendido como está" / barcos usados: motor_id fica null no orçamento)
  QUANTIDADE_DE_MOTORES: () => null,
  MARCA_MOTOR: (d) => d.orcamento?.motor?.marca ?? d.orcamento?.produto?.motorizacao_marca_modelo ?? null,
  MODELO_MOTOR: (d) => d.orcamento?.motor?.modelo ?? null,
  ANO_MOTOR: () => null,
  COMBUSTIVEL: (d) => d.orcamento?.motor?.combustivel ?? d.orcamento?.produto?.combustivel ?? null,
  SERIAL_DOS_MOTORES: () => null,

  // Financeiro
  VALOR_DA_VENDA: (d) => (d.orcamento ? formatBRL(d.orcamento.valor_total) : null),
  CONDICOES_DE_PAGAMENTO: (d) => (d.orcamento ? parcelasDetalhe(d.orcamento) : null),

  // Trading
  DADOS_DO_TRADING: (d) => tradingDescricao(d),

  // Fechamento
  LOCAL: () => null,
  DIA: () => String(new Date().getDate()),
  MES: () => new Date().toLocaleDateString('pt-BR', { month: 'long' }),
  ANO_ATUAL: () => String(new Date().getFullYear()),
}

export function preencherMinuta(corpo: string, dados: DadosContrato): string {
  const tokens: Record<string, string> = {
    cliente_nome: dados.cliente.nome,
    cliente_documento: documentoCliente(dados.cliente),
    cliente_endereco: enderecoCliente(dados.cliente),
    produto_nome: dados.orcamento?.produto?.nome ?? '—',
    produto_descricao: dados.orcamento?.produto?.descricao ?? '—',
    valor_total: dados.orcamento ? formatBRL(dados.orcamento.valor_total) : '—',
    entrada_valor: dados.orcamento ? formatBRL(dados.orcamento.entrada_valor) : '—',
    entrada_percentual: dados.orcamento ? `${dados.orcamento.entrada_percentual}%` : '—',
    parcelas_detalhe: parcelasDetalhe(dados.orcamento),
    data_entrega: formatarData(dados.orcamento?.data_prevista_entrega),
    trading_descricao: tradingDescricao(dados),
    empresa_nome: dados.empresa?.nome_empresa ?? '—',
    empresa_cnpj: dados.empresa?.cnpj ?? '—',
    empresa_endereco: dados.empresa?.endereco ?? '—',
    data_hoje: new Date().toLocaleDateString('pt-BR'),
  }

  let resultado = corpo
  for (const [chave, valor] of Object.entries(tokens)) {
    resultado = resultado.split(`{{${chave}}}`).join(valor)
  }
  resultado = resultado.replace(/\[([^[\]\n]+)\]/g, (match, inner: string) => {
    const resolver = BRACKET_ALIASES[normalizeToken(inner)]
    if (!resolver) return match
    const valor = resolver(dados)
    return valor && valor.trim() ? valor : match
  })
  return resultado
}

export const PLACEHOLDERS_DISPONIVEIS = [
  '{{cliente_nome}}',
  '{{cliente_documento}}',
  '{{cliente_endereco}}',
  '{{produto_nome}}',
  '{{produto_descricao}}',
  '{{valor_total}}',
  '{{entrada_valor}}',
  '{{entrada_percentual}}',
  '{{parcelas_detalhe}}',
  '{{data_entrega}}',
  '{{trading_descricao}}',
  '{{empresa_nome}}',
  '{{empresa_cnpj}}',
  '{{empresa_endereco}}',
  '{{data_hoje}}',
]

export const PLACEHOLDERS_COLCHETES_DISPONIVEIS = Object.keys(BRACKET_ALIASES).map((k) => `[${k}]`)
