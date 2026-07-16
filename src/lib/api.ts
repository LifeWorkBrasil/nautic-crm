import { supabase } from './supabase'
import type {
  CategoriaProduto,
  SubcategoriaProduto,
  Produto,
  FotoProduto,
  VideoProduto,
  ManualProduto,
  Motor,
  Acessorio,
  ClienteLead,
  StatusCRM,
  EmpresaConfig,
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

// ---------- Produtos ----------

export async function listProdutos(subcategoriaId?: string): Promise<Produto[]> {
  let query = supabase
    .from('produtos')
    .select('id, nome, descricao, preco_base, comprimento, subcategoria_id, fotos_produto(url_imagem, principal)')
    .order('nome')
  if (subcategoriaId) query = query.eq('subcategoria_id', subcategoriaId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(({ fotos_produto, ...produto }) => ({
    ...produto,
    foto_principal_url:
      fotos_produto?.find((f) => f.principal)?.url_imagem ?? fotos_produto?.[0]?.url_imagem,
  }))
}

export async function createProduto(
  produto: Omit<Produto, 'id' | 'foto_principal_url'>
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
  patch: Partial<Omit<Produto, 'id'>>
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
  const { data, error } = await supabase.from('acessorios').select('*').order('categoria')
  if (error) throw error
  return data ?? []
}

export async function createAcessorio(acessorio: Omit<Acessorio, 'id'>): Promise<Acessorio> {
  const { data, error } = await supabase.from('acessorios').insert(acessorio).select().single()
  if (error) throw error
  return data
}

export async function updateAcessorio(
  id: string,
  patch: Partial<Omit<Acessorio, 'id'>>
): Promise<void> {
  const { error } = await supabase.from('acessorios').update(patch).eq('id', id)
  if (error) throw error
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
