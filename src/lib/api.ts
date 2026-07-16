import { supabase } from './supabase'
import type {
  ModeloBarco,
  Motor,
  Acessorio,
  ClienteLead,
  StatusCRM,
  EmpresaConfig,
} from '@/types'

// ---------- Modelos ----------

export async function listModelos(): Promise<ModeloBarco[]> {
  const { data, error } = await supabase
    .from('modelos_barcos')
    .select('id, nome, descricao, preco_base, comprimento, fotos_modelos(url_imagem, principal)')
    .order('nome')
  if (error) throw error
  return (data ?? []).map(({ fotos_modelos, ...modelo }) => ({
    ...modelo,
    foto_principal_url:
      fotos_modelos?.find((f) => f.principal)?.url_imagem ?? fotos_modelos?.[0]?.url_imagem,
  }))
}

export async function createModelo(
  modelo: Omit<ModeloBarco, 'id' | 'foto_principal_url'>
): Promise<ModeloBarco> {
  const { data, error } = await supabase
    .from('modelos_barcos')
    .insert(modelo)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateModelo(
  id: string,
  patch: Partial<Omit<ModeloBarco, 'id'>>
): Promise<void> {
  const { error } = await supabase.from('modelos_barcos').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteModelo(id: string): Promise<void> {
  const { error } = await supabase.from('modelos_barcos').delete().eq('id', id)
  if (error) throw error
}

export async function uploadFotoModelo(modeloId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${modeloId}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('modelos').upload(path, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('modelos').getPublicUrl(path)

  const { error: insertError } = await supabase
    .from('fotos_modelos')
    .insert({ modelo_id: modeloId, url_imagem: data.publicUrl, principal: true })
  if (insertError) throw insertError

  return data.publicUrl
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
  modelo_id: string
  motor_id: string | null
  acessorio_ids: string[]
  valor_total: number
  validade_dias: number
}) {
  const validade = new Date()
  validade.setDate(validade.getDate() + input.validade_dias)

  const { data: orcamento, error } = await supabase
    .from('orcamentos')
    .insert({
      cliente_id: input.cliente_id,
      modelo_id: input.modelo_id,
      motor_id: input.motor_id,
      valor_total: input.valor_total,
      status: 'Rascunho',
      validade: validade.toISOString(),
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
