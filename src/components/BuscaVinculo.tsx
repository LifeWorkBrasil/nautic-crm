import { useMemo, useState } from 'react'

export default function BuscaVinculo({
  label,
  itens,
  valorId,
  onSelecionar,
  onCriarNovo,
  placeholder,
  permitirCriar = true,
}: {
  label: string
  itens: { id: string; nome: string }[]
  valorId: string | null
  onSelecionar: (id: string | null) => void
  onCriarNovo: (nomeDigitado: string) => void
  placeholder?: string
  permitirCriar?: boolean
}) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const selecionado = itens.find((i) => i.id === valorId) ?? null

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return []
    return itens.filter((i) => i.nome.toLowerCase().includes(termo)).slice(0, 8)
  }, [itens, busca])

  if (selecionado) {
    return (
      <div>
        <span className="mb-1.5 block text-sm font-medium text-hull-900">{label}</span>
        <div className="flex items-center justify-between rounded-md border border-foam-200 px-3 py-2 text-sm text-hull-900">
          <span>{selecionado.nome}</span>
          <button onClick={() => onSelecionar(null)} className="text-xs text-wake-500 hover:text-wake-600">
            Trocar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <span className="mb-1.5 block text-sm font-medium text-hull-900">{label}</span>
      <input
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder={placeholder}
        className="input"
      />
      {aberto && busca.trim() && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-foam-200 bg-white shadow-lg">
          {resultados.map((r) => (
            <button
              key={r.id}
              onMouseDown={() => {
                onSelecionar(r.id)
                setBusca('')
              }}
              className="block w-full px-3 py-2 text-left text-sm text-hull-900 hover:bg-foam-100"
            >
              {r.nome}
            </button>
          ))}
          {permitirCriar && (
            <button
              onMouseDown={() => {
                onCriarNovo(busca.trim())
                setBusca('')
              }}
              className="block w-full border-t border-foam-200 px-3 py-2 text-left text-sm text-wake-500 hover:bg-foam-100"
            >
              + Cadastrar "{busca.trim()}"
            </button>
          )}
          {!permitirCriar && resultados.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-400">Nenhum resultado.</p>
          )}
        </div>
      )}
    </div>
  )
}
