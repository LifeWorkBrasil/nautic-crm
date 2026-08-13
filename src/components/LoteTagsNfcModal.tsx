import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/Modal'
import { criarTagsEmbarcacaoLote, listEmbarcacoes, listTodasTagsEmbarcacoes } from '@/lib/api'
import { mensagemErro } from '@/lib/errors'
import { exportarTagsCsv } from '@/lib/exportarCsv'
import { NFC_MODELS, computeUrlNdefBytes, getModelCapacity, type ModeloNfc as ModeloNfcCapacidade } from '@/lib/nfcCapacity'
import type { Embarcacao, ModoGravacaoNfc } from '@/types'

const MARCAS_DIACRITICAS = new RegExp('[̀-ͯ]', 'g')

function slugTag(nome: string, existentes: Set<string>): string {
  const base = nome
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
  let candidato = base || 'TAG'
  let n = 1
  while (existentes.has(candidato)) {
    n += 1
    candidato = `${base}-${n}`
  }
  existentes.add(candidato)
  return candidato
}

export default function LoteTagsNfcModal({
  onClose,
  onCriadas,
}: {
  onClose: () => void
  onCriadas: () => void
}) {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [embarcacoesSemTag, setEmbarcacoesSemTag] = useState<Embarcacao[]>([])
  const [linhas, setLinhas] = useState<{ embarcacao_id: string; embarcacao_nome: string; tag_id: string; incluir: boolean }[]>([])
  const [modelo, setModelo] = useState<ModeloNfcCapacidade>('NTAG213')
  const [modoGravacao, setModoGravacao] = useState<ModoGravacaoNfc>('HUB')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      try {
        const [embarcacoes, todasTags] = await Promise.all([listEmbarcacoes(), listTodasTagsEmbarcacoes()])
        const idsComTagAtiva = new Set(todasTags.filter((t) => t.ativo).map((t) => t.embarcacao_id))
        const semTag = embarcacoes.filter((e) => !idsComTagAtiva.has(e.id))
        const tagsExistentes = new Set(todasTags.map((t) => t.tag_id.toUpperCase()))
        setEmbarcacoesSemTag(semTag)
        setLinhas(
          semTag.map((e) => ({
            embarcacao_id: e.id,
            embarcacao_nome: e.nome,
            tag_id: slugTag(e.nome, tagsExistentes),
            incluir: true,
          }))
        )
        setErro(null)
      } catch (e) {
        setErro(mensagemErro(e, 'Erro ao carregar embarcações'))
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const capacidade = getModelCapacity(modelo, null)

  function urlDaLinha(tagId: string): string {
    return `${window.location.origin}${import.meta.env.BASE_URL}embarcacao/${tagId || 'TAG-XXX'}`
  }

  const selecionadas = useMemo(() => linhas.filter((l) => l.incluir && l.tag_id.trim()), [linhas])
  const algumaExcedeCapacidade = selecionadas.some((l) => computeUrlNdefBytes(urlDaLinha(l.tag_id)) > capacidade)

  function atualizarLinha(embarcacaoId: string, patch: Partial<(typeof linhas)[number]>) {
    setLinhas((prev) => prev.map((l) => (l.embarcacao_id === embarcacaoId ? { ...l, ...patch } : l)))
  }

  async function confirmar() {
    if (selecionadas.length === 0) return
    setSalvando(true)
    try {
      const criadas = await criarTagsEmbarcacaoLote(
        selecionadas.map((l) => ({
          embarcacao_id: l.embarcacao_id,
          tag_id: l.tag_id.trim(),
          modelo_nfc: modelo,
          modo_gravacao: modoGravacao,
        }))
      )
      exportarTagsCsv(
        criadas.map((t) => ({
          tag_id: t.tag_id,
          url: urlDaLinha(t.tag_id),
          modelo_nfc: t.modelo_nfc,
        })),
        `tags-lote-${new Date().toISOString().slice(0, 10)}`,
        'nfc-tools'
      )
      onCriadas()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao gerar tags em lote'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Gerar tags NFC em lote"
      onClose={onClose}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={salvando || selecionadas.length === 0 || algumaExcedeCapacidade}
            className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
          >
            {salvando ? 'Gerando…' : `Gerar ${selecionadas.length} tag(s) e exportar CSV`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-3 py-2 text-sm text-signal-red">
            {erro}
          </div>
        )}

        {carregando ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : embarcacoesSemTag.length === 0 ? (
          <p className="text-sm text-slate-400">Todas as embarcações já têm uma tag NFC ativa.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">Modelo do chip (todas as tags)</span>
                <select value={modelo} onChange={(e) => setModelo(e.target.value as ModeloNfcCapacidade)} className="input">
                  {Object.entries(NFC_MODELS).map(([key, m]) => (
                    <option key={key} value={key}>
                      {m.label}
                      {m.usableBytes ? ` (${m.usableBytes} bytes)` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-hull-900">Modo de gravação</span>
                <select
                  value={modoGravacao}
                  onChange={(e) => setModoGravacao(e.target.value as ModoGravacaoNfc)}
                  className="input"
                >
                  <option value="HUB">Hub (recomendado)</option>
                  <option value="DIRECT">Direto</option>
                </select>
              </label>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-md border border-foam-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-10 px-3 py-2" />
                    <th className="px-3 py-2 font-medium">Embarcação</th>
                    <th className="px-3 py-2 font-medium">Código da tag</th>
                    <th className="px-3 py-2 font-medium">Bytes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foam-200 bg-white">
                  {linhas.map((linha) => {
                    const bytes = computeUrlNdefBytes(urlDaLinha(linha.tag_id))
                    const cabe = bytes <= capacidade
                    return (
                      <tr key={linha.embarcacao_id}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={linha.incluir}
                            onChange={(e) => atualizarLinha(linha.embarcacao_id, { incluir: e.target.checked })}
                            className="h-4 w-4 accent-brass-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-hull-900">{linha.embarcacao_nome}</td>
                        <td className="px-3 py-2">
                          <input
                            value={linha.tag_id}
                            onChange={(e) =>
                              atualizarLinha(linha.embarcacao_id, { tag_id: e.target.value.toUpperCase() })
                            }
                            className="input font-mono text-xs"
                          />
                        </td>
                        <td className={`px-3 py-2 text-xs ${cabe ? 'text-slate-400' : 'text-signal-red'}`}>
                          {bytes}/{capacidade}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {algumaExcedeCapacidade && (
              <p className="text-xs text-signal-red">
                Algum código de tag excede a capacidade do modelo escolhido — encurte o código ou troque o modelo.
              </p>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
