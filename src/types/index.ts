export type StatusCRM =
  | 'Lead'
  | 'Proposta Enviada'
  | 'Negociação'
  | 'Venda Concluída'
  | 'Perdido'

export interface ClienteLead {
  id: string
  nome: string
  email: string
  telefone: string
  status_crm: StatusCRM
  origem: string
  observacoes?: string
  criado_em: string
}

export interface CategoriaProduto {
  id: string
  nome: string
  ordem: number
}

export interface SubcategoriaProduto {
  id: string
  categoria_id: string
  nome: string
  ordem: number
}

export interface Produto {
  id: string
  nome: string
  descricao: string
  preco_base: number
  comprimento: number | null
  subcategoria_id: string
  foto_principal_url?: string
}

export interface FotoProduto {
  id: string
  produto_id: string
  url_imagem: string
  principal: boolean
}

export interface VideoProduto {
  id: string
  produto_id: string
  url_youtube: string
  titulo: string | null
}

export interface ManualProduto {
  id: string
  produto_id: string
  url_arquivo: string
  nome_arquivo: string
  criado_em: string
}

export interface Motor {
  id: string
  marca: string
  modelo: string
  potencia: number
  preco: number
  combustivel: 'Gasolina' | 'Diesel'
  ativo: boolean
}

export interface Acessorio {
  id: string
  nome: string
  preco: number
  categoria: string
  produto_id: string | null
}

export interface EmpresaConfig {
  id: string
  nome_empresa: string
  cnpj: string | null
  logo_url: string | null
  endereco: string | null
  telefone: string | null
  email: string | null
  site: string | null
  validade_orcamento_dias: number
  termos_condicoes: string | null
  atualizado_em: string
}

export interface Orcamento {
  id: string
  cliente_id: string
  produto_id: string
  motor_id: string
  valor_total: number
  status: 'Rascunho' | 'Enviado' | 'Aprovado'
  criado_em: string
  validade: string
  data_prevista_entrega: string | null
  entrada_percentual: number
  entrada_valor: number
}

export interface ParcelaOrcamento {
  id: string
  orcamento_id: string
  numero: number
  percentual: number
  valor: number
}
