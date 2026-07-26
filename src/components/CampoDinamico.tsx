import { CampoTexto, CampoNumero } from '@/components/campos'
import type { CampoPersonalizado } from '@/types'

export default function CampoDinamico({
  campo,
  valor,
  onChange,
}: {
  campo: CampoPersonalizado
  valor: string | number | boolean | null
  onChange: (v: string | number | boolean | null) => void
}) {
  if (campo.tipo === 'booleano') {
    return (
      <label className="flex items-center gap-2 text-sm text-hull-900">
        <input
          type="checkbox"
          checked={Boolean(valor)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-brass-500"
        />
        {campo.nome}
      </label>
    )
  }
  if (campo.tipo === 'numero') {
    return (
      <CampoNumero
        label={campo.unidade ? `${campo.nome} (${campo.unidade})` : campo.nome}
        value={typeof valor === 'number' ? valor : 0}
        onChange={onChange}
      />
    )
  }
  if (campo.tipo === 'selecao') {
    return (
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-hull-900">{campo.nome}</span>
        <select
          value={typeof valor === 'string' ? valor : ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="input"
        >
          <option value="">Selecione…</option>
          {(campo.opcoes ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    )
  }
  return (
    <CampoTexto
      label={campo.nome}
      value={typeof valor === 'string' ? valor : ''}
      onChange={(v) => onChange(v || null)}
    />
  )
}
