import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Upload, Download } from 'lucide-react'
import Modal from '@/components/Modal'
import { createMotoresBulk } from '@/lib/api'
import { parseLinhasPlanilha, baixarModeloPlanilha } from '@/lib/importarPlanilha'
import type { Motor } from '@/types'
import { mensagemErro } from '@/lib/errors'

const CABECALHOS = ['Marca', 'Modelo', 'Potência (HP)', 'Preço (R$)', 'Combustível', 'Ativo']
const LINHA_EXEMPLO = [['Yamaha', 'F350', 350, 250000, 'Gasolina', 'Sim']]

interface LinhaMotor {
  motor: Omit<Motor, 'id'> | null
  erro: string | null
  bruto: Record<string, string>
}

function normalizarNumero(valor: string): number {
  const limpo = valor.replace(/[^\d.,-]/g, '').replace(',', '.')
  return Number(limpo) || 0
}

function mapearLinha(linha: Record<string, string>): LinhaMotor {
  const marca = linha['Marca']?.trim()
  const modelo = linha['Modelo']?.trim()
  if (!marca || !modelo) {
    return { motor: null, erro: 'Marca e Modelo são obrigatórios', bruto: linha }
  }
  const combustivelRaw = (linha['Combustível'] || '').trim().toLowerCase()
  const ativoRaw = (linha['Ativo'] || 'sim').trim().toLowerCase()
  return {
    motor: {
      marca,
      modelo,
      potencia: normalizarNumero(linha['Potência (HP)'] || '0'),
      preco: normalizarNumero(linha['Preço (R$)'] || '0'),
      combustivel: combustivelRaw.startsWith('d') ? 'Diesel' : 'Gasolina',
      ativo: !['não', 'nao', 'n', 'false', '0'].includes(ativoRaw),
    },
    erro: null,
    bruto: linha,
  }
}

export default function ImportarMotoresModal({
  onClose,
  onImportado,
}: {
  onClose: () => void
  onImportado: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [linhas, setLinhas] = useState<LinhaMotor[]>([])
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [erro, setErro] = useState<string | null>(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<number | null>(null)

  const totalValidos = useMemo(() => linhas.filter((l) => !l.erro).length, [linhas])

  async function handleArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    setErro(null)
    setResultado(null)
    try {
      const brutas = await parseLinhasPlanilha(arquivo)
      const mapeadas = brutas
        .filter((l) => Object.values(l).some((v) => v))
        .map(mapearLinha)
      if (mapeadas.length === 0) {
        setErro('Não encontramos nenhuma linha nessa planilha.')
        return
      }
      setLinhas(mapeadas)
      setSelecionados(new Set(mapeadas.map((l, i) => i).filter((i) => !mapeadas[i].erro)))
    } catch {
      setErro('Não conseguimos ler esse arquivo. Confira se é um .csv ou .xlsx válido.')
    }
  }

  function toggle(i: number) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function importar() {
    setImportando(true)
    setErro(null)
    try {
      const motores = [...selecionados]
        .map((i) => linhas[i].motor)
        .filter((m): m is Omit<Motor, 'id'> => m !== null)
      const criados = await createMotoresBulk(motores)
      setResultado(criados.length)
      onImportado()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao importar motores'))
    } finally {
      setImportando(false)
    }
  }

  return (
    <Modal title="Importar motores por planilha" onClose={onClose} size="lg">
      <div className="space-y-4">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        {resultado !== null ? (
          <div className="rounded-md border border-signal-green/30 bg-signal-green/5 p-4 text-sm text-hull-900">
            <strong>{resultado}</strong> motor{resultado === 1 ? '' : 'es'} importado
            {resultado === 1 ? '' : 's'} com sucesso.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => baixarModeloPlanilha('modelo-motores.xlsx', CABECALHOS, LINHA_EXEMPLO)}
                className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2.5 text-sm text-hull-900 hover:border-wake-400"
              >
                <Download className="h-4 w-4" strokeWidth={1.75} />
                Baixar modelo (.xlsx)
              </button>
              <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 hover:bg-hull-800"
              >
                <Upload className="h-4 w-4" strokeWidth={1.75} />
                Selecionar planilha
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleArquivo}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Colunas esperadas: {CABECALHOS.join(', ')}. "Combustível" aceita Gasolina/Diesel;
              "Ativo" aceita Sim/Não (vazio = Sim).
            </p>

            {linhas.length > 0 && (
              <>
                <div className="max-h-[40vh] overflow-y-auto rounded-md border border-foam-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-foam-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="w-10 px-3 py-2"></th>
                        <th className="px-3 py-2">Marca / Modelo</th>
                        <th className="px-3 py-2">Potência</th>
                        <th className="px-3 py-2">Preço</th>
                        <th className="px-3 py-2">Combustível</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foam-200">
                      {linhas.map((linha, i) => (
                        <tr key={i} className={linha.erro ? 'bg-signal-red/5' : ''}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              disabled={!!linha.erro}
                              checked={selecionados.has(i)}
                              onChange={() => toggle(i)}
                              className="h-4 w-4 accent-brass-500 disabled:opacity-40"
                            />
                          </td>
                          <td className="px-3 py-2 text-hull-900">
                            {linha.motor ? `${linha.motor.marca} ${linha.motor.modelo}` : linha.bruto['Marca'] || '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{linha.motor?.potencia ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{linha.motor?.preco ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{linha.motor?.combustivel ?? '—'}</td>
                          <td className="px-3 py-2">
                            {linha.erro ? (
                              <span className="text-[11px] text-signal-red">{linha.erro}</span>
                            ) : (
                              <span className="text-[11px] text-signal-green">Válido</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-slate-500">
                  {totalValidos} de {linhas.length} linhas válidas.
                </p>
              </>
            )}
          </>
        )}
      </div>

      {linhas.length > 0 && resultado === null && (
        <div className="mt-4 flex justify-end gap-2 border-t border-foam-200 pt-4">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
            Cancelar
          </button>
          <button
            onClick={importar}
            disabled={importando || selecionados.size === 0}
            className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
          >
            {importando ? 'Importando…' : `Importar ${selecionados.size} selecionado${selecionados.size === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
      {resultado !== null && (
        <div className="mt-4 flex justify-end border-t border-foam-200 pt-4">
          <button onClick={onClose} className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50">
            Fechar
          </button>
        </div>
      )}
    </Modal>
  )
}
