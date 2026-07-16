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
  tipo_pessoa?: 'PF' | 'PJ'
  cpf?: string | null
  rg?: string | null
  cnpj?: string | null
  razao_social?: string | null
  nome_fantasia?: string | null
  inscricao_estadual?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  pessoa_juridica_id?: string | null
  proximo_contato?: string | null
}

export interface HistoricoContato {
  id: string
  cliente_id: string
  texto: string
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
  origem_captacao: 'Próprio' | 'Terceiro'
  captador_nome: string | null
  parceiro_id: string | null
  parceiro_nome?: string
}

export interface Parceiro {
  id: string
  nome: string
  contato: string | null
  telefone: string | null
  observacoes: string | null
  criado_em: string
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

export type StatusCaptacao = 'Em captação' | 'Aprovado' | 'Publicado' | 'Descartado'

export interface Captacao {
  id: string
  categoria_id: string
  subcategoria_id: string | null
  nome: string
  cliente_nome: string | null
  cliente_telefone: string | null
  local: string | null
  ano: number | null
  fabricante: string | null
  modelo: string | null
  identificador: string | null
  responsavel: string | null
  cor: string | null
  motorizacao_tipo: string | null
  motorizacao_potencia: string | null
  motorizacao_marca_modelo: string | null
  combustivel: string | null
  horas_uso: string | null
  ultima_revisao: string | null
  bateria_motor: string | null
  bateria_servico: string | null
  estado_geral: string | null
  observacoes: string | null
  status: StatusCaptacao
  produto_id: string | null
  criado_em: string
}

export interface CaptacaoItem {
  id: string
  captacao_id: string
  nome: string
  descricao: string | null
  quantidade: number | null
  estado: string | null
  marca: string | null
}

export interface CaptacaoFoto {
  id: string
  captacao_id: string
  url_imagem: string
  principal: boolean
}

export interface PostMarketing {
  id: string
  produto_id: string | null
  captacao_id: string | null
  prompt_usuario: string | null
  tom: string | null
  legenda_gerada: string
  foto_urls: string[] | null
  criado_em: string
}

export interface MidiaBancoItem {
  origem: 'produto' | 'captacao'
  origemId: string
  nome: string
  descricao: string | null
  precoBase: number | null
  fotos: { id: string; url_imagem: string; principal: boolean }[]
}

export interface MinutaContrato {
  id: string
  nome: string
  corpo: string
  ativo: boolean
  criado_em: string
}

export interface Contraproposta {
  id: string
  cliente_id: string
  orcamento_id: string | null
  valor_proposto: number | null
  tipo_parcelamento: string | null
  numero_parcelas: number | null
  observacoes: string | null
  criado_em: string
}

export interface ContrapropostaVeiculo {
  id: string
  contraproposta_id: string
  tipo_veiculo: string
  marca_modelo: string | null
  ano: number | null
  valor_estimado: number | null
}

export interface ContrapropostaImovel {
  id: string
  contraproposta_id: string
  descricao: string | null
  valor_estimado: number | null
}

export interface OrcamentoDetalhado extends Orcamento {
  produto: Produto | null
  motor: Motor | null
  parcelas: ParcelaOrcamento[]
}
