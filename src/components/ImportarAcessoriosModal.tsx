import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Upload, Download } from 'lucide-react'
import Modal from '@/components/Modal'
import { createAcessorio } from '@/lib/api'
import { parseLinhasPlanilha, baixarModeloPlanilha } from '@/lib/importarPlanilha'
import type { Acessorio, Produto, SubcategoriaProduto } from '@/types'
import { mensagemErro } from '@/lib/errors'

const CABECALHOS = ['Nome', 'Preço (R$)', 'Categoria', 'Vínculo (produto)', 'Subcategorias']
const LINHA_EXEMPLO = [['Guincho de proa 800W', 5800, 'Acessório', '', 'Todas']]

type AcessorioSemId = Omit<Acessorio, 'id' | 'subcategoria_ids'> & { subcategoria_ids?: string[] }

interface LinhaAcessorio {
  acessorio: AcessorioSemId | null
  erro: string | null
  aviso: string | null
  bruto: Record<string, string>
}

function normalizarNumero(valor: string): number {
  const limpo = valor.replace(/[^\d.,-]/g, '').replace(',', '.')
  return Number(limpo) || 0
}

function mapearLinha(
  linha: Record<string, string>,
  produtos: Produto[],
  subcategorias: SubcategoriaProduto[]
): LinhaAcessorio {
  const nome = linha['Nome']?.trim()
  if (!nome) return { acessorio: null, erro: 'Nome é obrigatório', aviso: null, bruto: linha }

  const vinculoNome = linha['Vínculo (produto)']?.trim()
  let produto_id: string | null = null
  let avisoVinculo: string | null = null
  if (vinculoNome) {
    const produto = produtos.find((p) => p.nome.toLowerCase() === vinculoNome.toLowerCase())
    if (produto) produto_id = produto.id
    else avisoVinculo = `Produto "${vinculoNome}" não encontrado — ficará Universal`
  }

  const nomesSubcategorias = (linha['Subcategorias'] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.toLowerCase() !== 'todas')
  const subcategoria_ids: string[] = []
  const naoEncontradas: string[] = []
  for (const nomeSub of nomesSubcategorias) {
    const sub = subcategorias.find((s) => s.nome.toLowerCase() === nomeSub.toLowerCase())
    if (sub) subcategoria_ids.push(sub.id)
    else naoEncontradas.push(nomeSub)
  }

  const aviso =
    [avisoVinculo, naoEncontradas.length ? `Subcategorias não encontradas: ${naoEncontradas.join(', ')}` : null]
      .filter(Boolean)
      .join(' ') || null

  return {
    acessorio: {
      nome,
      preco: normalizarNumero(linha['Preço (R$)'] || '0'),
      categoria: linha['Categoria']?.trim() || '',
      produto_id,
      subcategoria_ids,
    },
    erro: null,
    aviso,
    bruto: linha,
  }
}

export default function ImportarAcessoriosModal({
  produtos,
  subcategorias,
  onClose,
  onImportado,
}: {
  produtos: Produto[]
  subcategorias: SubcategoriaProduto[]
  onClose: () => void
  onImportado: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [linhas, setLinhas] = useState<LinhaAcessorio[]>([])
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
        .map((l) => mapearLinha(l, produtos, subcategorias))
      if (mapeadas.length === 0) {
        setErro('Não encontramos nenhuma linha nessa planilha.')
        return
      }
      setLinhas(mapeadas)
      setSelecionados(new Set(mapeadas.map((_, i) => i).filter((i) => !mapeadas[i].erro)))
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
      let criados = 0
      for (const i of selecionados) {
        const acessorio = linhas[i].acessorio
        if (!acessorio) continue
        await createAcessorio(acessorio)
        criados++
      }
      setResultado(criados)
      onImportado()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao importar acessórios'))
    } finally {
      setImportando(false)
    }
  }

  return (
    <Modal title="Importar acessórios por planilha" onClose={onClose} size="lg">
      <div className="space-y-4">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        {resultado !== null ? (
          <div className="rounded-md border border-signal-green/30 bg-signal-green/5 p-4 text-sm text-hull-900">
            <strong>{resultado}</strong> acessório{resultado === 1 ? '' : 's'} importado
            {resultado === 1 ? '' : 's'} com sucesso.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  baixarModeloPlanilha('modelo-acessorios.xlsx', CABECALHOS, LINHA_EXEMPLO)
                }
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
              Colunas esperadas: {CABECALHOS.join(', ')}. "Vínculo (produto)" vazio = Universal;
              "Subcategorias" aceita vários nomes separados por vírgula, ou "Todas".
            </p>

            {linhas.length > 0 && (
              <>
                <div className="max-h-[40vh] overflow-y-auto rounded-md border border-foam-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-foam-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="w-10 px-3 py-2"></th>
                        <th className="px-3 py-2">Nome</th>
                        <th className="px-3 py-2">Preço</th>
                        <th className="px-3 py-2">Categoria</th>
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
                            {linha.acessorio?.nome ?? linha.bruto['Nome'] ?? '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{linha.acessorio?.preco ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{linha.acessorio?.categoria || '—'}</td>
                          <td className="px-3 py-2">
                            {linha.erro ? (
                              <span className="text-[11px] text-signal-red">{linha.erro}</span>
                            ) : linha.aviso ? (
                              <span className="text-[11px] text-brass-500">{linha.aviso}</span>
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
            {importando
              ? 'Importando…'
              : `Importar ${selecionados.size} selecionado${selecionados.size === 1 ? '' : 's'}`}
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
