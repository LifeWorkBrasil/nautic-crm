import { useEffect, useState } from 'react'
import { Ship, Zap, PackagePlus, Plus, ImagePlus, Pencil, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import {
  listModelos,
  createModelo,
  updateModelo,
  deleteModelo,
  uploadFotoModelo,
  listMotores,
  createMotor,
  updateMotor,
  deleteMotor,
  listAcessorios,
  createAcessorio,
  updateAcessorio,
  deleteAcessorio,
} from '@/lib/api'
import type { ModeloBarco, Motor, Acessorio } from '@/types'

type Aba = 'modelos' | 'motores' | 'acessorios'

const TABS: { key: Aba; label: string; icon: typeof Ship }[] = [
  { key: 'modelos', label: 'Modelos', icon: Ship },
  { key: 'motores', label: 'Motores', icon: Zap },
  { key: 'acessorios', label: 'Acessórios', icon: PackagePlus },
]

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Parametrizacao() {
  const [aba, setAba] = useState<Aba>('modelos')

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">
          Configurações do sistema
        </p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          Parametrização
        </h1>
      </header>

      <div className="mb-6 flex gap-1 border-b border-foam-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              aba === key
                ? 'border-brass-500 text-hull-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {aba === 'modelos' && <AbaModelos />}
      {aba === 'motores' && <AbaMotores />}
      {aba === 'acessorios' && <AbaAcessorios />}
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
    >
      <Plus className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  )
}

function ErroBanner({ erro }: { erro: string | null }) {
  if (!erro) return null
  return (
    <div className="mb-4 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
      {erro}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modelos
// ---------------------------------------------------------------------------

const MODELO_VAZIO = { nome: '', descricao: '', preco_base: 0, comprimento: null as number | null }

function AbaModelos() {
  const [itens, setItens] = useState<ModeloBarco[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<ModeloBarco | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(MODELO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      setItens(await listModelos())
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar modelos')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirCriacao() {
    setForm(MODELO_VAZIO)
    setCriando(true)
  }

  function abrirEdicao(m: ModeloBarco) {
    setForm({
      nome: m.nome,
      descricao: m.descricao,
      preco_base: m.preco_base,
      comprimento: m.comprimento,
    })
    setEditando(m)
  }

  async function salvar() {
    setSalvando(true)
    try {
      if (editando) {
        await updateModelo(editando.id, form)
      } else {
        await createModelo(form)
      }
      setEditando(null)
      setCriando(false)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar modelo')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este modelo? Acessórios e orçamentos vinculados também serão removidos.'))
      return
    try {
      await deleteModelo(id)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir modelo')
    }
  }

  async function handleFoto(modeloId: string, file: File) {
    setEnviandoFoto(modeloId)
    try {
      await uploadFotoModelo(modeloId, file)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar foto')
    } finally {
      setEnviandoFoto(null)
    }
  }

  const modalAberto = criando || editando !== null

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end">
        <AddButton label="Novo modelo" onClick={abrirCriacao} />
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum modelo cadastrado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itens.map((modelo) => (
            <article key={modelo.id} className="rounded-md border border-foam-200 bg-white p-4">
              <label className="mb-3 flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-md bg-hull-900/[0.04] text-slate-400 hover:bg-hull-900/[0.07]">
                {modelo.foto_principal_url ? (
                  <img
                    src={modelo.foto_principal_url}
                    alt={modelo.nome}
                    className="h-full w-full object-cover"
                  />
                ) : enviandoFoto === modelo.id ? (
                  <span className="text-xs">Enviando…</span>
                ) : (
                  <span className="flex flex-col items-center gap-1 text-xs">
                    <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
                    Adicionar foto
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFoto(modelo.id, file)
                  }}
                />
              </label>
              <p className="font-display text-lg text-hull-900">{modelo.nome}</p>
              <p className="text-xs text-slate-500">{modelo.descricao}</p>
              <div className="mt-3 flex items-center justify-between border-t border-foam-200 pt-3">
                <span className="font-mono text-sm text-hull-900">
                  {formatBRL(modelo.preco_base)}
                </span>
                <span className="text-xs text-slate-400">
                  {modelo.comprimento ? `${modelo.comprimento} m` : '—'}
                </span>
              </div>
              <div className="mt-3 flex gap-2 border-t border-foam-200 pt-3">
                <button
                  onClick={() => abrirEdicao(modelo)}
                  className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Editar
                </button>
                <button
                  onClick={() => excluir(modelo.id)}
                  className="ml-auto flex items-center gap-1 text-xs text-signal-red/80 hover:text-signal-red"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.nome}` : 'Novo modelo'}
          onClose={() => {
            setCriando(false)
            setEditando(null)
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setCriando(false)
                  setEditando(null)
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <CampoTexto
              label="Descrição"
              value={form.descricao}
              onChange={(v) => setForm({ ...form, descricao: v })}
            />
            <div className="grid grid-cols-2 gap-4">
              <CampoNumero
                label="Preço base (R$)"
                value={form.preco_base}
                onChange={(v) => setForm({ ...form, preco_base: v })}
              />
              <CampoNumero
                label="Comprimento (m)"
                value={form.comprimento ?? 0}
                onChange={(v) => setForm({ ...form, comprimento: v || null })}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Motores
// ---------------------------------------------------------------------------

const MOTOR_VAZIO = {
  marca: '',
  modelo: '',
  potencia: 0,
  preco: 0,
  combustivel: 'Gasolina' as 'Gasolina' | 'Diesel',
  ativo: true,
}

function AbaMotores() {
  const [itens, setItens] = useState<Motor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<Motor | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(MOTOR_VAZIO)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      setItens(await listMotores())
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar motores')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirCriacao() {
    setForm(MOTOR_VAZIO)
    setCriando(true)
  }

  function abrirEdicao(m: Motor) {
    setForm({
      marca: m.marca,
      modelo: m.modelo,
      potencia: m.potencia,
      preco: m.preco,
      combustivel: m.combustivel,
      ativo: m.ativo,
    })
    setEditando(m)
  }

  async function salvar() {
    setSalvando(true)
    try {
      if (editando) {
        await updateMotor(editando.id, form)
      } else {
        await createMotor(form)
      }
      setEditando(null)
      setCriando(false)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar motor')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(m: Motor) {
    try {
      await updateMotor(m.id, { ativo: !m.ativo })
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar motor')
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este motor?')) return
    try {
      await deleteMotor(id)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir motor')
    }
  }

  const modalAberto = criando || editando !== null

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end">
        <AddButton label="Novo motor" onClick={abrirCriacao} />
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Marca / Modelo</th>
                <th className="px-4 py-3 font-medium">Potência</th>
                <th className="px-4 py-3 font-medium">Combustível</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {itens.map((motor) => (
                <tr key={motor.id}>
                  <td className="px-4 py-3 text-hull-900">
                    {motor.marca} {motor.modelo}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{motor.potencia} HP</td>
                  <td className="px-4 py-3 text-slate-600">{motor.combustivel}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{formatBRL(motor.preco)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => alternarAtivo(motor)}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        motor.ativo
                          ? 'bg-signal-green/10 text-signal-green'
                          : 'bg-slate-400/10 text-slate-500'
                      }`}
                    >
                      {motor.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => abrirEdicao(motor)} className="text-wake-500 hover:text-wake-600">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => excluir(motor.id)}
                        className="text-signal-red/80 hover:text-signal-red"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.marca} ${editando.modelo}` : 'Novo motor'}
          onClose={() => {
            setCriando(false)
            setEditando(null)
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setCriando(false)
                  setEditando(null)
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.marca.trim() || !form.modelo.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto label="Marca" value={form.marca} onChange={(v) => setForm({ ...form, marca: v })} />
              <CampoTexto
                label="Modelo"
                value={form.modelo}
                onChange={(v) => setForm({ ...form, modelo: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CampoNumero
                label="Potência (HP)"
                value={form.potencia}
                onChange={(v) => setForm({ ...form, potencia: v })}
              />
              <CampoNumero label="Preço (R$)" value={form.preco} onChange={(v) => setForm({ ...form, preco: v })} />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Combustível</span>
              <select
                value={form.combustivel}
                onChange={(e) =>
                  setForm({ ...form, combustivel: e.target.value as 'Gasolina' | 'Diesel' })
                }
                className="input"
              >
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
              </select>
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Acessórios
// ---------------------------------------------------------------------------

const ACESSORIO_VAZIO = { nome: '', preco: 0, categoria: '', modelo_id: null as string | null }

function AbaAcessorios() {
  const [itens, setItens] = useState<Acessorio[]>([])
  const [modelos, setModelos] = useState<ModeloBarco[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<Acessorio | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState(ACESSORIO_VAZIO)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const [ac, md] = await Promise.all([listAcessorios(), listModelos()])
      setItens(ac)
      setModelos(md)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar acessórios')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirCriacao() {
    setForm(ACESSORIO_VAZIO)
    setCriando(true)
  }

  function abrirEdicao(a: Acessorio) {
    setForm({ nome: a.nome, preco: a.preco, categoria: a.categoria, modelo_id: a.modelo_id })
    setEditando(a)
  }

  async function salvar() {
    setSalvando(true)
    try {
      if (editando) {
        await updateAcessorio(editando.id, form)
      } else {
        await createAcessorio(form)
      }
      setEditando(null)
      setCriando(false)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar acessório')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este acessório?')) return
    try {
      await deleteAcessorio(id)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir acessório')
    }
  }

  const modalAberto = criando || editando !== null

  return (
    <div>
      <ErroBanner erro={erro} />
      <div className="mb-4 flex justify-end">
        <AddButton label="Novo acessório" onClick={abrirCriacao} />
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-foam-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Vínculo</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {itens.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-hull-900">{item.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{item.categoria}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.modelo_id
                      ? modelos.find((m) => m.id === item.modelo_id)?.nome ?? '—'
                      : 'Universal'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{formatBRL(item.preco)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => abrirEdicao(item)} className="text-wake-500 hover:text-wake-600">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => excluir(item.id)}
                        className="text-signal-red/80 hover:text-signal-red"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.nome}` : 'Novo acessório'}
          onClose={() => {
            setCriando(false)
            setEditando(null)
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setCriando(false)
                  setEditando(null)
                }}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome.trim()}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <div className="grid grid-cols-2 gap-4">
              <CampoNumero label="Preço (R$)" value={form.preco} onChange={(v) => setForm({ ...form, preco: v })} />
              <CampoTexto
                label="Categoria"
                value={form.categoria}
                onChange={(v) => setForm({ ...form, categoria: v })}
              />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Vincular a um modelo (opcional)
              </span>
              <select
                value={form.modelo_id ?? ''}
                onChange={(e) => setForm({ ...form, modelo_id: e.target.value || null })}
                className="input"
              >
                <option value="">Universal (todos os modelos)</option>
                {modelos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Campos de formulário compartilhados
// ---------------------------------------------------------------------------

function CampoTexto({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-hull-900">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </label>
  )
}

function CampoNumero({
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
