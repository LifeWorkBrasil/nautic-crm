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
  vendedor_id?: string | null
  deletado_em?: string | null
}

export interface UsuarioPerfil {
  id: string
  nome: string
  email: string
  is_admin: boolean
  ativo: boolean
  comissao_percentual: number
  empresa_id: string
  plataforma_admin: boolean
  criado_em: string
}

export interface TabSistema {
  chave: string
  label: string
  ordem: number
}

export interface PerfilAcesso {
  id: string
  nome: string
  criado_em: string
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
  vendido_como_esta: boolean
  requer_motor: boolean
}

export interface GrupoProduto {
  id: string
  subcategoria_id: string
  nome: string
  ordem: number
}

export type TipoCampoPersonalizado = 'texto' | 'numero' | 'booleano' | 'selecao'

export type ContextoCampoPersonalizado = 'embarcacao' | 'marina'

export interface CampoPersonalizado {
  id: string
  categoria_id: string | null
  grupo_id: string | null
  contexto: ContextoCampoPersonalizado | null
  nome: string
  tipo: TipoCampoPersonalizado
  opcoes: string[] | null
  unidade: string | null
  ordem: number
}

export interface Produto {
  id: string
  nome: string
  descricao: string
  preco_base: number
  comprimento: number | null
  subcategoria_id: string
  grupo_id: string | null
  foto_principal_url?: string
  origem_captacao: 'Próprio' | 'Terceiro'
  captador_nome: string | null
  parceiro_id: string | null
  parceiro_nome?: string
  ano: number | null
  motorizacao_tipo: string | null
  motorizacao_potencia: string | null
  motorizacao_marca_modelo: string | null
  combustivel: string | null
  horas_uso: string | null
  ultima_revisao: string | null
  atributos: Record<string, string | number | boolean | null>
  status_estoque: 'disponivel' | 'esgotado' | 'oculto'
  data_reposicao: string | null
}

export interface AvisoReposicao {
  id: string
  produto_id: string
  empresa_id: string
  nome: string
  telefone: string
  criado_em: string
  notificado: boolean
  notificado_em: string | null
}

export interface ProdutoItemIncluso {
  id: string
  produto_id: string
  nome: string
  descricao: string | null
  quantidade: number | null
  estado: string | null
  marca: string | null
}

export type CategoriaParceiro = 'marinheiro' | 'tecnico' | 'proprietario' | 'outro'
export type HabilitacaoMarinheiro = 'Amador' | 'Arrais-Amador' | 'Mestre Amador' | 'Capitão Amador'
export type RegimeTrabalho = 'CLT' | 'MEI' | 'Autônomo' | 'Outro'

export interface Parceiro {
  id: string
  codigo: number
  nome: string
  contato: string | null
  telefone: string | null
  observacoes: string | null
  categoria: CategoriaParceiro
  especialidade: string | null
  habilitacao: HabilitacaoMarinheiro | null
  regiao_atuacao: string | null
  fins_de_semana_livres: boolean | null
  regime_trabalho: RegimeTrabalho | null
  marcas_autorizadas: string[]
  tipos_equipamento_autorizados: string[]
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
  subcategoria_ids: string[]
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
  ramo_nautico: boolean
  usa_captacao: boolean
  usa_motores: boolean
  atualizado_em: string
}

export interface Orcamento {
  id: string
  cliente_id: string
  produto_id: string
  motor_id: string
  quantidade: number
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
  provedor_ia: string | null
  instagram_media_id: string | null
  publicado_instagram_em: string | null
  agendado_para: string | null
  status_agendamento: 'agendado' | 'publicado' | 'erro' | null
  erro_agendamento: string | null
  video_url: string | null
  criado_em: string
  /** Nome do produto/captação vinculado — populado por listPostsMarketing() via join, não existe na tabela. */
  produto_nome?: string | null
}

export interface InstagramStatus {
  conectado: boolean
  instagram_username: string | null
  token_expira_em: string | null
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

export interface MensagemModelo {
  id: string
  nome: string
  atalho: string
  texto: string
  imagem_url: string | null
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
  acessorio_ids: string[]
}

export interface LinkPublicoProduto {
  id: string
  produto_id: string
  empresa_id: string
  criado_por: string | null
  cliente_nome: string | null
  criado_em: string
  expira_em: string
}

// ---------- Módulo de Embarcações (NFC) ----------

export interface Marina {
  id: string
  nome: string
  localizacao: string | null
  contato: string | null
  pin_acesso: string | null
  atributos: Record<string, string | number | boolean | null>
  criado_em: string
}

export type StatusEmbarcacao = 'ATIVA' | 'EM_MANUTENCAO' | 'VENDIDA' | 'INATIVA'

export interface Embarcacao {
  id: string
  nome: string
  numero_registro: string | null
  tipo: string | null
  comprimento: number | null
  marina_id: string | null
  proprietario_id: string | null
  broker_id: string | null
  produto_id: string | null
  marinheiro_nome: string | null
  marinheiro_contato: string | null
  status: StatusEmbarcacao
  foto_url: string | null
  fabricante: string | null
  modelo: string | null
  cor_costado: string | null
  ano: number | null
  // Checklist de vistoria do casco: { "Costado": "OK", "Fundo": "...", ... }
  estado_geral: Record<string, string>
  atributos: Record<string, string | number | boolean | null>
  criado_em: string
  atualizado_em: string
}

export type ModeloNfc = 'NTAG213' | 'NTAG215' | 'NTAG216' | 'CUSTOM'
export type ModoGravacaoNfc = 'HUB' | 'DIRECT'

export interface EmbarcacaoTag {
  id: string
  embarcacao_id: string
  tag_id: string
  modelo_nfc: ModeloNfc
  modo_gravacao: ModoGravacaoNfc
  ativo: boolean
  contagem_leituras: number
  criado_em: string
}

export interface AnexoManutencao {
  url: string
  nome_arquivo: string
}

export interface EmbarcacaoManutencao {
  id: string
  embarcacao_id: string
  item_id: string | null
  tipo: string | null
  descricao: string | null
  realizado_em: string | null
  realizado_por: string | null
  custo: number | null
  proxima_data: string | null
  horas_uso_registrada: number | null
  fornecedor_id: string | null
  fotos: string[]
  anexos: AnexoManutencao[]
  criado_por: string | null
  criado_em: string
}

export interface EmbarcacaoLimpeza {
  id: string
  embarcacao_id: string
  limpo_em: string | null
  limpo_por: string | null
  observacoes: string | null
  fotos: string[]
  criado_em: string
}

export type TipoMovimentacao = 'SUBIDA' | 'DESCIDA'

export interface EmbarcacaoMovimentacao {
  id: string
  embarcacao_id: string
  tipo_movimentacao: TipoMovimentacao
  movimentado_em: string
  responsavel: string | null
  observacoes: string | null
  criado_em: string
}

export type CategoriaItemEmbarcacao = 'MOTOR' | 'GERADOR' | 'AR_CONDICIONADO' | 'ACESSORIO'

export interface EmbarcacaoAcessorio {
  id: string
  embarcacao_id: string
  categoria: CategoriaItemEmbarcacao
  nome: string
  marca: string | null
  modelo: string | null
  numero_serie: string | null
  quantidade: number
  possui: boolean
  estado: string | null
  caracteristicas: string | null
  potencia: string | null
  tipo: string | null
  combustivel: string | null
  ano: number | null
  joystick: boolean | null
  horas_uso: number | null
  ultima_revisao_em: string | null
  instalado_em: string | null
  garantia_vence_em: string | null
  fornecedor_id: string | null
  /** @deprecated legado em texto livre — usar fornecedor_id. Mantido só-leitura para itens antigos. */
  fornecedor: string | null
  observacoes: string | null
  criado_em: string
}

export interface Fornecedor {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  servicos: string[]
  marcas: string[]
  observacoes: string | null
  criado_em: string
}

// Colunas seguras da view pública embarcacoes_publico (sem dados do proprietário)
export interface EmbarcacaoPublico {
  id: string
  nome: string
  tipo: string | null
  comprimento: number | null
  foto_url: string | null
  marina_id: string | null
  marinheiro_nome: string | null
  status: StatusEmbarcacao
  empresa_id: string
}
