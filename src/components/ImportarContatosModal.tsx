import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Upload, Smartphone, Search, Users } from 'lucide-react'
import Modal from '@/components/Modal'
import { createLeadsBulk, adicionarHistoricoBulk } from '@/lib/api'
import {
  parseArquivoContatos,
  contactPickerDisponivel,
  importarContatosDoCelular,
  encontrarLeadExistente,
  type ContatoImportado,
} from '@/lib/importarContatos'
import type { ClienteLead } from '@/types'
import { mensagemErro } from '@/lib/errors'

type Etapa = 'escolher' | 'revisar' | 'importando' | 'concluido'

const LIMITE_INICIAL = 200

export default function ImportarContatosModal({
  leadsExistentes,
  onClose,
  onImportado,
}: {
  leadsExistentes: ClienteLead[]
  onClose: () => void
  onImportado: () => void
}) {
  const inputArquivoRef = useRef<HTMLInputElement>(null)
  const [etapa, setEtapa] = useState<Etapa>('escolher')
  const [erro, setErro] = useState<string | null>(null)
  const [contatos, setContatos] = useState<ContatoImportado[]>([])
  const [nomeOrigem, setNomeOrigem] = useState('')
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [busca, setBusca] = useState('')
  const [mesclarExistentes, setMesclarExistentes] = useState(true)
  const [limiteExibicao, setLimiteExibicao] = useState(LIMITE_INICIAL)
  const [resultado, setResultado] = useState<{ criados: number; mesclados: number } | null>(null)

  const matches = useMemo(
    () => contatos.map((c) => encontrarLeadExistente(c.telefone, leadsExistentes)),
    [contatos, leadsExistentes]
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return contatos
      .map((contato, index) => ({ contato, index, leadExistente: matches[index] }))
      .filter(({ contato }) =>
        !termo || contato.nome.toLowerCase().includes(termo) || contato.telefone.includes(termo)
      )
  }, [contatos, matches, busca])

  const totalNovos = useMemo(() => matches.filter((m) => !m).length, [matches])
  const totalJaExistentes = contatos.length - totalNovos
  const visiveis = filtrados.slice(0, limiteExibicao)

  function carregarContatos(lista: ContatoImportado[], origem: string) {
    setContatos(lista)
    setNomeOrigem(origem)
    const novosSelecionados = new Set<number>()
    lista.forEach((c, i) => {
      if (!encontrarLeadExistente(c.telefone, leadsExistentes)) novosSelecionados.add(i)
    })
    setSelecionados(novosSelecionados)
    setEtapa('revisar')
  }

  async function handleArquivoSelecionado(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    setErro(null)
    try {
      const lista = await parseArquivoContatos(arquivo)
      if (lista.length === 0) {
        setErro('Não encontramos nenhum contato válido nesse arquivo.')
        return
      }
      carregarContatos(lista, arquivo.name)
    } catch {
      setErro('Não conseguimos ler esse arquivo. Confira se é um .csv, .xlsx ou .vcf válido.')
    }
  }

  async function handleImportarDoCelular() {
    setErro(null)
    try {
      const lista = await importarContatosDoCelular()
      if (lista.length === 0) return
      carregarContatos(lista, 'Contatos do celular')
    } catch {
      // usuário cancelou o seletor nativo ou o navegador negou — não é um erro pra mostrar
    }
  }

  function toggleSelecionado(index: number) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  function selecionarTodosNovosFiltrados() {
    setSelecionados((prev) => {
      const next = new Set(prev)
      filtrados.forEach(({ index, leadExistente }) => {
        if (!leadExistente) next.add(index)
      })
      return next
    })
  }

  function limparSelecao() {
    setSelecionados(new Set())
  }

  async function handleConfirmarImportacao() {
    setEtapa('importando')
    setErro(null)
    try {
      const novosLeads = [...selecionados]
        .filter((i) => !matches[i])
        .map((i) => contatos[i])
        .map((c) => ({
          nome: c.nome || c.telefone,
          email: c.email,
          telefone: c.telefone,
          status_crm: 'Lead' as const,
          origem: `Importação de contatos (${nomeOrigem})`,
          observacoes: c.observacao ? `Interesse: ${c.observacao}` : '',
        }))
      const criados = await createLeadsBulk(novosLeads)

      let mesclados = 0
      if (mesclarExistentes) {
        const itensHistorico = contatos
          .map((c, i) => ({ contato: c, leadExistente: matches[i] }))
          .filter(({ leadExistente }) => !!leadExistente)
          .map(({ contato, leadExistente }) => ({
            cliente_id: leadExistente!.id,
            texto: `Contato encontrado na importação "${nomeOrigem}" — telefone já cadastrado.${
              contato.observacao ? ` Interesse informado: ${contato.observacao}.` : ''
            }`,
          }))
        await adicionarHistoricoBulk(itensHistorico)
        mesclados = itensHistorico.length
      }

      setResultado({ criados: criados.length, mesclados })
      setEtapa('concluido')
      onImportado()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao importar contatos'))
      setEtapa('revisar')
    }
  }

  const totalSelecionados = selecionados.size

  const rodape =
    etapa === 'revisar' ? (
      <>
        <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
          Cancelar
        </button>
        <button
          onClick={handleConfirmarImportacao}
          disabled={totalSelecionados === 0 && !mesclarExistentes}
          className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
        >
          Importar {totalSelecionados} selecionado{totalSelecionados === 1 ? '' : 's'}
        </button>
      </>
    ) : etapa === 'concluido' ? (
      <button
        onClick={onClose}
        className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50"
      >
        Fechar
      </button>
    ) : undefined

  return (
    <Modal title="Importar contatos" onClose={onClose} size="xl" footer={rodape}>
      <div className="space-y-4">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        {etapa === 'escolher' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Traga contatos do seu celular ou de uma planilha e escolha quais entram no CRM como
              prospect. Contatos cujo telefone já existe no CRM não são duplicados — a importação
              registra um histórico no cliente já cadastrado.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => inputArquivoRef.current?.click()}
                className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2.5 text-sm font-medium text-foam-50 hover:bg-hull-800"
              >
                <Upload className="h-4 w-4" strokeWidth={1.75} />
                Selecionar arquivo (.csv, .xlsx, .vcf)
              </button>
              <input
                ref={inputArquivoRef}
                type="file"
                accept=".csv,.xlsx,.xls,.vcf,.vcard"
                className="hidden"
                onChange={handleArquivoSelecionado}
              />
              {contactPickerDisponivel() && (
                <button
                  onClick={handleImportarDoCelular}
                  className="flex items-center gap-2 rounded-md border border-foam-200 px-4 py-2.5 text-sm text-hull-900 hover:border-wake-400"
                >
                  <Smartphone className="h-4 w-4" strokeWidth={1.75} />
                  Importar contatos do celular
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              A planilha pode ter as colunas Nome, Telefone, E-mail e Interesse (nessa ordem ou
              não — os nomes das colunas são reconhecidos automaticamente). O botão de importar do
              celular só aparece em navegadores compatíveis (Chrome/Edge no Android).
            </p>
          </div>
        )}

        {etapa === 'revisar' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-hull-900">
                <strong>{contatos.length}</strong> contatos lidos de <em>{nomeOrigem}</em> —{' '}
                <strong>{totalNovos}</strong> novos, <strong>{totalJaExistentes}</strong> já
                cadastrados no CRM.
              </p>
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.75}
                />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou telefone"
                  className="input w-64 pl-8"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                onClick={selecionarTodosNovosFiltrados}
                className="rounded-md border border-foam-200 px-3 py-1.5 text-hull-900 hover:border-wake-400"
              >
                Selecionar todos os novos {busca ? '(filtrados)' : ''}
              </button>
              <button
                onClick={limparSelecao}
                className="rounded-md border border-foam-200 px-3 py-1.5 text-hull-900 hover:border-wake-400"
              >
                Limpar seleção
              </button>
              <label className="ml-auto flex items-center gap-2 text-sm text-hull-900">
                <input
                  type="checkbox"
                  checked={mesclarExistentes}
                  onChange={(e) => setMesclarExistentes(e.target.checked)}
                  className="h-4 w-4 accent-brass-500"
                />
                Registrar no histórico os {totalJaExistentes} que já existem
              </label>
            </div>

            <div className="max-h-[45vh] overflow-y-auto rounded-md border border-foam-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-foam-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Telefone</th>
                    <th className="px-3 py-2">E-mail</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foam-200">
                  {visiveis.map(({ contato, index, leadExistente }) => (
                    <tr key={index} className={leadExistente ? 'bg-foam-100/60' : ''}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          disabled={!!leadExistente}
                          checked={selecionados.has(index)}
                          onChange={() => toggleSelecionado(index)}
                          className="h-4 w-4 accent-brass-500 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-2 text-hull-900">{contato.nome || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{contato.telefone || '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{contato.email || '—'}</td>
                      <td className="px-3 py-2">
                        {leadExistente ? (
                          <span className="rounded-full bg-brass-200/40 px-2 py-0.5 text-[11px] text-hull-900">
                            Já existe: {leadExistente.nome}
                          </span>
                        ) : (
                          <span className="rounded-full bg-signal-green/10 px-2 py-0.5 text-[11px] text-signal-green">
                            Novo
                          </span>
                        )}
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
          </div>
        )}

        {(etapa === 'importando' || etapa === 'concluido') && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Users className="h-8 w-8 text-wake-500" strokeWidth={1.5} />
            {etapa === 'importando' ? (
              <p className="text-sm text-hull-900">Importando contatos…</p>
            ) : (
              <p className="text-sm text-hull-900">
                <strong>{resultado?.criados}</strong> prospect
                {resultado?.criados === 1 ? '' : 's'} criado
                {resultado?.criados === 1 ? '' : 's'} no CRM
                {mesclarExistentes && resultado
                  ? `, ${resultado.mesclados} já existentes atualizados no histórico.`
                  : '.'}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
