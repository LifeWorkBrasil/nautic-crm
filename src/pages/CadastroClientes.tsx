import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Upload,
  Download,
  Trash2,
  RotateCcw,
  Pencil,
  Mail,
  Phone,
  ArrowUpRight,
  Search,
  MessageSquareText,
} from 'lucide-react'
import Modal from '@/components/Modal'
import NovoClienteModal from '@/components/NovoClienteModal'
import ImportarContatosModal from '@/components/ImportarContatosModal'
import EnvioMassaModal from '@/components/EnvioMassaModal'
import { linkWhatsapp } from '@/lib/whatsapp'
import { exportarTabelaExcel } from '@/lib/exportarExcel'
import { usePermissoes } from '@/lib/PermissoesContext'
import {
  listLeads,
  listUsuarios,
  updateLeadStatus,
  excluirLead,
  listLeadsLixeira,
  restaurarLead,
} from '@/lib/api'
import type { ClienteLead, StatusCRM, UsuarioPerfil } from '@/types'
import { mensagemErro } from '@/lib/errors'

const STATUS_STYLES: Record<StatusCRM, string> = {
  Lead: 'bg-wake-500/10 text-wake-600',
  'Proposta Enviada': 'bg-brass-200/40 text-hull-900',
  Negociação: 'bg-brass-200/60 text-hull-900',
  'Venda Concluída': 'bg-signal-green/10 text-signal-green',
  Perdido: 'bg-foam-200 text-slate-500',
}

const LIMITE_INICIAL = 200

export default function CadastroClientes() {
  const { temPermissao } = usePermissoes()
  const podeInserir = temPermissao('dados:contatos:inserir')
  const podeExcluir = temPermissao('dados:contatos:excluir')
  const podeExportar = temPermissao('dados:contatos:exportar')

  const [clientes, setClientes] = useState<ClienteLead[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [limiteExibicao, setLimiteExibicao] = useState(LIMITE_INICIAL)

  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<ClienteLead | null>(null)
  const [importandoContatos, setImportandoContatos] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [movendoId, setMovendoId] = useState<string | null>(null)

  const [mostrandoLixeira, setMostrandoLixeira] = useState(false)
  const [lixeira, setLixeira] = useState<ClienteLead[]>([])
  const [carregandoLixeira, setCarregandoLixeira] = useState(false)
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null)

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [enviandoMassa, setEnviandoMassa] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const [cl, us] = await Promise.all([listLeads(), listUsuarios()])
      setClientes(cl)
      setUsuarios(us)
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao carregar clientes'))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function nomeVendedor(vendedorId: string | null | undefined): string | null {
    if (!vendedorId) return null
    return usuarios.find((u) => u.id === vendedorId)?.nome ?? null
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.telefone.includes(termo) ||
        c.email.toLowerCase().includes(termo)
    )
  }, [clientes, busca])

  const visiveis = filtrados.slice(0, limiteExibicao)
  const visiveisComTelefone = visiveis.filter((c) => c.telefone)
  const todosVisiveisSelecionados =
    visiveisComTelefone.length > 0 && visiveisComTelefone.every((c) => selecionados.has(c.id))
  const clientesSelecionados = clientes.filter((c) => selecionados.has(c.id) && c.telefone)

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelecionarTodosVisiveis() {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (todosVisiveisSelecionados) {
        visiveisComTelefone.forEach((c) => next.delete(c.id))
      } else {
        visiveisComTelefone.forEach((c) => next.add(c.id))
      }
      return next
    })
  }

  async function handleMoverParaAtendimento(cliente: ClienteLead) {
    setMovendoId(cliente.id)
    try {
      await updateLeadStatus(cliente.id, 'Proposta Enviada')
      setClientes((prev) =>
        prev.map((c) => (c.id === cliente.id ? { ...c, status_crm: 'Proposta Enviada' } : c))
      )
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao mover cliente'))
    } finally {
      setMovendoId(null)
    }
  }

  async function handleExcluir(cliente: ClienteLead) {
    if (!confirm(`Excluir "${cliente.nome}"? Fica na lixeira por 24h, depois some de vez.`)) return
    setExcluindoId(cliente.id)
    try {
      await excluirLead(cliente.id)
      setClientes((prev) => prev.filter((c) => c.id !== cliente.id))
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao excluir cliente'))
    } finally {
      setExcluindoId(null)
    }
  }

  function handleExportar() {
    exportarTabelaExcel(
      'contatos',
      ['Nome', 'Telefone', 'E-mail', 'Status', 'Vendedor', 'Origem', 'Cadastrado em'],
      filtrados.map((c) => [
        c.nome,
        c.telefone,
        c.email,
        c.status_crm,
        nomeVendedor(c.vendedor_id) ?? '',
        c.origem,
        new Date(c.criado_em).toLocaleDateString('pt-BR'),
      ])
    )
  }

  function abrirLixeira() {
    setMostrandoLixeira(true)
    setCarregandoLixeira(true)
    listLeadsLixeira()
      .then(setLixeira)
      .catch((e) => setErro(mensagemErro(e, 'Erro ao carregar lixeira')))
      .finally(() => setCarregandoLixeira(false))
  }

  async function handleRestaurar(cliente: ClienteLead) {
    setRestaurandoId(cliente.id)
    try {
      await restaurarLead(cliente.id)
      setLixeira((prev) => prev.filter((c) => c.id !== cliente.id))
      await carregar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao restaurar cliente'))
    } finally {
      setRestaurandoId(null)
    }
  }

  return (
    <div className="p-8">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">Base completa</p>
          <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
            Cadastro de Clientes
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {selecionados.size > 0 && (
            <button
              onClick={() => setEnviandoMassa(true)}
              className="flex items-center gap-2 rounded-md border border-wake-400 bg-wake-500/5 px-3 py-2.5 text-sm text-wake-600 transition-colors hover:bg-wake-500/10"
            >
              <MessageSquareText className="h-4 w-4" strokeWidth={1.75} />
              Enviar mensagem ({clientesSelecionados.length})
            </button>
          )}
          <button
            onClick={abrirLixeira}
            className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2.5 text-sm text-hull-900 transition-colors hover:border-wake-400"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            Lixeira
          </button>
          {podeExportar && (
            <button
              onClick={handleExportar}
              className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2.5 text-sm text-hull-900 transition-colors hover:border-wake-400"
            >
              <Download className="h-4 w-4" strokeWidth={1.75} />
              Exportar
            </button>
          )}
          {podeInserir && (
            <button
              onClick={() => setImportandoContatos(true)}
              className="flex items-center gap-2 rounded-md border border-foam-200 px-3 py-2.5 text-sm text-hull-900 transition-colors hover:border-wake-400"
            >
              <Upload className="h-4 w-4" strokeWidth={1.75} />
              Importar contatos
            </button>
          )}
          {podeInserir && (
            <button
              onClick={() => setCriando(true)}
              className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Novo cliente
            </button>
          )}
        </div>
      </header>

      {erro && (
        <div className="mb-5 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          <strong className="text-hull-900">{clientes.length}</strong> clientes cadastrados
        </p>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail"
            className="input w-72 pl-8"
          />
        </div>
      </div>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-foam-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-foam-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={todosVisiveisSelecionados}
                    onChange={toggleSelecionarTodosVisiveis}
                    className="h-4 w-4 accent-brass-500"
                    title="Selecionar todos os visíveis com telefone"
                  />
                </th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Cadastrado em</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foam-200">
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-slate-400">
                    {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                  </td>
                </tr>
              )}
              {visiveis.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-foam-100/60">
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      disabled={!cliente.telefone}
                      checked={selecionados.has(cliente.id)}
                      onChange={() => toggleSelecionado(cliente.id)}
                      className="h-4 w-4 accent-brass-500 disabled:opacity-30"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-hull-900">{cliente.nome}</td>
                  <td className="px-4 py-2.5 text-slate-500">{cliente.telefone || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{cliente.email || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_STYLES[cliente.status_crm]}`}
                    >
                      {cliente.status_crm}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {nomeVendedor(cliente.vendedor_id) ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{cliente.origem || '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                    {new Date(cliente.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3 text-slate-400">
                      {cliente.telefone && (
                        <a
                          href={linkWhatsapp(cliente.telefone)}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp"
                          className="hover:text-wake-500"
                        >
                          <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </a>
                      )}
                      {cliente.email && (
                        <a href={`mailto:${cliente.email}`} title="E-mail" className="hover:text-wake-500">
                          <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </a>
                      )}
                      {cliente.status_crm === 'Lead' && (
                        <button
                          onClick={() => handleMoverParaAtendimento(cliente)}
                          disabled={movendoId === cliente.id}
                          title="Mover para atendimento (aparece no funil do CRM)"
                          className="hover:text-wake-500 disabled:opacity-40"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditando(cliente)}
                        title="Editar"
                        className="hover:text-wake-500"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      {podeExcluir && (
                        <button
                          onClick={() => handleExcluir(cliente)}
                          disabled={excluindoId === cliente.id}
                          title="Excluir"
                          className="hover:text-signal-red disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length > limiteExibicao && (
            <button
              onClick={() => setLimiteExibicao((n) => n + LIMITE_INICIAL)}
              className="w-full border-t border-foam-200 px-3 py-2 text-center text-sm text-wake-500 hover:bg-foam-100"
            >
              Mostrar mais {Math.min(LIMITE_INICIAL, filtrados.length - limiteExibicao)} de{' '}
              {filtrados.length}
            </button>
          )}
        </div>
      )}

      {criando && (
        <NovoClienteModal
          origem="Cadastro manual"
          textoBotaoSalvar="Salvar cliente"
          onClose={() => setCriando(false)}
          onCriado={(lead) => {
            setClientes((prev) => [lead, ...prev])
            setCriando(false)
          }}
        />
      )}

      {editando && (
        <NovoClienteModal
          origem={editando.origem}
          clienteExistente={editando}
          onClose={() => setEditando(null)}
          onCriado={(lead) => {
            setClientes((prev) => prev.map((c) => (c.id === lead.id ? lead : c)))
            setEditando(null)
          }}
        />
      )}

      {importandoContatos && (
        <ImportarContatosModal
          leadsExistentes={clientes}
          onClose={() => setImportandoContatos(false)}
          onImportado={carregar}
        />
      )}

      {enviandoMassa && (
        <EnvioMassaModal
          contatos={clientesSelecionados}
          onClose={() => setEnviandoMassa(false)}
          onConcluido={() => setSelecionados(new Set())}
        />
      )}

      {mostrandoLixeira && (
        <Modal title="Lixeira" onClose={() => setMostrandoLixeira(false)} size="md">
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Clientes excluídos ficam aqui por 24h antes de serem apagados de vez.
            </p>
            {carregandoLixeira ? (
              <p className="text-sm text-slate-400">Carregando…</p>
            ) : lixeira.length === 0 ? (
              <p className="text-sm text-slate-400">Lixeira vazia.</p>
            ) : (
              <ul className="space-y-2">
                {lixeira.map((cliente) => {
                  const horasRestantes = Math.max(
                    0,
                    (new Date(cliente.deletado_em!).getTime() + 24 * 60 * 60 * 1000 - Date.now()) /
                      (1000 * 60 * 60)
                  )
                  return (
                    <li
                      key={cliente.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-foam-200 p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-hull-900">{cliente.nome}</p>
                        <p className="text-[11px] text-slate-400">
                          {horasRestantes < 1
                            ? 'Some em menos de 1h'
                            : `Some em ${Math.round(horasRestantes)}h`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestaurar(cliente)}
                        disabled={restaurandoId === cliente.id}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-foam-200 px-3 py-1.5 text-xs text-hull-900 hover:border-wake-400 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {restaurandoId === cliente.id ? 'Restaurando…' : 'Restaurar'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
