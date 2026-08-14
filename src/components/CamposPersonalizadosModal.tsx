import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { CampoTexto } from '@/components/campos'
import {
  listCamposPersonalizados,
  createCampoPersonalizado,
  updateCampoPersonalizado,
  deleteCampoPersonalizado,
} from '@/lib/api'
import type { CampoPersonalizado, TipoCampoPersonalizado, ContextoCampoPersonalizado } from '@/types'
import { mensagemErro } from '@/lib/errors'

const TIPOS_CAMPO: { valor: TipoCampoPersonalizado; label: string }[] = [
  { valor: 'texto', label: 'Texto' },
  { valor: 'numero', label: 'Número' },
  { valor: 'booleano', label: 'Sim/Não' },
  { valor: 'selecao', label: 'Seleção' },
]

const UNIDADES_SUGERIDAS = ['m', 'cm', 'mm', 'kg', 'lt']

export default function CamposPersonalizadosModal({
  categoriaId,
  grupoId,
  contexto,
  titulo,
  onClose,
}: {
  categoriaId?: string
  grupoId?: string
  contexto?: ContextoCampoPersonalizado
  titulo: string
  onClose: () => void
}) {
  const [campos, setCampos] = useState<CampoPersonalizado[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoCampoPersonalizado>('texto')
  const [opcoesTexto, setOpcoesTexto] = useState('')
  const [unidade, setUnidade] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const todos = await listCamposPersonalizados()
      setCampos(
        todos.filter((c) =>
          categoriaId ? c.categoria_id === categoriaId : contexto ? c.contexto === contexto : c.grupo_id === grupoId
        )
      )
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao carregar campos'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function limparForm() {
    setEditandoId(null)
    setNome('')
    setTipo('texto')
    setOpcoesTexto('')
    setUnidade('')
  }

  function iniciarEdicao(c: CampoPersonalizado) {
    setEditandoId(c.id)
    setNome(c.nome)
    setTipo(c.tipo)
    setOpcoesTexto((c.opcoes ?? []).join(', '))
    setUnidade(c.unidade ?? '')
  }

  async function salvarCampo() {
    if (!nome.trim()) return
    setSalvando(true)
    try {
      const opcoes =
        tipo === 'selecao'
          ? opcoesTexto
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : null
      const unidadeFinal = tipo === 'numero' ? unidade.trim() || null : null
      if (editandoId) {
        await updateCampoPersonalizado(editandoId, {
          nome: nome.trim(),
          tipo,
          opcoes,
          unidade: unidadeFinal,
        })
      } else {
        await createCampoPersonalizado({
          categoria_id: categoriaId ?? null,
          grupo_id: grupoId ?? null,
          contexto: contexto ?? null,
          nome: nome.trim(),
          tipo,
          opcoes,
          unidade: unidadeFinal,
          ordem: campos.length,
        })
      }
      limparForm()
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao salvar campo'))
    } finally {
      setSalvando(false)
    }
  }

  async function excluirCampo(id: string) {
    if (!confirm('Excluir este campo? Valores já preenchidos serão perdidos.')) return
    try {
      await deleteCampoPersonalizado(id)
      if (editandoId === id) limparForm()
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao excluir campo'))
    }
  }

  return (
    <Modal title={`Campos personalizados — ${titulo}`} onClose={onClose} size="md">
      <div className="space-y-4">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}
        {carregando ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : (
          <div className="space-y-2">
            {campos.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum campo personalizado ainda.</p>
            ) : (
              campos.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md border border-foam-200 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="text-hull-900">{c.nome}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {TIPOS_CAMPO.find((t) => t.valor === c.tipo)?.label}
                      {c.tipo === 'selecao' && c.opcoes?.length ? ` (${c.opcoes.join(', ')})` : ''}
                      {c.tipo === 'numero' && c.unidade ? ` (${c.unidade})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => iniciarEdicao(c)} className="text-wake-500 hover:text-wake-600">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => excluirCampo(c.id)}
                      className="text-signal-red/80 hover:text-signal-red"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="space-y-3 border-t border-foam-200 pt-4">
          <p className="text-sm font-medium text-hull-900">
            {editandoId ? 'Editar campo' : 'Novo campo'}
          </p>
          <CampoTexto label="Nome" value={nome} onChange={setNome} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-hull-900">Tipo</span>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCampoPersonalizado)}
              className="input"
            >
              {TIPOS_CAMPO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {tipo === 'selecao' && (
            <CampoTexto label="Opções (separadas por vírgula)" value={opcoesTexto} onChange={setOpcoesTexto} />
          )}
          {tipo === 'numero' && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Unidade (opcional)
              </span>
              <input
                list="unidades-sugeridas"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="m, cm, mm, kg, lt…"
                className="input"
              />
              <datalist id="unidades-sugeridas">
                {UNIDADES_SUGERIDAS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </label>
          )}
          <div className="flex gap-2">
            <button
              onClick={salvarCampo}
              disabled={salvando || !nome.trim()}
              className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
            >
              {salvando ? 'Salvando…' : editandoId ? 'Salvar alteração' : 'Adicionar campo'}
            </button>
            {editandoId && (
              <button
                onClick={limparForm}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
