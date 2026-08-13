import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Anchor, Wrench, Sparkles, ArrowUpDown, Building2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { CampoTexto } from '@/components/campos'
import { buscarEmbarcacaoPorTag, registrarEventoEmbarcacao, getEmpresaPublica, type TipoEventoEmbarcacao } from '@/lib/api'
import { mensagemErro } from '@/lib/errors'
import type { EmbarcacaoPublico, EmpresaConfig, StatusEmbarcacao } from '@/types'

type Estado = 'carregando' | 'invalido' | 'ok'

const STATUS_LABELS: Record<StatusEmbarcacao, string> = {
  ATIVA: 'Ativa',
  EM_MANUTENCAO: 'Em manutenção',
  VENDIDA: 'Vendida',
  INATIVA: 'Inativa',
}

const TITULOS: Record<TipoEventoEmbarcacao, string> = {
  manutencao: 'Registrar manutenção',
  limpeza: 'Registrar limpeza',
  movimentacao: 'Registrar movimentação',
}

export default function EmbarcacaoPublica() {
  const { tagId } = useParams<{ tagId: string }>()
  const [estado, setEstado] = useState<Estado>('carregando')
  const [embarcacao, setEmbarcacao] = useState<EmbarcacaoPublico | null>(null)
  const [empresa, setEmpresa] = useState<Pick<EmpresaConfig, 'id' | 'nome_empresa' | 'logo_url'> | null>(null)
  const [acaoAberta, setAcaoAberta] = useState<TipoEventoEmbarcacao | null>(null)

  useEffect(() => {
    if (!tagId) {
      setEstado('invalido')
      return
    }
    let cancelado = false
    async function carregar() {
      try {
        const emb = await buscarEmbarcacaoPorTag(tagId!)
        if (!emb) {
          if (!cancelado) setEstado('invalido')
          return
        }
        const emp = await getEmpresaPublica(emb.empresa_id)
        if (cancelado) return
        setEmbarcacao(emb)
        setEmpresa(emp)
        setEstado('ok')
      } catch {
        if (!cancelado) setEstado('invalido')
      }
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [tagId])

  if (estado === 'carregando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foam-100 text-sm text-slate-400">
        Carregando…
      </div>
    )
  }

  if (estado === 'invalido' || !embarcacao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foam-100 p-8">
        <div className="max-w-sm rounded-md border border-foam-200 bg-white p-6 text-center">
          <Anchor className="mx-auto mb-3 h-6 w-6 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-hull-900">Chaveiro NFC não encontrado ou inativo.</p>
          <p className="mt-1.5 text-xs text-slate-400">Confira se o código está correto ou fale com a marina.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-foam-100 pb-16">
      <header className="flex items-center gap-3 border-b border-foam-200 bg-white px-6 py-4">
        {empresa?.logo_url ? (
          <img src={empresa.logo_url} alt={empresa.nome_empresa} className="h-9 w-9 object-contain" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-hull-900/[0.06] text-slate-400">
            <Building2 className="h-4 w-4" strokeWidth={1.5} />
          </div>
        )}
        <p className="font-display text-lg text-hull-900">{empresa?.nome_empresa ?? 'Controle de Embarcações'}</p>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 py-6">
        <div>
          {embarcacao.foto_url ? (
            <img
              src={embarcacao.foto_url}
              alt={embarcacao.nome}
              className="aspect-video w-full rounded-md object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-md bg-hull-900/[0.04] text-slate-300">
              <Anchor className="h-8 w-8" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl text-hull-900">
            {embarcacao.nome}
            {embarcacao.comprimento ? ` (${embarcacao.comprimento}m)` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{embarcacao.tipo ?? 'Embarcação'}</p>
          <span className="mt-2 inline-block rounded-full bg-wake-500/10 px-2 py-0.5 text-[11px] font-medium text-wake-600">
            {STATUS_LABELS[embarcacao.status]}
          </span>
        </div>

        {embarcacao.marinheiro_nome && (
          <p className="text-sm text-slate-600">
            Marinheiro responsável: <span className="text-hull-900">{embarcacao.marinheiro_nome}</span>
          </p>
        )}

        <div className="rounded-md border border-foam-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-hull-900">Registrar evento</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setAcaoAberta('manutencao')}
              className="flex flex-col items-center gap-1.5 rounded-md border border-foam-200 p-3 text-xs text-hull-900 hover:border-wake-400"
            >
              <Wrench className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              Manutenção
            </button>
            <button
              onClick={() => setAcaoAberta('limpeza')}
              className="flex flex-col items-center gap-1.5 rounded-md border border-foam-200 p-3 text-xs text-hull-900 hover:border-wake-400"
            >
              <Sparkles className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              Limpeza
            </button>
            <button
              onClick={() => setAcaoAberta('movimentacao')}
              className="flex flex-col items-center gap-1.5 rounded-md border border-foam-200 p-3 text-xs text-hull-900 hover:border-wake-400"
            >
              <ArrowUpDown className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              Movimentação
            </button>
          </div>
        </div>
      </main>

      {acaoAberta && tagId && (
        <RegistrarEventoModal tipoEvento={acaoAberta} tagId={tagId} onClose={() => setAcaoAberta(null)} />
      )}
    </div>
  )
}

function RegistrarEventoModal({
  tipoEvento,
  tagId,
  onClose,
}: {
  tipoEvento: TipoEventoEmbarcacao
  tagId: string
  onClose: () => void
}) {
  const [pin, setPin] = useState('')
  const [tipo, setTipo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [realizadoPor, setRealizadoPor] = useState('')
  const [custo, setCusto] = useState('')
  const [limpoPor, setLimpoPor] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'SUBIDA' | 'DESCIDA'>('DESCIDA')
  const [responsavel, setResponsavel] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  async function enviar() {
    setEnviando(true)
    setErro(null)
    try {
      let dados: Record<string, string | number | null>
      if (tipoEvento === 'manutencao') {
        dados = {
          tipo: tipo || null,
          descricao: descricao || null,
          realizado_por: realizadoPor || null,
          custo: custo ? Number(custo) : null,
        }
      } else if (tipoEvento === 'limpeza') {
        dados = { limpo_por: limpoPor || null, observacoes: observacoes || null }
      } else {
        dados = { tipo_movimentacao: tipoMovimentacao, responsavel: responsavel || null, observacoes: observacoes || null }
      }
      await registrarEventoEmbarcacao({ tagId, pin, tipoEvento, dados })
      setSucesso(true)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao registrar evento'))
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <Modal title={TITULOS[tipoEvento]} onClose={onClose}>
        <div className="py-4 text-center">
          <p className="text-sm text-hull-900">Registrado com sucesso.</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50"
          >
            Fechar
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title={TITULOS[tipoEvento]}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={enviando || !pin.trim()}
            className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
          >
            {enviando ? 'Enviando…' : 'Confirmar'}
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

        {tipoEvento === 'manutencao' && (
          <>
            <CampoTexto label="Tipo de manutenção" value={tipo} onChange={setTipo} />
            <CampoTexto label="Descrição" value={descricao} onChange={setDescricao} />
            <CampoTexto label="Realizado por" value={realizadoPor} onChange={setRealizadoPor} />
            <CampoTexto label="Custo (R$, opcional)" value={custo} onChange={setCusto} />
          </>
        )}
        {tipoEvento === 'limpeza' && (
          <>
            <CampoTexto label="Realizado por" value={limpoPor} onChange={setLimpoPor} />
            <CampoTexto label="Observações" value={observacoes} onChange={setObservacoes} />
          </>
        )}
        {tipoEvento === 'movimentacao' && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Tipo</span>
              <select
                value={tipoMovimentacao}
                onChange={(e) => setTipoMovimentacao(e.target.value as 'SUBIDA' | 'DESCIDA')}
                className="input"
              >
                <option value="DESCIDA">Descida (água)</option>
                <option value="SUBIDA">Subida (terra)</option>
              </select>
            </label>
            <CampoTexto label="Responsável" value={responsavel} onChange={setResponsavel} />
            <CampoTexto label="Observações" value={observacoes} onChange={setObservacoes} />
          </>
        )}

        <div className="border-t border-foam-200 pt-4">
          <CampoTexto label="PIN da marina" value={pin} onChange={setPin} type="password" />
        </div>
      </div>
    </Modal>
  )
}
