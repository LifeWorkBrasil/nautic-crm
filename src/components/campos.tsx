export function CampoTexto({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-hull-900">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  )
}

export function CampoTextArea({
  label,
  value,
  onChange,
  rows = 6,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-hull-900">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="input resize-y font-mono text-xs leading-relaxed"
      />
    </label>
  )
}

export function CampoNumero({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-hull-900">{label}</span>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input"
      />
    </label>
  )
}
