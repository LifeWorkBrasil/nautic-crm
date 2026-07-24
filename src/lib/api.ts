import { supabase } from './supabase'
import type {
  CategoriaProduto,
  SubcategoriaProduto,
  GrupoProduto,
  Produto,
  ProdutoItemIncluso,
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
  Contraproposta,
  ContrapropostaVeiculo,
  ContrapropostaImovel,
  OrcamentoDetalhado,
  ParcelaOrcamento,
  UsuarioPerfil,
  TabSistema,
  PerfilAcesso,
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

// ---------- Parceiros ----------

export async function listParceiros(): Promise<Parceiro[]> {
  const { data, error } = await supabase.from('parceiros').select('*').order('nome')
  if (error) throw error
  return data ?? []
}

export async function createParceiro(parceiro: Omit<Parceiro, 'id' | 'criado_em'>): Promise<Parceiro> {
  const { data, error } = await supabase.from('parceiros').insert(parceiro).select().single()
  if (error) throw error
  return data
}

export async function updateParceiro(
  id: string,
  patch: Partial<Omit<Parceiro, 'id' | 'criado_em'>>
): Promise<void> {
  const { error } = await supabase.from('parceiros').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteParceiro(id: string): Promise<void> {
  const { error } = await supabase.from('parceiros').delete().eq('id', id)
  if (error) throw error
}

// ---------- Produtos ----------

const PRODUTO_SELECT =
  'id, nome, descricao, preco_base, comprimento, subcategoria_id, grupo_id, origem_captacao, captador_nome, parceiro_id, ano, motorizacao_tipo, motorizacao_potencia, motorizacao_marca_modelo, combustivel, horas_uso, ultima_revisao, fotos_produto(url_imagem, principal), parceiros(nome)'

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
    'id' | 'foto_principal_url' | 'parceiro_nome' | 'origem_captacao' | 'captador_nome' | 'parceiro_id'
  > &
    Partial<Pick<Produto, 'origem_captacao' | 'captador_nome' | 'parceiro_id'>>
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

export async function uploadFotoProduto(produtoId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${produtoId}/${crypto.randomUUID()}.${ext}`
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

export async function uploadManualProduto(produtoId: string, file: File): Promise<ManualProduto> {
  if (file.type !== 'application/pdf') {
    throw new Error('O manual deve ser um arquivo PDF.')
  }
  const path = `${produtoId}/${crypto.randomUUID()}.pdf`
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
  const { data, error } = await supabase
    .from('clientes_leads')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createLead(
  lead: Omit<ClienteLead, 'id' | 'criado_em'>
): Promise<ClienteLead> {
  const { data, error } = await supabase.from('clientes_leads').insert(lead).select().single()
  if (error) throw error
  return data
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

// ---------- Orçamentos ----------

export async function criarOrcamento(input: {
  cliente_id: string
  produto_id: string
  motor_id: string | null
  acessorio_ids: string[]
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

export async function listOrcamentosCliente(clienteId: string): Promise<OrcamentoDetalhado[]> {
  const { data, error } = await supabase
    .from('orcamentos')
    .select('*, produtos(*), motores(*), orcamentos_parcelas(*)')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data ?? []).map(({ produtos, motores, orcamentos_parcelas, ...orcamento }) => ({
    ...orcamento,
    produto: produtos ?? null,
    motor: motores ?? null,
    parcelas: (orcamentos_parcelas ?? []).sort(
      (a: ParcelaOrcamento, b: ParcelaOrcamento) => a.numero - b.numero
    ),
  }))
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

export async function uploadLogoEmpresa(file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `logo-${Date.now()}.${ext}`
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

export async function uploadFotoCaptacao(captacaoId: string, file: File): Promise<CaptacaoFoto> {
  const ext = file.name.split('.').pop()
  const path = `captacao-${captacaoId}/${crypto.randomUUID()}.${ext}`
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
    const destinoPath = `${produto.id}/${crypto.randomUUID()}.${ext}`
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

  const itensProdutos: MidiaBancoItem[] = (produtos ?? [])
    .filter((p) => (p.fotos_produto ?? []).length > 0)
    .map((p) => ({
      origem: 'produto' as const,
      origemId: p.id,
      nome: p.nome,
      descricao: p.descricao,
      precoBase: p.preco_base,
      fotos: p.fotos_produto ?? [],
    }))

  const itensCaptacoes: MidiaBancoItem[] = (captacoes ?? [])
    .filter((c) => (c.captacao_fotos ?? []).length > 0)
    .map((c) => ({
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

export async function listPostsMarketing(): Promise<PostMarketing[]> {
  const { data, error } = await supabase
    .from('posts_marketing')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
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

export async function cancelarAgendamentoPost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('posts_marketing')
    .update({ agendado_para: null, status_agendamento: null, erro_agendamento: null })
    .eq('id', postId)
  if (error) throw error
}

export async function getInstagramStatus(): Promise<InstagramStatus | null> {
  const { data, error } = await supabase.from('instagram_status').select('*').maybeSingle()
  if (error) throw error
  return data
}

export function getInstagramConectarUrl(): string {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_INSTAGRAM_APP_ID,
    redirect_uri: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-oauth-callback`,
    scope: 'instagram_business_basic,instagram_business_content_publish',
    response_type: 'code',
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
