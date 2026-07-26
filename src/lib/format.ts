export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatPreco(v: number): string {
  if (!v) return 'Consulte o preço'
  return formatBRL(v)
}
