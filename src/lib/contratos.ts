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
