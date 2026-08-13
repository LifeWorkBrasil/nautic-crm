// CSV de texto puro (não o truque de tabela HTML de exportarExcel.ts) — o app
// NFC Tools precisa de um .csv real pra importar em lote a gravação em série.
export function exportarTagsCsv(
  tags: { tag_id: string; url: string; embarcacao_nome?: string; modelo_nfc?: string }[],
  nomeArquivo: string,
  formato: 'nfc-tools' | 'completo'
): void {
  let conteudo: string
  if (formato === 'nfc-tools') {
    conteudo = tags.map((t) => t.url).join('\r\n')
  } else {
    const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`
    const linhas = tags.map((t) =>
      [escapar(t.tag_id), escapar(t.url), escapar(t.embarcacao_nome ?? ''), escapar(t.modelo_nfc ?? '')].join(',')
    )
    conteudo = ['tag_id,url,embarcacao,modelo_nfc', ...linhas].join('\r\n')
  }

  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
