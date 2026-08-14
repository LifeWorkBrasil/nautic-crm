import { supabase } from './supabase'
import type {
  CategoriaProduto,
  SubcategoriaProduto,
  GrupoProduto,
  Produto,
  ProdutoItemIncluso,
  AvisoReposicao,
  FotoProduto,
  VideoProduto,
  ManualProduto,
  Motor,
  Acessorio,
  ClienteLead,
  HistoricoContato,
  StatusCRM,
  EmpresaConfig,
  Captacao,
  CaptacaoItem,
  CaptacaoFoto,
  PostMarketing,
  MidiaBancoItem,
  InstagramStatus,
  Parceiro,
  MinutaContrato,
  MensagemModelo,
  Contraproposta,
  ContrapropostaVeiculo,
  ContrapropostaImovel,
  OrcamentoDetalhado,
  ParcelaOrcamento,
  UsuarioPerfil,
  TabSistema,
  PerfilAcesso,
  CampoPersonalizado,
  LinkPublicoProduto,
  Marina,
  Embarcacao,
  EmbarcacaoTag,
  EmbarcacaoManutencao,
  EmbarcacaoLimpeza,
  EmbarcacaoMovimentacao,
  EmbarcacaoAcessorio,
  EmbarcacaoPublico,
  Fornecedor,
  AnexoManutencao,
} from '@/types'

// ---------- Categorias / Subcategorias ----------

export async function listCategorias(): Promise<CategoriaProduto[]> {
  const { data, error } = await supabase.from('categorias_produto').select('*').order('ordem')
  if (error) throw error
  return data ?? []
}

export async function listSubcategorias(categoriaId?: string): Promise<SubcategoriaProduto[]> {
  let query = supabase.from('subcategorias_produto').select('*').order('ordem')
  if (categoriaId) query = query.eq('categoria_id', categoriaId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createCategoria(
  categoria: Omit<CategoriaProduto, 'id'>
): Promise<CategoriaProduto> {
  const { data, error } = await supabase
    .from('categorias_produto')
    .insert(categoria)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategoria(
  id: string,
  patch: Partial<Omit<CategoriaProduto, 'id'>>
): Promise<void> {
  const { error } = await supabase.from('categorias_produto').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCategoria(id: string): Promise<void> {
  const { error } = await supabase.from('categorias_produto').delete().eq('id', id)
  if (error) throw error
}

export async function createSubcategoria(
  subcategoria: Omit<SubcategoriaProduto, 'id'>
): Promise<SubcategoriaProduto> {
  const { data, error } = await supabase
    .from('subcategorias_produto')
    .insert(subcategoria)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSubcategoria(
  id: string,
  patch: Partial<Omit<SubcategoriaProduto, 'id'>>
): Promise<void> {
  const { error } = await supabase.from('subcategorias_produto').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteSubcategoria(id: string): Promise<void> {
  const { error } = await supabase.from('subcategorias_produto').delete().eq('id', id)
  if (error) throw error
}

export async function listGrupos(subcategoriaId?: string): Promise<GrupoProduto[]> {
  let query = supabase.from('grupos_produto').select('*').order('ordem')
  if (subcategoriaId) query = query.eq('subcategoria_id', subcategoriaId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createGrupo(grupo: Omit<GrupoProduto, 'id'>): Promise<GrupoProduto> {
  const { data, error } = await supabase.from('grupos_produto').insert(grupo).select().single()
  if (error) throw error
  return data
}

export async function updateGrupo(
  id: string,
  patch: Partial<Omit<GrupoProduto, 'id'>>
): Promise<void> {
  const { error } = await supabase.from('grupos_produto').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteGrupo(id: string): Promise<void> {
  const { error } = await supabase.from('grupos_produto').delete().eq('id', id)
  if (error) throw error
}

// ---------- Campos personalizados ----------

export async function listCamposPersonalizados(): Promise<CampoPersonalizado[]> {
  const { data, error } = await supabase.from('campos_personalizados').select('*').order('ordem')
  if (error) throw error
  return data ?? []
}

export async function createCampoPersonalizado(
  campo: Omit<CampoPersonalizado, 'id'>
): Promise<CampoPersonalizado> {
  const { data, error } = await supabase
    .from('campos_personalizados')
    .insert(campo)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCampoPersonalizado(
  id: string,
  patch: Partial<Omit<CampoPersonalizado, 'id' | 'categoria_id' | 'grupo_id'>>
): Promise<void> {
  const { error } = await supabase.from('campos_personalizados').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCampoPersonalizado(id: string): Promise<void> {
  const { error } = await supabase.from('campos_personalizados').delete().eq('id', id)
  if (error) throw error
}

// ---------- Parceiros ----------

export async function listParceiros(): Promise<Parceiro[]> {
  const { data, error } = await supabase.from('parceiros').select('*').order('nome')
  if (error) throw error
  return data ?? []
}

export async function createParceiro(
  parceiro: Pick<Parceiro, 'nome'> & Partial<Omit<Parceiro, 'id' | 'codigo' | 'criado_em' | 'nome'>>
): Promise<Parceiro> {
  const { data, error } = await supabase
    .from('parceiros')
    .insert({
      contato: null,
      telefone: null,
      observacoes: null,
      categoria: 'outro',
      especialidade: null,
      habilitacao: null,
      regiao_atuacao: null,
      fins_de_semana_livres: null,
      regime_trabalho: null,
      marcas_autorizadas: [],
      tipos_equipamento_autorizados: [],
      ...parceiro,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateParceiro(
  id: string,
  patch: Partial<Omit<Parceiro, 'id' | 'codigo' | 'criado_em'>>
): Promise<void> {
  const { error } = await supabase.from('parceiros').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteParceiro(id: string): Promise<void> {
  const { error } = await supabase.from('parceiros').delete().eq('id', id)
  if (error) throw error
}

export async function listEmbarcacoesDoParceiro(
  parceiroId: string
): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase
    .from('parceiro_embarcacoes')
    .select('embarcacoes(id, nome)')
    .eq('parceiro_id', parceiroId)
  if (error) throw error
  return (data ?? []).flatMap((row) => {
    const rel = row.embarcacoes as { id: string; nome: string } | { id: string; nome: string }[] | null
    const embarcacao = Array.isArray(rel) ? rel[0] : rel
    return embarcacao ? [embarcacao] : []
  })
}

export async function setEmbarcacoesVinculadas(parceiroId: string, embarcacaoIds: string[]): Promise<void> {
  const { error: delError } = await supabase.from('parceiro_embarcacoes').delete().eq('parceiro_id', parceiroId)
  if (delError) throw delError
  if (embarcacaoIds.length === 0) return
  const { error: insError } = await supabase
    .from('parceiro_embarcacoes')
    .insert(embarcacaoIds.map((embarcacao_id) => ({ parceiro_id: parceiroId, embarcacao_id })))
  if (insError) throw insError
}

// ---------- Produtos ----------

const PRODUTO_SELECT =
  'id, nome, descricao, preco_base, comprimento, subcategoria_id, grupo_id, origem_captacao, captador_nome, parceiro_id, ano, motorizacao_tipo, motorizacao_potencia, motorizacao_marca_modelo, combustivel, horas_uso, ultima_revisao, atributos, status_estoque, data_reposicao, fotos_produto(url_imagem, principal), parceiros(nome)'

function mapProdutoRow({
  fotos_produto,
  parceiros,
  ...produto
}: {
  fotos_produto?: { url_imagem: string; principal: boolean }[]
  parceiros?: { nome: string } | { nome: string }[] | null
  [key: string]: unknown
}): Produto {
  const parceiro = Array.isArray(parceiros) ? parceiros[0] : parceiros
  return {
    ...(produto as Omit<Produto, 'foto_principal_url' | 'parceiro_nome'>),
    foto_principal_url:
      fotos_produto?.find((f) => f.principal)?.url_imagem ?? fotos_produto?.[0]?.url_imagem,
    parceiro_nome: parceiro?.nome,
  }
}

export async function listProdutos(subcategoriaId?: string): Promise<Produto[]> {
  let query = supabase.from('produtos').select(PRODUTO_SELECT).order('nome')
  if (subcategoriaId) query = query.eq('subcategoria_id', subcategoriaId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapProdutoRow)
}

export async function listProdutosTerceiros(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from('produtos')
    .select(PRODUTO_SELECT)
    .eq('origem_captacao', 'Terceiro')
    .order('nome')
  if (error) throw error
  return (data ?? []).map(mapProdutoRow)
}

export async function createProduto(
  produto: Omit<
    Produto,
    | 'id'
    | 'foto_principal_url'
    | 'parceiro_nome'
    | 'origem_captacao'
    | 'captador_nome'
    | 'parceiro_id'
    | 'atributos'
    | 'status_estoque'
    | 'data_reposicao'
  > &
    Partial<
      Pick<
        Produto,
        | 'origem_captacao'
        | 'captador_nome'
        | 'parceiro_id'
        | 'atributos'
        | 'status_estoque'
        | 'data_reposicao'
      >
    >
): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .insert(produto)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduto(
  id: string,
  patch: Partial<Omit<Produto, 'id' | 'foto_principal_url' | 'parceiro_nome'>>
): Promise<void> {
  const { error } = await supabase.from('produtos').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteProduto(id: string): Promise<void> {
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) throw error
}

export async function uploadFotoProduto(empresaId: string, produtoId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${empresaId}/${produtoId}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('produtos').upload(path, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('produtos').getPublicUrl(path)

  const { count } = await supabase
    .from('fotos_produto')
    .select('id', { count: 'exact', head: true })
    .eq('produto_id', produtoId)

  const { error: insertError } = await supabase
    .from('fotos_produto')
    .insert({ produto_id: produtoId, url_imagem: data.publicUrl, principal: (count ?? 0) === 0 })
  if (insertError) throw insertError

  return data.publicUrl
}

export async function listFotosProduto(produtoId: string): Promise<FotoProduto[]> {
  const { data, error } = await supabase
    .from('fotos_produto')
    .select('*')
    .eq('produto_id', produtoId)
    .order('principal', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function setFotoPrincipal(produtoId: string, fotoId: string): Promise<void> {
  const { error: clearError } = await supabase
    .from('fotos_produto')
    .update({ principal: false })
    .eq('produto_id', produtoId)
  if (clearError) throw clearError

  const { error: setError } = await supabase
    .from('fotos_produto')
    .update({ principal: true })
    .eq('id', fotoId)
  if (setError) throw setError
}

export async function deleteFoto(foto: { id: string; url_imagem: string }): Promise<void> {
  const path = foto.url_imagem.split('/produtos/')[1]
  if (path) {
    await supabase.storage.from('produtos').remove([path])
  }
  const { error } = await supabase.from('fotos_produto').delete().eq('id', foto.id)
  if (error) throw error
}

export async function listItensInclusosProduto(produtoId: string): Promise<ProdutoItemIncluso[]> {
  const { data, error } = await supabase
    .from('produto_itens_inclusos')
    .select('*')
    .eq('produto_id', produtoId)
  if (error) throw error
  return data ?? []
}

export async function createItemInclusoProduto(
  item: Omit<ProdutoItemIncluso, 'id'>
): Promise<ProdutoItemIncluso> {
  const { data, error } = await supabase
    .from('produto_itens_inclusos')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateItemInclusoProduto(
  id: string,
  patch: Partial<Omit<ProdutoItemIncluso, 'id' | 'produto_id'>>
): Promise<void> {
  const { error } = await supabase.from('produto_itens_inclusos').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteItemInclusoProduto(id: string): Promise<void> {
  const { error } = await supabase.from('produto_itens_inclusos').delete().eq('id', id)
  if (error) throw error
}

// ---------- Avisos de reposição de estoque ----------

export async function listAvisosReposicao(produtoId: string): Promise<AvisoReposicao[]> {
  const { data, error } = await supabase
    .from('avisos_reposicao')
    .select('*')
    .eq('produto_id', produtoId)
    .order('criado_em')
  if (error) throw error
  return data ?? []
}

export async function marcarAvisoNotificado(id: string): Promise<void> {
  const { error } = await supabase
    .from('avisos_reposicao')
    .update({ notificado: true, notificado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------- Vídeos (YouTube) ----------

export async function listVideosProduto(produtoId: string): Promise<VideoProduto[]> {
  const { data, error } = await supabase
    .from('videos_produto')
    .select('*')
    .eq('produto_id', produtoId)
  if (error) throw error
  return data ?? []
}

export async function createVideoProduto(video: {
  produto_id: string
  url_youtube: string
  titulo: string
}): Promise<VideoProduto> {
  const { data, error } = await supabase.from('videos_produto').insert(video).select().single()
  if (error) throw error
  return data
}

export async function deleteVideoProduto(id: string): Promise<void> {
  const { error } = await supabase.from('videos_produto').delete().eq('id', id)
  if (error) throw error
}

// ---------- Manuais (PDF) ----------

export async function listManuaisProduto(produtoId: string): Promise<ManualProduto[]> {
  const { data, error } = await supabase
    .from('manuais_produto')
    .select('*')
    .eq('produto_id', produtoId)
    .order('criado_em')
  if (error) throw error
  return data ?? []
}

export async function uploadManualProduto(empresaId: string, produtoId: string, file: File): Promise<ManualProduto> {
  if (file.type !== 'application/pdf') {
    throw new Error('O manual deve ser um arquivo PDF.')
  }
  const path = `${empresaId}/${produtoId}/${crypto.randomUUID()}.pdf`
  const { error: uploadError } = await supabase.storage.from('manuais').upload(path, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('manuais').getPublicUrl(path)

  const { data: manual, error: insertError } = await supabase
    .from('manuais_produto')
    .insert({ produto_id: produtoId, url_arquivo: data.publicUrl, nome_arquivo: file.name })
    .select()
    .single()
  if (insertError) throw insertError
  return manual
}

export async function deleteManualProduto(manual: { id: string; url_arquivo: string }): Promise<void> {
  const path = manual.url_arquivo.split('/manuais/')[1]
  if (path) {
    await supabase.storage.from('manuais').remove([path])
  }
  const { error } = await supabase.from('manuais_produto').delete().eq('id', manual.id)
  if (error) throw error
}

// ---------- Motores ----------

export async function listMotores(): Promise<Motor[]> {
  const { data, error } = await supabase.from('motores').select('*').order('marca')
  if (error) throw error
  return data ?? []
}

export async function createMotor(motor: Omit<Motor, 'id'>): Promise<Motor> {
  const { data, error } = await supabase.from('motores').insert(motor).select().single()
  if (error) throw error
  return data
}

export async function updateMotor(id: string, patch: Partial<Omit<Motor, 'id'>>): Promise<void> {
  const { error } = await supabase.from('motores').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteMotor(id: string): Promise<void> {
  const { error } = await supabase.from('motores').delete().eq('id', id)
  if (error) throw error
}

export async function createMotoresBulk(motores: Omit<Motor, 'id'>[]): Promise<Motor[]> {
  if (motores.length === 0) return []
  const { data, error } = await supabase.from('motores').insert(motores).select()
  if (error) throw error
  return data ?? []
}

// ---------- Acessórios ----------

export async function listAcessorios(): Promise<Acessorio[]> {
  const { data, error } = await supabase
    .from('acessorios')
    .select('*, acessorios_subcategorias(subcategoria_id)')
    .order('categoria')
  if (error) throw error
  return (data ?? []).map(({ acessorios_subcategorias, ...a }) => ({
    ...a,
    subcategoria_ids: (acessorios_subcategorias ?? []).map(
      (x: { subcategoria_id: string }) => x.subcategoria_id
    ),
  }))
}

export async function createAcessorio(
  acessorio: Omit<Acessorio, 'id' | 'subcategoria_ids'> & { subcategoria_ids?: string[] }
): Promise<Acessorio> {
  const { subcategoria_ids, ...campos } = acessorio
  const { data, error } = await supabase.from('acessorios').insert(campos).select().single()
  if (error) throw error
  if (subcategoria_ids && subcategoria_ids.length > 0) {
    const { error: vinculoError } = await supabase.from('acessorios_subcategorias').insert(
      subcategoria_ids.map((subcategoria_id) => ({ acessorio_id: data.id, subcategoria_id }))
    )
    if (vinculoError) throw vinculoError
  }
  return { ...data, subcategoria_ids: subcategoria_ids ?? [] }
}

export async function updateAcessorio(
  id: string,
  patch: Partial<Omit<Acessorio, 'id' | 'subcategoria_ids'>> & { subcategoria_ids?: string[] }
): Promise<void> {
  const { subcategoria_ids, ...campos } = patch
  if (Object.keys(campos).length > 0) {
    const { error } = await supabase.from('acessorios').update(campos).eq('id', id)
    if (error) throw error
  }
  if (subcategoria_ids !== undefined) {
    const { error: deleteError } = await supabase
      .from('acessorios_subcategorias')
      .delete()
      .eq('acessorio_id', id)
    if (deleteError) throw deleteError
    if (subcategoria_ids.length > 0) {
      const { error: insertError } = await supabase.from('acessorios_subcategorias').insert(
        subcategoria_ids.map((subcategoria_id) => ({ acessorio_id: id, subcategoria_id }))
      )
      if (insertError) throw insertError
    }
  }
}

export async function deleteAcessorio(id: string): Promise<void> {
  const { error } = await supabase.from('acessorios').delete().eq('id', id)
  if (error) throw error
}

// ---------- CRM / Leads ----------

export async function listLeads(): Promise<ClienteLead[]> {
  // O PostgREST corta em 1000 linhas por padrão — sem paginar aqui, uma importação grande
  // (que entra como as mais recentes, por criado_em desc) pode ocupar o limite todo e escconder
  // leads mais antigos (ex.: os que já estão em Proposta Enviada/Negociação) da resposta.
  const TAMANHO_PAGINA = 1000
  const todos: ClienteLead[] = []
  for (let pagina = 0; ; pagina++) {
    const { data, error } = await supabase
      .from('clientes_leads')
      .select('*')
      .is('deletado_em', null)
      .order('criado_em', { ascending: false })
      .range(pagina * TAMANHO_PAGINA, pagina * TAMANHO_PAGINA + TAMANHO_PAGINA - 1)
    if (error) throw error
    todos.push(...(data ?? []))
    if (!data || data.length < TAMANHO_PAGINA) break
  }
  return todos
}

export async function listLeadsLixeira(): Promise<ClienteLead[]> {
  const { data, error } = await supabase
    .from('clientes_leads')
    .select('*')
    .not('deletado_em', 'is', null)
    .order('deletado_em', { ascending: false })
    .range(0, 999)
  if (error) throw error
  return data ?? []
}

export async function excluirLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('clientes_leads')
    .update({ deletado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function restaurarLead(id: string): Promise<void> {
  const { error } = await supabase.from('clientes_leads').update({ deletado_em: null }).eq('id', id)
  if (error) throw error
}

export async function createLead(
  lead: Omit<ClienteLead, 'id' | 'criado_em'>
): Promise<ClienteLead> {
  const { data, error } = await supabase.from('clientes_leads').insert(lead).select().single()
  if (error) throw error
  return data
}

export async function createLeadsBulk(
  leads: Omit<ClienteLead, 'id' | 'criado_em'>[]
): Promise<ClienteLead[]> {
  if (leads.length === 0) return []
  const TAMANHO_LOTE = 300
  const criados: ClienteLead[] = []
  for (let i = 0; i < leads.length; i += TAMANHO_LOTE) {
    const lote = leads.slice(i, i + TAMANHO_LOTE)
    const { data, error } = await supabase.from('clientes_leads').insert(lote).select()
    if (error) throw error
    criados.push(...(data ?? []))
  }
  return criados
}

export async function updateLeadStatus(id: string, status: StatusCRM): Promise<void> {
  const { error } = await supabase
    .from('clientes_leads')
    .update({ status_crm: status })
    .eq('id', id)
  if (error) throw error
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<ClienteLead, 'id' | 'criado_em'>>
): Promise<void> {
  const { error } = await supabase.from('clientes_leads').update(patch).eq('id', id)
  if (error) throw error
}

export async function assumirLead(clienteId: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Não autenticado')
  await updateLead(clienteId, { vendedor_id: userData.user.id })
}

export async function listHistoricoCliente(clienteId: string): Promise<HistoricoContato[]> {
  const { data, error } = await supabase
    .from('clientes_historico')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function adicionarHistorico(
  clienteId: string,
  texto: string
): Promise<HistoricoContato> {
  const { data, error } = await supabase
    .from('clientes_historico')
    .insert({ cliente_id: clienteId, texto })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adicionarHistoricoBulk(
  itens: { cliente_id: string; texto: string }[]
): Promise<void> {
  if (itens.length === 0) return
  const TAMANHO_LOTE = 300
  for (let i = 0; i < itens.length; i += TAMANHO_LOTE) {
    const lote = itens.slice(i, i + TAMANHO_LOTE)
    const { error } = await supabase.from('clientes_historico').insert(lote)
    if (error) throw error
  }
}

// ---------- Orçamentos ----------

export async function criarOrcamento(input: {
  cliente_id: string
  produto_id: string
  motor_id: string | null
  acessorio_ids: string[]
  quantidade: number
  valor_total: number
  validade_dias: number
  data_prevista_entrega: string | null
  entrada_percentual: number
  parcelas: { percentual: number }[]
}) {
  const somaPercentuais =
    input.entrada_percentual + input.parcelas.reduce((soma, p) => soma + p.percentual, 0)
  if (Math.abs(somaPercentuais - 100) > 0.01) {
    throw new Error('A soma da entrada e das parcelas deve totalizar 100%.')
  }

  const validade = new Date()
  validade.setDate(validade.getDate() + input.validade_dias)

  const valorPorPercentual = (percentual: number) =>
    Math.round(input.valor_total * (percentual / 100) * 100) / 100

  const { data: orcamento, error } = await supabase
    .from('orcamentos')
    .insert({
      cliente_id: input.cliente_id,
      produto_id: input.produto_id,
      motor_id: input.motor_id,
      quantidade: input.quantidade,
      valor_total: input.valor_total,
      status: 'Rascunho',
      validade: validade.toISOString(),
      data_prevista_entrega: input.data_prevista_entrega,
      entrada_percentual: input.entrada_percentual,
      entrada_valor: valorPorPercentual(input.entrada_percentual),
    })
    .select()
    .single()
  if (error) throw error

  if (input.acessorio_ids.length > 0) {
    const linhas = input.acessorio_ids.map((acessorio_id) => ({
      orcamento_id: orcamento.id,
      acessorio_id,
    }))
    const { error: relError } = await supabase.from('orcamentos_acessorios').insert(linhas)
    if (relError) throw relError
  }

  if (input.parcelas.length > 0) {
    const linhasParcelas = input.parcelas.map((p, i) => ({
      orcamento_id: orcamento.id,
      numero: i + 1,
      percentual: p.percentual,
      valor: valorPorPercentual(p.percentual),
    }))
    const { error: parcelasError } = await supabase.from('orcamentos_parcelas').insert(linhasParcelas)
    if (parcelasError) throw parcelasError
  }

  return orcamento
}

const ORCAMENTO_DETALHADO_SELECT =
  '*, produtos(*), motores(*), orcamentos_parcelas(*), orcamentos_acessorios(acessorio_id)'

function mapOrcamentoDetalhado({
  produtos,
  motores,
  orcamentos_parcelas,
  orcamentos_acessorios,
  ...orcamento
}: any): OrcamentoDetalhado {
  return {
    ...orcamento,
    produto: produtos ?? null,
    motor: motores ?? null,
    parcelas: (orcamentos_parcelas ?? []).sort(
      (a: ParcelaOrcamento, b: ParcelaOrcamento) => a.numero - b.numero
    ),
    acessorio_ids: (orcamentos_acessorios ?? []).map((a: { acessorio_id: string }) => a.acessorio_id),
  }
}

export async function listOrcamentosCliente(clienteId: string): Promise<OrcamentoDetalhado[]> {
  const { data, error } = await supabase
    .from('orcamentos')
    .select(ORCAMENTO_DETALHADO_SELECT)
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapOrcamentoDetalhado)
}

export async function getOrcamento(id: string): Promise<OrcamentoDetalhado | null> {
  const { data, error } = await supabase
    .from('orcamentos')
    .select(ORCAMENTO_DETALHADO_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapOrcamentoDetalhado(data) : null
}

export async function updateOrcamento(
  id: string,
  input: {
    cliente_id: string
    produto_id: string
    motor_id: string | null
    acessorio_ids: string[]
    quantidade: number
    valor_total: number
    validade_dias: number
    data_prevista_entrega: string | null
    entrada_percentual: number
    parcelas: { percentual: number }[]
  }
) {
  const somaPercentuais =
    input.entrada_percentual + input.parcelas.reduce((soma, p) => soma + p.percentual, 0)
  if (Math.abs(somaPercentuais - 100) > 0.01) {
    throw new Error('A soma da entrada e das parcelas deve totalizar 100%.')
  }

  const validade = new Date()
  validade.setDate(validade.getDate() + input.validade_dias)

  const valorPorPercentual = (percentual: number) =>
    Math.round(input.valor_total * (percentual / 100) * 100) / 100

  const { error } = await supabase
    .from('orcamentos')
    .update({
      cliente_id: input.cliente_id,
      produto_id: input.produto_id,
      motor_id: input.motor_id,
      quantidade: input.quantidade,
      valor_total: input.valor_total,
      validade: validade.toISOString(),
      data_prevista_entrega: input.data_prevista_entrega,
      entrada_percentual: input.entrada_percentual,
      entrada_valor: valorPorPercentual(input.entrada_percentual),
    })
    .eq('id', id)
  if (error) throw error

  const { error: delAcessoriosError } = await supabase
    .from('orcamentos_acessorios')
    .delete()
    .eq('orcamento_id', id)
  if (delAcessoriosError) throw delAcessoriosError

  if (input.acessorio_ids.length > 0) {
    const linhas = input.acessorio_ids.map((acessorio_id) => ({
      orcamento_id: id,
      acessorio_id,
    }))
    const { error: relError } = await supabase.from('orcamentos_acessorios').insert(linhas)
    if (relError) throw relError
  }

  const { error: delParcelasError } = await supabase
    .from('orcamentos_parcelas')
    .delete()
    .eq('orcamento_id', id)
  if (delParcelasError) throw delParcelasError

  if (input.parcelas.length > 0) {
    const linhasParcelas = input.parcelas.map((p, i) => ({
      orcamento_id: id,
      numero: i + 1,
      percentual: p.percentual,
      valor: valorPorPercentual(p.percentual),
    }))
    const { error: parcelasError } = await supabase.from('orcamentos_parcelas').insert(linhasParcelas)
    if (parcelasError) throw parcelasError
  }
}

// ---------- Catálogo em PDF ----------

export async function listTodasFotosProdutos(): Promise<FotoProduto[]> {
  const { data, error } = await supabase
    .from('fotos_produto')
    .select('*')
    .order('principal', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listTodosItensInclusos(): Promise<ProdutoItemIncluso[]> {
  const { data, error } = await supabase.from('produto_itens_inclusos').select('*')
  if (error) throw error
  return data ?? []
}

// ---------- Relatórios ----------

export async function listHistoricoPorPeriodo(
  dataInicio: string,
  dataFim: string
): Promise<{ cliente_id: string; criado_em: string; vendedor_id: string | null }[]> {
  const { data, error } = await supabase
    .from('clientes_historico')
    .select('cliente_id, criado_em, clientes_leads(vendedor_id)')
    .gte('criado_em', dataInicio)
    .lte('criado_em', dataFim)
  if (error) throw error
  return (data ?? []).map((h) => {
    const lead = Array.isArray(h.clientes_leads) ? h.clientes_leads[0] : h.clientes_leads
    return {
      cliente_id: h.cliente_id,
      criado_em: h.criado_em,
      vendedor_id: lead?.vendedor_id ?? null,
    }
  })
}

export async function listOrcamentosPorPeriodo(
  dataInicio: string,
  dataFim: string
): Promise<
  { cliente_id: string; criado_em: string; produto_nome: string | null; vendedor_id: string | null }[]
> {
  const { data, error } = await supabase
    .from('orcamentos')
    .select('cliente_id, criado_em, produtos(nome), clientes_leads(vendedor_id)')
    .gte('criado_em', dataInicio)
    .lte('criado_em', dataFim)
  if (error) throw error
  return (data ?? []).map((o) => {
    const produto = Array.isArray(o.produtos) ? o.produtos[0] : o.produtos
    const lead = Array.isArray(o.clientes_leads) ? o.clientes_leads[0] : o.clientes_leads
    return {
      cliente_id: o.cliente_id,
      criado_em: o.criado_em,
      produto_nome: produto?.nome ?? null,
      vendedor_id: lead?.vendedor_id ?? null,
    }
  })
}

// ---------- Link público de produto (página pública temporária) ----------

export async function criarLinkPublicoProduto(input: {
  produto_id: string
  expira_em: string
  cliente_nome?: string | null
}): Promise<LinkPublicoProduto> {
  const { data, error } = await supabase
    .from('links_publicos_produto')
    .insert({
      produto_id: input.produto_id,
      expira_em: input.expira_em,
      cliente_nome: input.cliente_nome ?? null,
      criado_por: (await supabase.auth.getUser()).data.user?.id ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getLinkPublicoProduto(id: string): Promise<LinkPublicoProduto | null> {
  const { data, error } = await supabase
    .from('links_publicos_produto')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getProdutoPublico(id: string): Promise<Produto | null> {
  const { data, error } = await supabase
    .from('produtos')
    .select(PRODUTO_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapProdutoRow(data) : null
}

export async function getSubcategoriaPublica(id: string): Promise<SubcategoriaProduto | null> {
  const { data, error } = await supabase
    .from('subcategorias_produto')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getEmpresaPublica(
  id: string
): Promise<Pick<EmpresaConfig, 'id' | 'nome_empresa' | 'logo_url' | 'telefone'> | null> {
  const { data, error } = await supabase
    .from('empresas')
    .select('id, nome_empresa, logo_url, telefone')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listCamposPersonalizadosPublico(empresaId: string): Promise<CampoPersonalizado[]> {
  const { data, error } = await supabase
    .from('campos_personalizados')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('ordem')
  if (error) throw error
  return data ?? []
}

// ---------- Configuração da empresa ----------

export async function getEmpresaConfig(): Promise<EmpresaConfig | null> {
  const { data, error } = await supabase.from('empresa_config').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function updateEmpresaConfig(
  id: string,
  patch: Partial<Omit<EmpresaConfig, 'id' | 'atualizado_em'>>
): Promise<void> {
  const { error } = await supabase
    .from('empresa_config')
    .update({ ...patch, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function uploadLogoEmpresa(empresaId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${empresaId}/logo-${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('branding').upload(path, file, {
    upsert: true,
  })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('branding').getPublicUrl(path)
  return data.publicUrl
}

// ---------- Captação ----------

export async function listCaptacoes(status?: string): Promise<Captacao[]> {
  let query = supabase.from('captacoes').select('*').order('criado_em', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createCaptacao(
  captacao: Omit<Captacao, 'id' | 'criado_em' | 'status' | 'produto_id'>
): Promise<Captacao> {
  const { data, error } = await supabase.from('captacoes').insert(captacao).select().single()
  if (error) throw error
  return data
}

export async function updateCaptacao(
  id: string,
  patch: Partial<Omit<Captacao, 'id' | 'criado_em'>>
): Promise<void> {
  const { error } = await supabase.from('captacoes').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCaptacao(id: string): Promise<void> {
  const { error } = await supabase.from('captacoes').delete().eq('id', id)
  if (error) throw error
}

export async function listCaptacaoItens(captacaoId: string): Promise<CaptacaoItem[]> {
  const { data, error } = await supabase
    .from('captacao_itens')
    .select('*')
    .eq('captacao_id', captacaoId)
  if (error) throw error
  return data ?? []
}

export async function createCaptacaoItem(item: Omit<CaptacaoItem, 'id'>): Promise<CaptacaoItem> {
  const { data, error } = await supabase.from('captacao_itens').insert(item).select().single()
  if (error) throw error
  return data
}

export async function updateCaptacaoItem(
  id: string,
  patch: Partial<Omit<CaptacaoItem, 'id' | 'captacao_id'>>
): Promise<void> {
  const { error } = await supabase.from('captacao_itens').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCaptacaoItem(id: string): Promise<void> {
  const { error } = await supabase.from('captacao_itens').delete().eq('id', id)
  if (error) throw error
}

export async function listFotosCaptacao(captacaoId: string): Promise<CaptacaoFoto[]> {
  const { data, error } = await supabase
    .from('captacao_fotos')
    .select('*')
    .eq('captacao_id', captacaoId)
    .order('principal', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function uploadFotoCaptacao(empresaId: string, captacaoId: string, file: File): Promise<CaptacaoFoto> {
  const ext = file.name.split('.').pop()
  const path = `${empresaId}/captacao-${captacaoId}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('produtos').upload(path, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('produtos').getPublicUrl(path)

  const { count } = await supabase
    .from('captacao_fotos')
    .select('id', { count: 'exact', head: true })
    .eq('captacao_id', captacaoId)

  const { data: foto, error: insertError } = await supabase
    .from('captacao_fotos')
    .insert({ captacao_id: captacaoId, url_imagem: data.publicUrl, principal: (count ?? 0) === 0 })
    .select()
    .single()
  if (insertError) throw insertError
  return foto
}

export async function deleteFotoCaptacao(foto: { id: string; url_imagem: string }): Promise<void> {
  const path = foto.url_imagem.split('/produtos/')[1]
  if (path) {
    await supabase.storage.from('produtos').remove([path])
  }
  const { error } = await supabase.from('captacao_fotos').delete().eq('id', foto.id)
  if (error) throw error
}

export async function publicarCaptacao(
  empresaId: string,
  captacaoId: string,
  dadosProduto: { descricao: string; preco_base: number }
): Promise<Produto> {
  const { data: captacao, error: captacaoError } = await supabase
    .from('captacoes')
    .select('*')
    .eq('id', captacaoId)
    .single()
  if (captacaoError) throw captacaoError
  if (!captacao.subcategoria_id) {
    throw new Error('A captação precisa de uma subcategoria definida antes de publicar.')
  }

  const { data: produto, error: produtoError } = await supabase
    .from('produtos')
    .insert({
      nome: captacao.nome,
      descricao: dadosProduto.descricao,
      preco_base: dadosProduto.preco_base,
      comprimento: null,
      subcategoria_id: captacao.subcategoria_id,
      ano: captacao.ano,
      motorizacao_tipo: captacao.motorizacao_tipo,
      motorizacao_potencia: captacao.motorizacao_potencia,
      motorizacao_marca_modelo: captacao.motorizacao_marca_modelo,
      combustivel: captacao.combustivel,
      horas_uso: captacao.horas_uso,
      ultima_revisao: captacao.ultima_revisao,
    })
    .select()
    .single()
  if (produtoError) throw produtoError

  const itens = await listCaptacaoItens(captacaoId)
  if (itens.length > 0) {
    const { error: itensError } = await supabase.from('produto_itens_inclusos').insert(
      itens.map((item) => ({
        produto_id: produto.id,
        nome: item.nome,
        descricao: item.descricao,
        quantidade: item.quantidade,
        estado: item.estado,
        marca: item.marca,
      }))
    )
    if (itensError) throw itensError
  }

  const fotos = await listFotosCaptacao(captacaoId)
  for (const foto of fotos) {
    const origemPath = foto.url_imagem.split('/produtos/')[1]
    if (!origemPath) continue
    const ext = origemPath.split('.').pop()
    const destinoPath = `${empresaId}/${produto.id}/${crypto.randomUUID()}.${ext}`
    const { error: copyError } = await supabase.storage.from('produtos').copy(origemPath, destinoPath)
    if (copyError) continue
    const { data: publicUrlData } = supabase.storage.from('produtos').getPublicUrl(destinoPath)
    await supabase.from('fotos_produto').insert({
      produto_id: produto.id,
      url_imagem: publicUrlData.publicUrl,
      principal: foto.principal,
    })
  }

  const { error: updateError } = await supabase
    .from('captacoes')
    .update({ produto_id: produto.id, status: 'Publicado' })
    .eq('id', captacaoId)
  if (updateError) throw updateError

  return produto
}

// ---------- Marketing ----------

export async function listMidiaBanco(): Promise<MidiaBancoItem[]> {
  const { data: produtos, error: produtosError } = await supabase
    .from('produtos')
    .select('id, nome, descricao, preco_base, fotos_produto(id, url_imagem, principal)')
  if (produtosError) throw produtosError

  const { data: captacoes, error: captacoesError } = await supabase
    .from('captacoes')
    .select('id, nome, observacoes, captacao_fotos(id, url_imagem, principal)')
    .neq('status', 'Descartado')
  if (captacoesError) throw captacoesError

  // Antes só entrava aqui quem já tinha foto — produtos sem foto ainda cadastrada sumiam da
  // aba de Marketing sem explicação nenhuma. Agora todos aparecem (dá pra gerar/salvar legenda
  // mesmo sem foto); só publicar no Instagram continua exigindo pelo menos uma foto, já
  // controlado em outro ponto (podePublicar).
  const itensProdutos: MidiaBancoItem[] = (produtos ?? []).map((p) => ({
    origem: 'produto' as const,
    origemId: p.id,
    nome: p.nome,
    descricao: p.descricao,
    precoBase: p.preco_base,
    fotos: p.fotos_produto ?? [],
  }))

  const itensCaptacoes: MidiaBancoItem[] = (captacoes ?? []).map((c) => ({
    origem: 'captacao' as const,
    origemId: c.id,
    nome: `${c.nome} (captação)`,
    descricao: c.observacoes,
    precoBase: null,
    fotos: c.captacao_fotos ?? [],
  }))

  return [...itensProdutos, ...itensCaptacoes]
}

export async function gerarLegendaSocial(input: {
  nome: string
  descricao?: string | null
  tom?: string
  precoBase?: number | null
  provider?: 'claude' | 'gemini'
}): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession()
  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-legenda-social`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(input),
    }
  )
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error ?? 'Erro ao gerar legenda.')
  return data.legenda as string
}

export async function gerarMensagemWhatsapp(input: {
  clienteNome: string
  produtoNome: string
  valorTotal?: number | null
  entradaPercentual?: number | null
  parcelas?: { percentual: number }[]
  dataPrevistaEntrega?: string | null
  nomeEmpresa?: string | null
  provider?: 'claude' | 'gemini'
}): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession()
  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-mensagem-whatsapp`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(input),
    }
  )
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error ?? 'Erro ao gerar mensagem.')
  return data.mensagem as string
}

export async function listPostsMarketing(): Promise<PostMarketing[]> {
  const { data, error } = await supabase
    .from('posts_marketing')
    .select('*, produtos(nome), captacoes(nome)')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map((p) => {
    const { produtos, captacoes, ...resto } = p as typeof p & {
      produtos: { nome: string } | null
      captacoes: { nome: string } | null
    }
    return { ...resto, produto_nome: produtos?.nome ?? captacoes?.nome ?? null }
  })
}

export async function salvarPostMarketing(post: {
  produto_id?: string | null
  captacao_id?: string | null
  prompt_usuario?: string | null
  tom?: string | null
  legenda_gerada: string
  foto_urls?: string[] | null
  provedor_ia?: string | null
  agendado_para?: string | null
}): Promise<PostMarketing> {
  const { data, error } = await supabase
    .from('posts_marketing')
    .insert({
      ...post,
      status_agendamento: post.agendado_para ? 'agendado' : null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function excluirPostMarketing(postId: string): Promise<void> {
  const { error } = await supabase.from('posts_marketing').delete().eq('id', postId)
  if (error) throw error
}

export async function cancelarAgendamentoPost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('posts_marketing')
    .update({ agendado_para: null, status_agendamento: null, erro_agendamento: null })
    .eq('id', postId)
  if (error) throw error
}

export async function agendarPostExistente(postId: string, agendadoPara: string): Promise<PostMarketing> {
  const { data, error } = await supabase
    .from('posts_marketing')
    .update({ agendado_para: agendadoPara, status_agendamento: 'agendado', erro_agendamento: null })
    .eq('id', postId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getInstagramStatus(): Promise<InstagramStatus | null> {
  const { data, error } = await supabase.from('instagram_status').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function desconectarInstagram(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-desconectar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error ?? 'Erro ao desconectar Instagram.')
}

export function getInstagramConectarUrl(empresaId: string): string {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_INSTAGRAM_APP_ID,
    redirect_uri: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-oauth-callback`,
    scope: 'instagram_business_basic,instagram_business_content_publish',
    response_type: 'code',
    state: empresaId,
  })
  return `https://api.instagram.com/oauth/authorize?${params.toString()}`
}

export async function publicarNoInstagram(postId: string): Promise<{ media_id: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-publicar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionData.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ post_id: postId }),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error ?? 'Erro ao publicar no Instagram.')
  return data
}

export async function uploadFlyerMarketing(empresaId: string, postId: string, blob: Blob): Promise<string> {
  const caminho = `${empresaId}/flyers/${postId}-${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('produtos')
    .upload(caminho, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('produtos').getPublicUrl(caminho)
  return data.publicUrl
}

// Substitui as fotos do post pelo flyer gerado — o post passa a ser publicado só com essa
// imagem (não em carrossel com as fotos originais do produto).
export async function atualizarFotosPostMarketing(postId: string, fotoUrls: string[]): Promise<void> {
  const { error } = await supabase.from('posts_marketing').update({ foto_urls: fotoUrls }).eq('id', postId)
  if (error) throw error
}

export async function uploadVideoReels(empresaId: string, postId: string, blob: Blob): Promise<string> {
  const extensao = blob.type.includes('mp4') ? 'mp4' : 'webm'
  const caminho = `${empresaId}/reels/${postId}.${extensao}`
  const { error } = await supabase.storage
    .from('produtos')
    .upload(caminho, blob, { upsert: true, contentType: blob.type })
  if (error) throw error
  const { data } = supabase.storage.from('produtos').getPublicUrl(caminho)
  return data.publicUrl
}

export async function publicarReelsInstagram(
  postId: string,
  videoUrl: string
): Promise<{ media_id: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-publicar-reels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionData.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ post_id: postId, video_url: videoUrl }),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error ?? 'Erro ao publicar Reels no Instagram.')
  return data
}

// Só grava o vídeo e a data — quem publica de verdade é o cron instagram-publicar-agendados.
export async function agendarReels(
  postId: string,
  videoUrl: string,
  agendadoPara: string
): Promise<void> {
  const { error } = await supabase
    .from('posts_marketing')
    .update({
      video_url: videoUrl,
      agendado_para: agendadoPara,
      status_agendamento: 'agendado',
      erro_agendamento: null,
    })
    .eq('id', postId)
  if (error) throw error
}

// ---------- Minutas de Contrato ----------

export async function listMinutas(): Promise<MinutaContrato[]> {
  const { data, error } = await supabase
    .from('minutas_contrato')
    .select('*')
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function createMinuta(
  minuta: Omit<MinutaContrato, 'id' | 'criado_em'>
): Promise<MinutaContrato> {
  const { data, error } = await supabase.from('minutas_contrato').insert(minuta).select().single()
  if (error) throw error
  return data
}

export async function updateMinuta(
  id: string,
  patch: Partial<Omit<MinutaContrato, 'id' | 'criado_em'>>
): Promise<void> {
  const { error } = await supabase.from('minutas_contrato').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteMinuta(id: string): Promise<void> {
  const { error } = await supabase.from('minutas_contrato').delete().eq('id', id)
  if (error) throw error
}

// ---------- Mensagens-modelo (atalhos de texto pra envio a clientes) ----------

export async function listMensagensModelo(): Promise<MensagemModelo[]> {
  const { data, error } = await supabase.from('mensagens_modelo').select('*').order('nome')
  if (error) throw error
  return data ?? []
}

export async function createMensagemModelo(
  mensagem: Omit<MensagemModelo, 'id' | 'criado_em'>
): Promise<MensagemModelo> {
  const { data, error } = await supabase.from('mensagens_modelo').insert(mensagem).select().single()
  if (error) throw error
  return data
}

export async function updateMensagemModelo(
  id: string,
  patch: Partial<Omit<MensagemModelo, 'id' | 'criado_em'>>
): Promise<void> {
  const { error } = await supabase.from('mensagens_modelo').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteMensagemModelo(id: string): Promise<void> {
  const { error } = await supabase.from('mensagens_modelo').delete().eq('id', id)
  if (error) throw error
}

export async function uploadImagemMensagemModelo(empresaId: string, file: File): Promise<string> {
  const extensao = file.name.split('.').pop() || 'jpg'
  const caminho = `${empresaId}/mensagens-modelo/${Date.now()}.${extensao}`
  const { error } = await supabase.storage.from('produtos').upload(caminho, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('produtos').getPublicUrl(caminho)
  return data.publicUrl
}

// ---------- Contrapropostas (trading) ----------

export async function listContrapropostasCliente(clienteId: string): Promise<
  (Contraproposta & { veiculo: ContrapropostaVeiculo | null; imovel: ContrapropostaImovel | null })[]
> {
  const { data, error } = await supabase
    .from('contrapropostas')
    .select('*, contraproposta_veiculos(*), contraproposta_imoveis(*)')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map(({ contraproposta_veiculos, contraproposta_imoveis, ...contraproposta }) => ({
    ...contraproposta,
    veiculo: contraproposta_veiculos?.[0] ?? null,
    imovel: contraproposta_imoveis?.[0] ?? null,
  }))
}

export async function criarContraproposta(input: {
  cliente_id: string
  orcamento_id?: string | null
  valor_proposto?: number | null
  tipo_parcelamento?: string | null
  numero_parcelas?: number | null
  observacoes?: string | null
  veiculo?: { tipo_veiculo: string; marca_modelo?: string | null; ano?: number | null; valor_estimado?: number | null } | null
  imovel?: { descricao?: string | null; valor_estimado?: number | null } | null
}): Promise<Contraproposta> {
  const { data: contraproposta, error } = await supabase
    .from('contrapropostas')
    .insert({
      cliente_id: input.cliente_id,
      orcamento_id: input.orcamento_id ?? null,
      valor_proposto: input.valor_proposto ?? null,
      tipo_parcelamento: input.tipo_parcelamento ?? null,
      numero_parcelas: input.numero_parcelas ?? null,
      observacoes: input.observacoes ?? null,
    })
    .select()
    .single()
  if (error) throw error

  if (input.veiculo) {
    const { error: veiculoError } = await supabase
      .from('contraproposta_veiculos')
      .insert({ contraproposta_id: contraproposta.id, ...input.veiculo })
    if (veiculoError) throw veiculoError
  }

  if (input.imovel) {
    const { error: imovelError } = await supabase
      .from('contraproposta_imoveis')
      .insert({ contraproposta_id: contraproposta.id, ...input.imovel })
    if (imovelError) throw imovelError
  }

  return contraproposta
}

// ---------- Admin / Permissões ----------

export async function listUsuarios(): Promise<UsuarioPerfil[]> {
  const { data, error } = await supabase.from('usuarios_perfil').select('*').order('nome')
  if (error) throw error
  return data ?? []
}

export async function listTabsSistema(): Promise<TabSistema[]> {
  const { data, error } = await supabase.from('tabs_sistema').select('*').order('ordem')
  if (error) throw error
  return data ?? []
}

export async function listPermissoesUsuario(usuarioId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('permissoes_usuario')
    .select('tab_key')
    .eq('usuario_id', usuarioId)
  if (error) throw error
  return (data ?? []).map((p) => p.tab_key)
}

export async function listMinhasPermissoes(): Promise<{
  perfil: UsuarioPerfil | null
  tabKeys: string[]
}> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) return { perfil: null, tabKeys: [] }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios_perfil')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (perfilError) throw perfilError
  if (!perfil) return { perfil: null, tabKeys: [] }

  const tabKeys = perfil.is_admin ? [] : await listPermissoesUsuario(perfil.id)
  return { perfil, tabKeys }
}

async function chamarAdminManageUser(body: Record<string, unknown>): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionData.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error ?? 'Erro ao processar solicitação.')
}

export async function criarUsuario(input: {
  nome: string
  email: string
  senha: string
  comissao_percentual: number
  tab_keys: string[]
}): Promise<void> {
  await chamarAdminManageUser({ action: 'criar_usuario', ...input })
}

export async function atualizarUsuario(
  usuarioId: string,
  patch: { nome: string; comissao_percentual: number; ativo: boolean }
): Promise<void> {
  await chamarAdminManageUser({ action: 'atualizar_usuario', usuario_id: usuarioId, ...patch })
}

export async function atualizarPermissoes(usuarioId: string, tabKeys: string[]): Promise<void> {
  await chamarAdminManageUser({
    action: 'atualizar_permissoes',
    usuario_id: usuarioId,
    tab_keys: tabKeys,
  })
}

export async function redefinirSenha(usuarioId: string, novaSenha: string): Promise<void> {
  await chamarAdminManageUser({
    action: 'redefinir_senha',
    usuario_id: usuarioId,
    nova_senha: novaSenha,
  })
}

export async function redefinirSenhaPlataforma(email: string, novaSenha: string): Promise<void> {
  await chamarAdminManageUser({
    action: 'redefinir_senha_plataforma',
    email,
    nova_senha: novaSenha,
  })
}

export async function bootstrapTenant(input: {
  nomeEmpresa: string
  slug: string
  segmento: string
  adminNome: string
  adminEmail: string
  adminSenha: string
}): Promise<void> {
  await chamarAdminManageUser({
    action: 'bootstrap_tenant',
    nome_empresa: input.nomeEmpresa,
    slug: input.slug,
    segmento: input.segmento || null,
    admin_nome: input.adminNome,
    admin_email: input.adminEmail,
    admin_senha: input.adminSenha,
  })
}

// ---------- Perfis de Acesso ----------

export async function listPerfisAcesso(): Promise<(PerfilAcesso & { tabKeys: string[] })[]> {
  const { data, error } = await supabase
    .from('perfis_acesso')
    .select('*, perfis_acesso_tabs(tab_key)')
    .order('nome')
  if (error) throw error
  return (data ?? []).map(
    ({
      perfis_acesso_tabs,
      ...perfil
    }: PerfilAcesso & { perfis_acesso_tabs: { tab_key: string }[] }) => ({
      ...perfil,
      tabKeys: (perfis_acesso_tabs ?? []).map((t) => t.tab_key),
    })
  )
}

export async function createPerfilAcesso(nome: string, tabKeys: string[]): Promise<void> {
  const { data: perfil, error } = await supabase
    .from('perfis_acesso')
    .insert({ nome })
    .select()
    .single()
  if (error) throw error
  if (tabKeys.length > 0) {
    const { error: tabsError } = await supabase
      .from('perfis_acesso_tabs')
      .insert(tabKeys.map((k) => ({ perfil_id: perfil.id, tab_key: k })))
    if (tabsError) throw tabsError
  }
}

export async function updatePerfilAcesso(id: string, nome: string, tabKeys: string[]): Promise<void> {
  const { error } = await supabase.from('perfis_acesso').update({ nome }).eq('id', id)
  if (error) throw error

  const { error: deleteError } = await supabase
    .from('perfis_acesso_tabs')
    .delete()
    .eq('perfil_id', id)
  if (deleteError) throw deleteError

  if (tabKeys.length > 0) {
    const { error: insertError } = await supabase
      .from('perfis_acesso_tabs')
      .insert(tabKeys.map((k) => ({ perfil_id: id, tab_key: k })))
    if (insertError) throw insertError
  }
}

export async function deletePerfilAcesso(id: string): Promise<void> {
  const { error } = await supabase.from('perfis_acesso').delete().eq('id', id)
  if (error) throw error
}

// ---------- Embarcações (módulo NFC) ----------

export async function listMarinas(): Promise<Marina[]> {
  const { data, error } = await supabase.from('marinas').select('*').order('nome')
  if (error) throw error
  return data ?? []
}

export async function createMarina(marina: Omit<Marina, 'id' | 'criado_em'>): Promise<Marina> {
  const { data, error } = await supabase.from('marinas').insert(marina).select().single()
  if (error) throw error
  return data
}

export async function updateMarina(id: string, patch: Partial<Omit<Marina, 'id' | 'criado_em'>>): Promise<void> {
  const { error } = await supabase.from('marinas').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteMarina(id: string): Promise<void> {
  const { error } = await supabase.from('marinas').delete().eq('id', id)
  if (error) throw error
}

const EMBARCACAO_SELECT =
  'id, nome, numero_registro, tipo, comprimento, marina_id, proprietario_id, broker_id, produto_id, marinheiro_nome, marinheiro_contato, status, foto_url, fabricante, modelo, cor_costado, ano, estado_geral, atributos, criado_em, atualizado_em, marinas(nome), clientes_leads(nome), parceiros!broker_id(nome)'

function mapEmbarcacaoRow({
  marinas,
  clientes_leads,
  parceiros,
  ...embarcacao
}: {
  marinas?: { nome: string } | { nome: string }[] | null
  clientes_leads?: { nome: string } | { nome: string }[] | null
  parceiros?: { nome: string } | { nome: string }[] | null
  [key: string]: unknown
}): Embarcacao & { marina_nome: string | null; proprietario_nome: string | null; broker_nome: string | null } {
  const nomeDe = (rel?: { nome: string } | { nome: string }[] | null) =>
    (Array.isArray(rel) ? rel[0]?.nome : rel?.nome) ?? null
  return {
    ...(embarcacao as unknown as Embarcacao),
    marina_nome: nomeDe(marinas),
    proprietario_nome: nomeDe(clientes_leads),
    broker_nome: nomeDe(parceiros),
  }
}

export async function listEmbarcacoes(): Promise<
  (Embarcacao & { marina_nome: string | null; proprietario_nome: string | null; broker_nome: string | null })[]
> {
  const { data, error } = await supabase.from('embarcacoes').select(EMBARCACAO_SELECT).order('nome')
  if (error) throw error
  return (data ?? []).map(mapEmbarcacaoRow)
}

export async function getEmbarcacao(
  id: string
): Promise<(Embarcacao & { marina_nome: string | null; proprietario_nome: string | null; broker_nome: string | null }) | null> {
  const { data, error } = await supabase.from('embarcacoes').select(EMBARCACAO_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? mapEmbarcacaoRow(data) : null
}

export async function listEmbarcacoesPorBroker(
  brokerId: string
): Promise<(Embarcacao & { marina_nome: string | null; proprietario_nome: string | null; broker_nome: string | null })[]> {
  const { data, error } = await supabase
    .from('embarcacoes')
    .select(EMBARCACAO_SELECT)
    .eq('broker_id', brokerId)
    .order('nome')
  if (error) throw error
  return (data ?? []).map(mapEmbarcacaoRow)
}

export async function createEmbarcacao(embarcacao: Omit<Embarcacao, 'id' | 'criado_em' | 'atualizado_em'>): Promise<Embarcacao> {
  const { data, error } = await supabase.from('embarcacoes').insert(embarcacao).select().single()
  if (error) throw error
  return data
}

export async function updateEmbarcacao(
  id: string,
  patch: Partial<Omit<Embarcacao, 'id' | 'criado_em' | 'atualizado_em'>>
): Promise<void> {
  const { error } = await supabase
    .from('embarcacoes')
    .update({ ...patch, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteEmbarcacao(id: string): Promise<void> {
  const { error } = await supabase.from('embarcacoes').delete().eq('id', id)
  if (error) throw error
}

export async function listTagsEmbarcacao(embarcacaoId: string): Promise<EmbarcacaoTag[]> {
  const { data, error } = await supabase
    .from('embarcacoes_tags')
    .select('*')
    .eq('embarcacao_id', embarcacaoId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createTagEmbarcacao(
  tag: Pick<EmbarcacaoTag, 'embarcacao_id' | 'tag_id' | 'modelo_nfc' | 'modo_gravacao'>
): Promise<EmbarcacaoTag> {
  const { data, error } = await supabase.from('embarcacoes_tags').insert(tag).select().single()
  if (error) throw error
  return data
}

export async function alternarAtivoTagEmbarcacao(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from('embarcacoes_tags').update({ ativo }).eq('id', id)
  if (error) throw error
}

export async function deleteTagEmbarcacao(id: string): Promise<void> {
  const { error } = await supabase.from('embarcacoes_tags').delete().eq('id', id)
  if (error) throw error
}

export async function listManutencoesEmbarcacao(embarcacaoId: string): Promise<EmbarcacaoManutencao[]> {
  const { data, error } = await supabase
    .from('embarcacoes_manutencoes')
    .select('*')
    .eq('embarcacao_id', embarcacaoId)
    .order('realizado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listLimpezasEmbarcacao(embarcacaoId: string): Promise<EmbarcacaoLimpeza[]> {
  const { data, error } = await supabase
    .from('embarcacoes_limpezas')
    .select('*')
    .eq('embarcacao_id', embarcacaoId)
    .order('limpo_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listMovimentacoesEmbarcacao(embarcacaoId: string): Promise<EmbarcacaoMovimentacao[]> {
  const { data, error } = await supabase
    .from('embarcacoes_movimentacoes')
    .select('*')
    .eq('embarcacao_id', embarcacaoId)
    .order('movimentado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listAcessoriosEmbarcacao(embarcacaoId: string): Promise<EmbarcacaoAcessorio[]> {
  const { data, error } = await supabase
    .from('embarcacoes_acessorios')
    .select('*')
    .eq('embarcacao_id', embarcacaoId)
    .order('nome')
  if (error) throw error
  return data ?? []
}

export async function createAcessorioEmbarcacao(
  acessorio: Omit<EmbarcacaoAcessorio, 'id' | 'criado_em'>
): Promise<EmbarcacaoAcessorio> {
  const { data, error } = await supabase.from('embarcacoes_acessorios').insert(acessorio).select().single()
  if (error) throw error
  return data
}

export async function updateAcessorioEmbarcacao(
  id: string,
  patch: Partial<Omit<EmbarcacaoAcessorio, 'id' | 'embarcacao_id' | 'criado_em'>>
): Promise<void> {
  const { error } = await supabase.from('embarcacoes_acessorios').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteAcessorioEmbarcacao(id: string): Promise<void> {
  const { error } = await supabase.from('embarcacoes_acessorios').delete().eq('id', id)
  if (error) throw error
}

export async function createManutencaoEmbarcacao(
  manutencao: Omit<EmbarcacaoManutencao, 'id' | 'criado_em' | 'fotos' | 'anexos'>
): Promise<EmbarcacaoManutencao> {
  const { data, error } = await supabase
    .from('embarcacoes_manutencoes')
    .insert({ ...manutencao, fotos: [], anexos: [] })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateManutencaoEmbarcacao(
  id: string,
  patch: Partial<Omit<EmbarcacaoManutencao, 'id' | 'embarcacao_id' | 'criado_em'>>
): Promise<void> {
  const { error } = await supabase.from('embarcacoes_manutencoes').update(patch).eq('id', id)
  if (error) throw error
}

export async function uploadAnexoManutencaoEmbarcacao(
  empresaId: string,
  manutencaoId: string,
  file: File
): Promise<AnexoManutencao[]> {
  if (file.type !== 'application/pdf') {
    throw new Error('O anexo deve ser um arquivo PDF.')
  }
  const path = `${empresaId}/embarcacao-manutencao-${manutencaoId}/${crypto.randomUUID()}.pdf`
  const { error: uploadError } = await supabase.storage.from('manuais').upload(path, file)
  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage.from('manuais').getPublicUrl(path)

  const { data: manutencao, error: fetchError } = await supabase
    .from('embarcacoes_manutencoes')
    .select('anexos')
    .eq('id', manutencaoId)
    .single()
  if (fetchError) throw fetchError

  const anexos: AnexoManutencao[] = [
    ...(manutencao.anexos ?? []),
    { url: publicUrlData.publicUrl, nome_arquivo: file.name },
  ]

  const { error: updateError } = await supabase
    .from('embarcacoes_manutencoes')
    .update({ anexos })
    .eq('id', manutencaoId)
  if (updateError) throw updateError

  return anexos
}

export async function criarTagsEmbarcacaoLote(
  tags: Pick<EmbarcacaoTag, 'embarcacao_id' | 'tag_id' | 'modelo_nfc' | 'modo_gravacao'>[]
): Promise<EmbarcacaoTag[]> {
  if (tags.length === 0) return []
  const { data, error } = await supabase.from('embarcacoes_tags').insert(tags).select()
  if (error) throw error
  return data ?? []
}

export async function listTodasTagsEmbarcacoes(): Promise<
  (EmbarcacaoTag & { embarcacao_nome: string })[]
> {
  const { data, error } = await supabase
    .from('embarcacoes_tags')
    .select('*, embarcacoes(nome)')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map(
    ({
      embarcacoes,
      ...tag
    }: EmbarcacaoTag & { embarcacoes?: { nome: string } | { nome: string }[] | null }) => ({
      ...tag,
      embarcacao_nome: (Array.isArray(embarcacoes) ? embarcacoes[0]?.nome : embarcacoes?.nome) ?? '',
    })
  )
}

// ---------- Fornecedores ----------

export async function listFornecedores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase.from('fornecedores').select('*').order('nome')
  if (error) throw error
  return data ?? []
}

export async function createFornecedor(
  fornecedor: Omit<Fornecedor, 'id' | 'criado_em'>
): Promise<Fornecedor> {
  const { data, error } = await supabase.from('fornecedores').insert(fornecedor).select().single()
  if (error) throw error
  return data
}

export async function updateFornecedor(
  id: string,
  patch: Partial<Omit<Fornecedor, 'id' | 'criado_em'>>
): Promise<void> {
  const { error } = await supabase.from('fornecedores').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteFornecedor(id: string): Promise<void> {
  const { error } = await supabase.from('fornecedores').delete().eq('id', id)
  if (error) throw error
}

// Página pública /embarcacao/:tagId — sem autenticação, resolve via RPC security definer
export async function buscarEmbarcacaoPorTag(tagId: string): Promise<EmbarcacaoPublico | null> {
  const { data, error } = await supabase.rpc('buscar_embarcacao_por_tag', { p_tag_id: tagId })
  if (error) throw error
  return data?.[0] ?? null
}

export type TipoEventoEmbarcacao = 'manutencao' | 'limpeza' | 'movimentacao'

// Registro de evento sem login, validado pelo PIN da marina — chamado pela página pública
export async function registrarEventoEmbarcacao(input: {
  tagId: string
  pin: string
  tipoEvento: TipoEventoEmbarcacao
  dados: Record<string, string | number | null>
}): Promise<string> {
  const { data, error } = await supabase.rpc('registrar_evento_embarcacao', {
    p_tag_id: input.tagId,
    p_pin: input.pin,
    p_tipo_evento: input.tipoEvento,
    p_dados: input.dados,
  })
  if (error) throw error
  return data
}

// ---------- Alertas de manutenção (garantia vencendo + revisão agendada) ----------

export interface AlertaManutencao {
  tipo: 'garantia' | 'revisao'
  embarcacao_id: string
  embarcacao_nome: string
  marina_nome: string | null
  marinheiro_nome: string | null
  marinheiro_contato: string | null
  item_nome: string | null
  data: string
}

type EmbarcacaoRelAlerta = {
  id: string
  nome: string
  marinheiro_nome: string | null
  marinheiro_contato: string | null
  marinas?: { nome: string } | { nome: string }[] | null
}

function extrairEmbarcacaoRel(
  rel: EmbarcacaoRelAlerta | EmbarcacaoRelAlerta[] | null | undefined
): EmbarcacaoRelAlerta | null {
  return (Array.isArray(rel) ? rel[0] : rel) ?? null
}

export async function listAlertasManutencao(diasJanela = 30): Promise<AlertaManutencao[]> {
  const limite = new Date()
  limite.setDate(limite.getDate() + diasJanela)
  const limiteIso = limite.toISOString().slice(0, 10)

  const [garantiasRes, revisoesRes] = await Promise.all([
    supabase
      .from('embarcacoes_acessorios')
      .select('nome, garantia_vence_em, embarcacoes(id, nome, marinheiro_nome, marinheiro_contato, marinas(nome))')
      .not('garantia_vence_em', 'is', null)
      .lte('garantia_vence_em', limiteIso),
    supabase
      .from('embarcacoes_manutencoes')
      .select('tipo, proxima_data, embarcacoes(id, nome, marinheiro_nome, marinheiro_contato, marinas(nome))')
      .not('proxima_data', 'is', null)
      .lte('proxima_data', limiteIso),
  ])
  if (garantiasRes.error) throw garantiasRes.error
  if (revisoesRes.error) throw revisoesRes.error

  const nomeMarina = (rel: EmbarcacaoRelAlerta | null) => {
    if (!rel?.marinas) return null
    return Array.isArray(rel.marinas) ? (rel.marinas[0]?.nome ?? null) : rel.marinas.nome
  }

  const garantias: AlertaManutencao[] = (garantiasRes.data ?? []).flatMap((row) => {
    const embarcacao = extrairEmbarcacaoRel(
      row.embarcacoes as EmbarcacaoRelAlerta | EmbarcacaoRelAlerta[] | null
    )
    if (!embarcacao || !row.garantia_vence_em) return []
    return [
      {
        tipo: 'garantia' as const,
        embarcacao_id: embarcacao.id,
        embarcacao_nome: embarcacao.nome,
        marina_nome: nomeMarina(embarcacao),
        marinheiro_nome: embarcacao.marinheiro_nome,
        marinheiro_contato: embarcacao.marinheiro_contato,
        item_nome: row.nome,
        data: row.garantia_vence_em,
      },
    ]
  })

  const revisoes: AlertaManutencao[] = (revisoesRes.data ?? []).flatMap((row) => {
    const embarcacao = extrairEmbarcacaoRel(
      row.embarcacoes as EmbarcacaoRelAlerta | EmbarcacaoRelAlerta[] | null
    )
    if (!embarcacao || !row.proxima_data) return []
    return [
      {
        tipo: 'revisao' as const,
        embarcacao_id: embarcacao.id,
        embarcacao_nome: embarcacao.nome,
        marina_nome: nomeMarina(embarcacao),
        marinheiro_nome: embarcacao.marinheiro_nome,
        marinheiro_contato: embarcacao.marinheiro_contato,
        item_nome: row.tipo,
        data: row.proxima_data,
      },
    ]
  })

  return [...garantias, ...revisoes].sort((a, b) => a.data.localeCompare(b.data))
}
