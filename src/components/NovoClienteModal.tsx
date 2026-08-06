import { useState } from 'react'
import Modal from '@/components/Modal'
import { CampoTexto } from '@/components/campos'
import { createLead, updateLead } from '@/lib/api'
import type { ClienteLead } from '@/types'

const FORM_VAZIO = {
  nome: '',
  email: '',
  telefone: '',
  tipo_pessoa: 'PF' as 'PF' | 'PJ',
  cpf: '',
  rg: '',
  cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  inscricao_estadual: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  observacoes: '',
}

export default function NovoClienteModal({
  nomeInicial,
  origem,
  clienteExistente,
  textoBotaoSalvar,
  onClose,
  onCriado,
}: {
  nomeInicial?: string
  origem: string
  clienteExistente?: ClienteLead
  textoBotaoSalvar?: string
  onClose: () => void
  onCriado: (lead: ClienteLead) => void
}) {
  const [form, setForm] = useState(() =>
    clienteExistente
      ? {
          nome: clienteExistente.nome,
          email: clienteExistente.email,
          telefone: clienteExistente.telefone,
          tipo_pessoa: clienteExistente.tipo_pessoa ?? ('PF' as 'PF' | 'PJ'),
          cpf: clienteExistente.cpf ?? '',
          rg: clienteExistente.rg ?? '',
          cnpj: clienteExistente.cnpj ?? '',
          razao_social: clienteExistente.razao_social ?? '',
          nome_fantasia: clienteExistente.nome_fantasia ?? '',
          inscricao_estadual: clienteExistente.inscricao_estadual ?? '',
          endereco: clienteExistente.endereco ?? '',
          cidade: clienteExistente.cidade ?? '',
          estado: clienteExistente.estado ?? '',
          cep: clienteExistente.cep ?? '',
          observacoes: clienteExistente.observacoes ?? '',
        }
      : { ...FORM_VAZIO, nome: nomeInicial ?? '' }
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    if (!form.nome.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      const dados = {
        nome: form.nome.trim(),
        email: form.email,
        telefone: form.telefone,
        observacoes: form.observacoes,
        tipo_pessoa: form.tipo_pessoa,
        cpf: form.tipo_pessoa === 'PF' ? form.cpf || null : null,
        rg: form.tipo_pessoa === 'PF' ? form.rg || null : null,
        cnpj: form.tipo_pessoa === 'PJ' ? form.cnpj || null : null,
        razao_social: form.tipo_pessoa === 'PJ' ? form.razao_social || null : null,
        nome_fantasia: form.tipo_pessoa === 'PJ' ? form.nome_fantasia || null : null,
        inscricao_estadual: form.tipo_pessoa === 'PJ' ? form.inscricao_estadual || null : null,
        endereco: form.endereco || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        cep: form.cep || null,
      }
      if (clienteExistente) {
        await updateLead(clienteExistente.id, dados)
        onCriado({ ...clienteExistente, ...dados })
      } else {
        const lead = await createLead({ ...dados, status_crm: 'Lead', origem })
        onCriado(lead)
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao cadastrar cliente')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={clienteExistente ? `Editar ${clienteExistente.nome}` : 'Cadastrar cliente'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando || !form.nome.trim()}
            className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
          >
            {salvando
              ? 'Salvando…'
              : textoBotaoSalvar ?? (clienteExistente ? 'Salvar' : 'Salvar e usar neste orçamento')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        <div className="flex gap-2">
          {(['PF', 'PJ'] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setForm({ ...form, tipo_pessoa: tipo })}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                form.tipo_pessoa === tipo
                  ? 'border-brass-500 bg-brass-200/20 text-hull-900'
                  : 'border-foam-200 text-slate-500 hover:border-wake-400'
              }`}
            >
              {tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </button>
          ))}
        </div>

        <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <CampoTexto
            label="Telefone"
            value={form.telefone}
            onChange={(v) => setForm({ ...form, telefone: v })}
          />
        </div>

        {form.tipo_pessoa === 'PF' ? (
          <div className="grid grid-cols-2 gap-4">
            <CampoTexto label="CPF" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} />
            <CampoTexto label="RG" value={form.rg} onChange={(v) => setForm({ ...form, rg: v })} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} />
              <CampoTexto
                label="Inscrição estadual"
                value={form.inscricao_estadual}
                onChange={(v) => setForm({ ...form, inscricao_estadual: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CampoTexto
                label="Razão social"
                value={form.razao_social}
                onChange={(v) => setForm({ ...form, razao_social: v })}
              />
              <CampoTexto
                label="Nome fantasia"
                value={form.nome_fantasia}
                onChange={(v) => setForm({ ...form, nome_fantasia: v })}
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Endereço" value={form.endereco} onChange={(v) => setForm({ ...form, endereco: v })} />
          <CampoTexto label="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Estado" value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} />
          <CampoTexto label="CEP" value={form.cep} onChange={(v) => setForm({ ...form, cep: v })} />
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-hull-900">Observações</span>
          <textarea
            rows={3}
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            className="input resize-none"
          />
        </label>
      </div>
    </Modal>
  )
}
