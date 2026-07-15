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

export interface ModeloBarco {
  id: string
  nome: string
  descricao: string
  preco_base: number
  comprimento: number | null
  foto_principal_url?: string
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
  modelo_id: string | null
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
  modelo_id: string
  motor_id: string
  valor_total: number
  status: 'Rascunho' | 'Enviado' | 'Aprovado'
  criado_em: string
  validade: string
}
