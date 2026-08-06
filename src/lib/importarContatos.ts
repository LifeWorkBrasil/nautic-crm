import type { ClienteLead } from '@/types'

export interface ContatoImportado {
  nome: string
  telefone: string
  email: string
  observacao: string
}

// Remove tudo que não é dígito, o DDI 55 e zeros à esquerda, pra comparar só DDD+número —
// evita falso-negativo entre "(21) 99999-9999", "5521999999999" e "021999999999".
export function normalizarTelefone(telefone: string): string {
  const digitos = (telefone || '').replace(/\D/g, '')
  const semDdi = digitos.length > 10 && digitos.startsWith('55') ? digitos.slice(2) : digitos
  return semDdi.replace(/^0+/, '')
}

export function encontrarLeadExistente(
  telefone: string,
  leads: ClienteLead[]
): ClienteLead | null {
  const chave = normalizarTelefone(telefone)
  if (chave.length < 8) return null
  return leads.find((l) => normalizarTelefone(l.telefone) === chave) ?? null
}

const CAMPO_POR_CABECALHO: Record<string, keyof ContatoImportado> = {
  nome: 'nome',
  name: 'nome',
  contato: 'nome',
  cliente: 'nome',
  telefone: 'telefone',
  phone: 'telefone',
  celular: 'telefone',
  whatsapp: 'telefone',
  tel: 'telefone',
  fone: 'telefone',
  'e-mail': 'email',
  email: 'email',
  interesse: 'observacao',
  interesses: 'observacao',
  observacao: 'observacao',
  observação: 'observacao',
  obs: 'observacao',
  notes: 'observacao',
}

function campoDoCabecalho(cabecalho: string): keyof ContatoImportado | null {
  return CAMPO_POR_CABECALHO[cabecalho.trim().toLowerCase()] ?? null
}

async function parseCsvOuXlsx(file: File): Promise<ContatoImportado[]> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const planilha = workbook.Sheets[workbook.SheetNames[0]]
  if (!planilha) return []
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(planilha, { defval: '' })

  const contatos: ContatoImportado[] = []
  for (const linha of linhas) {
    const contato: ContatoImportado = { nome: '', telefone: '', email: '', observacao: '' }
    for (const [cabecalho, valor] of Object.entries(linha)) {
      const campo = campoDoCabecalho(cabecalho)
      if (campo) contato[campo] = String(valor ?? '').trim()
    }
    if (contato.nome || contato.telefone) contatos.push(contato)
  }
  return contatos
}

function parseVcf(texto: string): ContatoImportado[] {
  const contatos: ContatoImportado[] = []
  const cartoes = texto.split(/BEGIN:VCARD/i).slice(1)
  for (const cartao of cartoes) {
    const contato: ContatoImportado = { nome: '', telefone: '', email: '', observacao: '' }
    for (const linha of cartao.split(/\r?\n/)) {
      const valor = linha.split(':').slice(1).join(':').trim()
      if (!valor) continue
      if (/^FN[:;]/i.test(linha)) contato.nome = valor
      else if (/^TEL/i.test(linha) && !contato.telefone) contato.telefone = valor
      else if (/^EMAIL/i.test(linha) && !contato.email) contato.email = valor
    }
    if (contato.nome || contato.telefone) contatos.push(contato)
  }
  return contatos
}

export async function parseArquivoContatos(file: File): Promise<ContatoImportado[]> {
  const nome = file.name.toLowerCase()
  if (nome.endsWith('.vcf') || nome.endsWith('.vcard')) {
    return parseVcf(await file.text())
  }
  return parseCsvOuXlsx(file)
}

// Contact Picker API — só existe no Chrome/Edge para Android; não tem tipos oficiais no TS.
export function contactPickerDisponivel(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window
}

export async function importarContatosDoCelular(): Promise<ContatoImportado[]> {
  const nav = navigator as unknown as {
    contacts: {
      select: (
        props: string[],
        options: { multiple: boolean }
      ) => Promise<{ name?: string[]; tel?: string[]; email?: string[] }[]>
    }
  }
  const resultados = await nav.contacts.select(['name', 'tel', 'email'], { multiple: true })
  return resultados.map((r) => ({
    nome: r.name?.[0] ?? '',
    telefone: r.tel?.[0] ?? '',
    email: r.email?.[0] ?? '',
    observacao: '',
  }))
}
