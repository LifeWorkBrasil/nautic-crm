import { useEffect, useState } from 'react'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { CampoTexto, CampoNumero } from '@/components/campos'
import {
  listCaptacoes,
  createCaptacao,
  deleteCaptacao,
  updateCaptacao,
  listCaptacaoItens,
  createCaptacaoItem,
  updateCaptacaoItem,
  deleteCaptacaoItem,
  listFotosCaptacao,
  uploadFotoCaptacao,
  deleteFotoCaptacao,
  listCategorias,
  listSubcategorias,
  publicarCaptacao,
} from '@/lib/api'
import type {
  Captacao,
  CaptacaoItem,
  CaptacaoFoto,
  CategoriaProduto,
  SubcategoriaProduto,
  StatusCaptacao,
} from '@/types'

const STATUS_OPCOES: StatusCaptacao[] = ['Em captação', 'Aprovado', 'Publicado', 'Descartado']

const STATUS_STYLES: Record<StatusCaptacao, string> = {
  'Em captação': 'bg-wake-500/10 text-wake-600',
  Aprovado: 'bg-brass-400/20 text-hull-900',
  Publicado: 'bg-signal-green/10 text-signal-green',
  Descartado: 'bg-slate-400/10 text-slate-500',
}

const NOVA_CAPTACAO_VAZIA = { nome: '', categoria_id: '', subcategoria_id: '' }

export default function CaptacaoPage() {
  const [captacoes, setCaptacoes] = useState<Captacao[]>([])
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('')

  const [criandoNova, setCriandoNova] = useState(false)
  const [novaCaptacao, setNovaCaptacao] = useState(NOVA_CAPTACAO_VAZIA)
  const [salvandoNova, setSalvandoNova] = useState(false)

  const [editando, setEditando] = useState<Captacao | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      const [c, cat, sub] = await Promise.all([
        listCaptacoes(filtroStatus || undefined),
        listCategorias(),
        listSubcategorias(),
      ])
      setCaptacoes(c)
      setCategorias(cat)
      setSubcategorias(sub)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar captações')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus])

  const subcategoriasDaNova = subcategorias.filter((s) => s.categoria_id === novaCaptacao.categoria_id)

  async function salvarNovaCaptacao() {
    setSalvandoNova(true)
    try {
      const criada = await createCaptacao({
        nome: novaCaptacao.nome,
        categoria_id: novaCaptacao.categoria_id,
        subcategoria_id: novaCaptacao.subcategoria_id || null,
        cliente_nome: null,
        cliente_telefone: null,
        local: null,
        ano: null,
        fabricante: null,
        modelo: null,
        identificador: null,
        responsavel: null,
        cor: null,
        motorizacao_tipo: null,
        motorizacao_potencia: null,
        motorizacao_marca_modelo: null,
        combustivel: null,
        horas_uso: null,
        ultima_revisao: null,
        bateria_motor: null,
        bateria_servico: null,
        estado_geral: null,
        observacoes: null,
      })
      setCriandoNova(false)
      setNovaCaptacao(NOVA_CAPTACAO_VAZIA)
      await carregar()
      setEditando(criada)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar captação')
    } finally {
      setSalvandoNova(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta captação e todos os itens/fotos vinculados?')) return
    try {
      await deleteCaptacao(id)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir captação')
    }
  }

  return (
    <div className="p-8">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">Estoque</p>
          <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
            Captação
          </h1>
        </div>
        <button
          onClick={() => setCriandoNova(true)}
          className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nova captação
        </button>
      </header>

      {erro && (
        <div className="mb-5 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroStatus('')}
          className={`rounded-full px-3 py-1 text-xs ${
            !filtroStatus ? 'bg-hull-900 text-foam-50' : 'bg-foam-200 text-slate-500'
          }`}
        >
          Todas
        </button>
        {STATUS_OPCOES.map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`rounded-full px-3 py-1 text-xs ${
              filtroStatus === s ? 'bg-hull-900 text-foam-50' : 'bg-foam-200 text-slate-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : captacoes.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma captação ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {captacoes.map((c) => {
            const subcategoria = subcategorias.find((s) => s.id === c.subcategoria_id)
            return (
              <article key={c.id} className="rounded-md border border-foam-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg text-hull-900">{c.nome}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{subcategoria?.nome ?? '—'}</p>
                {c.cliente_nome && (
                  <p className="mt-2 text-xs text-slate-600">Cliente: {c.cliente_nome}</p>
                )}
                <div className="mt-3 flex gap-3 border-t border-foam-200 pt-3">
                  <button
                    onClick={() => setEditando(c)}
                    className="text-xs text-wake-500 hover:text-wake-600"
                  >
                    Abrir
                  </button>
                  <button
                    onClick={() => excluir(c.id)}
                    className="ml-auto flex items-center gap-1 text-xs text-signal-red/80 hover:text-signal-red"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Excluir
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {criandoNova && (
        <Modal
          title="Nova captação"
          onClose={() => setCriandoNova(false)}
          footer={
            <>
              <button
                onClick={() => setCriandoNova(false)}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={salvarNovaCaptacao}
                disabled={
                  salvandoNova || !novaCaptacao.nome.trim() || !novaCaptacao.categoria_id
                }
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvandoNova ? 'Criando…' : 'Criar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <CampoTexto
              label="Nome"
              value={novaCaptacao.nome}
              onChange={(v) => setNovaCaptacao({ ...novaCaptacao, nome: v })}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Categoria</span>
              <select
                value={novaCaptacao.categoria_id}
                onChange={(e) =>
                  setNovaCaptacao({ ...novaCaptacao, categoria_id: e.target.value, subcategoria_id: '' })
                }
                className="input"
              >
                <option value="">Selecione…</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">
                Subcategoria (opcional por enquanto)
              </span>
              <select
                value={novaCaptacao.subcategoria_id}
                onChange={(e) => setNovaCaptacao({ ...novaCaptacao, subcategoria_id: e.target.value })}
                className="input"
                disabled={!novaCaptacao.categoria_id}
              >
                <option value="">Selecione…</option>
                {subcategoriasDaNova.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      )}

      {editando && (
        <DetalheCaptacao
          captacao={editando}
          categorias={categorias}
          subcategorias={subcategorias}
          onClose={() => setEditando(null)}
          onAlterado={carregar}
        />
      )}
    </div>
  )
}

function DetalheCaptacao({
  captacao,
  categorias,
  subcategorias,
  onClose,
  onAlterado,
}: {
  captacao: Captacao
  categorias: CategoriaProduto[]
  subcategorias: SubcategoriaProduto[]
  onClose: () => void
  onAlterado: () => void
}) {
  const [form, setForm] = useState(captacao)
  const [salvando, setSalvando] = useState(false)
  const [itens, setItens] = useState<CaptacaoItem[]>([])
  const [fotos, setFotos] = useState<CaptacaoFoto[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [mostrarPublicar, setMostrarPublicar] = useState(false)
  const [descricaoFinal, setDescricaoFinal] = useState('')
  const [precoFinal, setPrecoFinal] = useState(0)

  useEffect(() => {
    Promise.all([listCaptacaoItens(captacao.id), listFotosCaptacao(captacao.id)])
      .then(([i, f]) => {
        setItens(i)
        setFotos(f)
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar itens/fotos'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captacao.id])

  const subcategoriasDaCategoria = subcategorias.filter((s) => s.categoria_id === form.categoria_id)

  async function salvar() {
    setSalvando(true)
    try {
      await updateCaptacao(captacao.id, {
        nome: form.nome,
        categoria_id: form.categoria_id,
        subcategoria_id: form.subcategoria_id || null,
        cliente_nome: form.cliente_nome,
        cliente_telefone: form.cliente_telefone,
        local: form.local,
        ano: form.ano,
        fabricante: form.fabricante,
        modelo: form.modelo,
        identificador: form.identificador,
        responsavel: form.responsavel,
        cor: form.cor,
        motorizacao_tipo: form.motorizacao_tipo,
        motorizacao_potencia: form.motorizacao_potencia,
        motorizacao_marca_modelo: form.motorizacao_marca_modelo,
        combustivel: form.combustivel,
        horas_uso: form.horas_uso,
        ultima_revisao: form.ultima_revisao,
        bateria_motor: form.bateria_motor,
        bateria_servico: form.bateria_servico,
        estado_geral: form.estado_geral,
        observacoes: form.observacoes,
        status: form.status,
      })
      onAlterado()
      onClose()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar captação')
    } finally {
      setSalvando(false)
    }
  }

  async function adicionarItem() {
    try {
      const item = await createCaptacaoItem({
        captacao_id: captacao.id,
        nome: '',
        descricao: '',
        quantidade: null,
        estado: '',
        marca: '',
      })
      setItens((prev) => [...prev, item])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar item')
    }
  }

  function salvarItem(item: CaptacaoItem, patch: Partial<CaptacaoItem>) {
    setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)))
    updateCaptacaoItem(item.id, patch).catch((e) =>
      setErro(e instanceof Error ? e.message : 'Erro ao salvar item')
    )
  }

  async function removerItem(id: string) {
    try {
      await deleteCaptacaoItem(id)
      setItens((prev) => prev.filter((i) => i.id !== id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover item')
    }
  }

  async function handleUploadFoto(file: File) {
    setEnviandoFoto(true)
    try {
      const foto = await uploadFotoCaptacao(captacao.id, file)
      setFotos((prev) => [...prev, foto])
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar foto')
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function handleExcluirFoto(foto: CaptacaoFoto) {
    if (!confirm('Excluir esta foto?')) return
    try {
      await deleteFotoCaptacao(foto)
      setFotos((prev) => prev.filter((f) => f.id !== foto.id))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir foto')
    }
  }

  async function handlePublicar() {
    setPublicando(true)
    try {
      await publicarCaptacao(captacao.id, { descricao: descricaoFinal, preco_base: precoFinal })
      onAlterado()
      onClose()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao publicar captação')
    } finally {
      setPublicando(false)
    }
  }

  const podePublicar = form.status === 'Aprovado' && !form.produto_id

  return (
    <Modal
      title={`Captação — ${captacao.nome}`}
      onClose={onClose}
      size="xl"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
          >
            Fechar
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
      <div className="space-y-6">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        <div className="flex items-center justify-between">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as StatusCaptacao })}
            className="input w-48"
          >
            {STATUS_OPCOES.filter((s) => s !== 'Publicado' || form.status === 'Publicado').map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {podePublicar && (
            <button
              onClick={() => setMostrarPublicar(true)}
              className="flex items-center gap-2 rounded-md bg-signal-green px-4 py-2 text-sm font-medium text-foam-50 hover:opacity-90"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
              Publicar no catálogo
            </button>
          )}
          {form.produto_id && (
            <span className="text-xs text-signal-green">Já publicado no catálogo</span>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-hull-900">Dados gerais</p>
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Categoria</span>
              <select
                value={form.categoria_id}
                onChange={(e) =>
                  setForm({ ...form, categoria_id: e.target.value, subcategoria_id: '' })
                }
                className="input"
              >
                <option value="">Selecione…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Subcategoria</span>
              <select
                value={form.subcategoria_id ?? ''}
                onChange={(e) => setForm({ ...form, subcategoria_id: e.target.value })}
                className="input"
              >
                <option value="">Selecione…</option>
                {subcategoriasDaCategoria.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </label>
            <CampoTexto
              label="Cliente"
              value={form.cliente_nome ?? ''}
              onChange={(v) => setForm({ ...form, cliente_nome: v })}
            />
            <CampoTexto
              label="Telefone do cliente"
              value={form.cliente_telefone ?? ''}
              onChange={(v) => setForm({ ...form, cliente_telefone: v })}
            />
            <CampoTexto
              label="Local/Marina"
              value={form.local ?? ''}
              onChange={(v) => setForm({ ...form, local: v })}
            />
            <CampoNumero
              label="Ano"
              value={form.ano ?? 0}
              onChange={(v) => setForm({ ...form, ano: v || null })}
            />
            <CampoTexto
              label="Fabricante"
              value={form.fabricante ?? ''}
              onChange={(v) => setForm({ ...form, fabricante: v })}
            />
            <CampoTexto
              label="Modelo"
              value={form.modelo ?? ''}
              onChange={(v) => setForm({ ...form, modelo: v })}
            />
            <CampoTexto
              label="Identificador (HIN/chassi/placa)"
              value={form.identificador ?? ''}
              onChange={(v) => setForm({ ...form, identificador: v })}
            />
            <CampoTexto
              label="Responsável"
              value={form.responsavel ?? ''}
              onChange={(v) => setForm({ ...form, responsavel: v })}
            />
            <CampoTexto
              label="Cor"
              value={form.cor ?? ''}
              onChange={(v) => setForm({ ...form, cor: v })}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-hull-900">Motorização</p>
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto
              label="Tipo"
              value={form.motorizacao_tipo ?? ''}
              onChange={(v) => setForm({ ...form, motorizacao_tipo: v })}
            />
            <CampoTexto
              label="Potência"
              value={form.motorizacao_potencia ?? ''}
              onChange={(v) => setForm({ ...form, motorizacao_potencia: v })}
            />
            <CampoTexto
              label="Marca/Modelo do motor"
              value={form.motorizacao_marca_modelo ?? ''}
              onChange={(v) => setForm({ ...form, motorizacao_marca_modelo: v })}
            />
            <CampoTexto
              label="Combustível"
              value={form.combustivel ?? ''}
              onChange={(v) => setForm({ ...form, combustivel: v })}
            />
            <CampoTexto
              label="Horas de uso"
              value={form.horas_uso ?? ''}
              onChange={(v) => setForm({ ...form, horas_uso: v })}
            />
            <CampoTexto
              label="Última revisão"
              value={form.ultima_revisao ?? ''}
              onChange={(v) => setForm({ ...form, ultima_revisao: v })}
            />
            <CampoTexto
              label="Bateria de motor"
              value={form.bateria_motor ?? ''}
              onChange={(v) => setForm({ ...form, bateria_motor: v })}
            />
            <CampoTexto
              label="Bateria de serviço"
              value={form.bateria_servico ?? ''}
              onChange={(v) => setForm({ ...form, bateria_servico: v })}
            />
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-hull-900">Estado geral</span>
          <textarea
            rows={2}
            value={form.estado_geral ?? ''}
            onChange={(e) => setForm({ ...form, estado_geral: e.target.value })}
            className="input resize-none"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-hull-900">Observações</span>
          <textarea
            rows={3}
            value={form.observacoes ?? ''}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            className="input resize-none"
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-hull-900">Itens do checklist</p>
            <button
              onClick={adicionarItem}
              className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Adicionar item
            </button>
          </div>
          {itens.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum item ainda.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-[10px] uppercase tracking-wide text-slate-400">
                <span className="col-span-3">Nome</span>
                <span className="col-span-4">Característica</span>
                <span className="col-span-1">Qtd</span>
                <span className="col-span-2">Estado</span>
                <span className="col-span-2">Marca</span>
              </div>
              {itens.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center gap-2 rounded-md border border-foam-200 p-2"
                >
                  <input
                    value={item.nome}
                    onChange={(e) => salvarItem(item, { nome: e.target.value })}
                    className="input col-span-3"
                  />
                  <input
                    value={item.descricao ?? ''}
                    onChange={(e) => salvarItem(item, { descricao: e.target.value })}
                    className="input col-span-4"
                  />
                  <input
                    type="number"
                    value={item.quantidade ?? ''}
                    onChange={(e) =>
                      salvarItem(item, {
                        quantidade: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="input col-span-1"
                  />
                  <input
                    value={item.estado ?? ''}
                    onChange={(e) => salvarItem(item, { estado: e.target.value })}
                    className="input col-span-1"
                  />
                  <input
                    value={item.marca ?? ''}
                    onChange={(e) => salvarItem(item, { marca: e.target.value })}
                    className="input col-span-2"
                  />
                  <button
                    onClick={() => removerItem(item.id)}
                    className="text-signal-red/80 hover:text-signal-red"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-hull-900">Fotos</p>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-wake-500 hover:text-wake-600">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              {enviandoFoto ? 'Enviando…' : 'Adicionar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={enviandoFoto}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadFoto(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          {fotos.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma foto ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {fotos.map((foto) => (
                <div
                  key={foto.id}
                  className="group relative overflow-hidden rounded-md border border-foam-200"
                >
                  <img src={foto.url_imagem} alt="" className="h-24 w-full object-cover" />
                  <button
                    onClick={() => handleExcluirFoto(foto)}
                    className="absolute right-1 top-1 rounded-full bg-hull-950/70 p-1 text-foam-100 opacity-0 transition-opacity hover:text-signal-red group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {mostrarPublicar && (
        <Modal
          title="Publicar no catálogo"
          onClose={() => setMostrarPublicar(false)}
          footer={
            <>
              <button
                onClick={() => setMostrarPublicar(false)}
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublicar}
                disabled={publicando}
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {publicando ? 'Publicando…' : 'Publicar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-hull-900">Descrição final</span>
              <textarea
                rows={3}
                value={descricaoFinal}
                onChange={(e) => setDescricaoFinal(e.target.value)}
                className="input resize-none"
              />
            </label>
            <CampoNumero label="Preço base (R$)" value={precoFinal} onChange={setPrecoFinal} />
          </div>
        </Modal>
      )}
    </Modal>
  )
}
