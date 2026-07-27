// Gera um arquivo .xls abrindo direto no Excel ou no Google Sheets (upload/importar), sem
// precisar de nenhuma biblioteca externa nem de integração OAuth com o Google: um <table> HTML
// servido com o content-type do Excel é reconhecido nativamente por ambos.

function escaparHtml(valor: string): string {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function exportarTabelaExcel(
  nomeArquivo: string,
  colunas: string[],
  linhas: (string | number)[][]
): void {
  const cabecalho = colunas.map((c) => `<th>${escaparHtml(c)}</th>`).join('')
  const corpo = linhas
    .map((linha) => `<tr>${linha.map((v) => `<td>${escaparHtml(String(v))}</td>`).join('')}</tr>`)
    .join('')

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"></head>
<body><table border="1"><thead><tr>${cabecalho}</tr></thead><tbody>${corpo}</tbody></table></body>
</html>`

  const blob = new Blob(['﻿', html], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo.endsWith('.xls') ? nomeArquivo : `${nomeArquivo}.xls`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
