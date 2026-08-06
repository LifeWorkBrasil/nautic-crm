// Parsing e geração de modelo pra importação de planilhas (.xlsx/.csv) — reaproveita o mesmo
// parser usado na importação de contatos, mas genérico: devolve as linhas cruas com os
// cabeçalhos originais, cada tela de importação decide como mapear pras colunas que precisa.

export async function parseLinhasPlanilha(file: File): Promise<Record<string, string>[]> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const planilha = workbook.Sheets[workbook.SheetNames[0]]
  if (!planilha) return []
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(planilha, { defval: '' })
  return linhas.map((linha) => {
    const normalizada: Record<string, string> = {}
    for (const [chave, valor] of Object.entries(linha)) {
      normalizada[chave.trim()] = String(valor ?? '').trim()
    }
    return normalizada
  })
}

export async function baixarModeloPlanilha(
  nomeArquivo: string,
  cabecalhos: string[],
  linhasExemplo: (string | number)[][]
): Promise<void> {
  const XLSX = await import('xlsx')
  const planilha = XLSX.utils.aoa_to_sheet([cabecalhos, ...linhasExemplo])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, planilha, 'Modelo')
  XLSX.writeFile(workbook, nomeArquivo.endsWith('.xlsx') ? nomeArquivo : `${nomeArquivo}.xlsx`)
}
