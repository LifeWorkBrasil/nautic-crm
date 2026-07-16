import { useEffect, useState } from 'react'
import { Plus, Pencil, ShieldCheck } from 'lucide-react'
import Modal from '@/components/Modal'
import { CampoTexto, CampoNumero } from '@/components/campos'
import { usePermissoes } from '@/lib/PermissoesContext'
import {
  listUsuarios,
  listTabsSistema,
  listCategorias,
  listSubcategorias,
  listPermissoesUsuario,
  criarUsuario,
  atualizarUsuario,
  atualizarPermissoes,
} from '@/lib/api'
import type { UsuarioPerfil, TabSistema, CategoriaProduto, SubcategoriaProduto } from '@/types'

type UsuarioForm = {
  nome: string
  email: string
  senha: string
  comissao_percentual: number
  ativo: boolean
}

const FORM_VAZIO: UsuarioForm = { nome: '', email: '', senha: '', comissao_percentual: 0, ativo: true }

export default function Admin() {
  const { perfil, carregando: carregandoPermissoes } = usePermissoes()

  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([])
  const [tabsSistema, setTabsSistema] = useState<TabSistema[]>([])
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<UsuarioPerfil | null>(null)
  const [form, setForm] = useState<UsuarioForm>(FORM_VAZIO)
  const [tabKeysSelecionadas, setTabKeysSelecionadas] = useState<Set<string>>(new Set())

  async function carregar() {
    setCarregando(true)
    try {
      const [u, t, c, s] = await Promise.all([
        listUsuarios(),
        listTabsSistema(),
        listCategorias(),
        listSubcategorias(),
      ])
      setUsuarios(u)
      setTabsSistema(t)
      setCategorias(c)
      setSubcategorias(s)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (perfil?.is_admin) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil?.is_admin])

  function abrirCriacao() {
    setForm(FORM_VAZIO)
    setTabKeysSelecionadas(new Set())
    setCriando(true)
  }

  async function abrirEdicao(usuario: UsuarioPerfil) {
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      comissao_percentual: usuario.comissao_percentual,
      ativo: usuario.ativo,
    })
    setEditando(usuario)
    try {
      const chaves = await listPermissoesUsuario(usuario.id)
      setTabKeysSelecionadas(new Set(chaves))
    } catch {
      setTabKeysSelecionadas(new Set())
    }
  }

  function fechar() {
    setCriando(false)
    setEditando(null)
  }

  function toggleTabKey(chave: string) {
    setTabKeysSelecionadas((prev) => {
      const proximo = new Set(prev)
      proximo.has(chave) ? proximo.delete(chave) : proximo.add(chave)
      return proximo
    })
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    try {
      if (editando) {
        await atualizarUsuario(editando.id, {
          nome: form.nome,
          comissao_percentual: form.comissao_percentual,
          ativo: form.ativo,
        })
        await atualizarPermissoes(editando.id, Array.from(tabKeysSelecionadas))
      } else {
        await criarUsuario({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          comissao_percentual: form.comissao_percentual,
          tab_keys: Array.from(tabKeysSelecionadas),
        })
      }
      fechar()
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar usuário')
    } finally {
      setSalvando(false)
    }
  }

  if (carregandoPermissoes) {
    return <div className="p-8 text-sm text-slate-400">Carregando…</div>
  }

  if (!perfil?.is_admin) {
    return (
      <div className="p-8">
        <p className="text-sm text-signal-red">Acesso restrito a administradores.</p>
      </div>
    )
  }

  const modalAberto = criando || editando !== null

  return (
    <div className="p-8">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-wake-500">
          Usuários e permissões
        </p>
        <h1 className="wake-underline mt-1 inline-block font-display text-3xl text-hull-900">
          Admin
        </h1>
      </header>

      <div className="mb-4 flex justify-end">
        <button
          onClick={abrirCriacao}
          className="flex items-center gap-2 rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 transition-colors hover:bg-hull-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Novo usuário
        </button>
      </div>

      {erro && (
        <div className="mb-4 rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : (
        <div className="space-y-2">
          {usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="flex items-center justify-between rounded-md border border-foam-200 bg-white p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg text-hull-900">{usuario.nome}</p>
                  {usuario.is_admin && (
                    <span className="flex items-center gap-1 rounded-full bg-brass-400/15 px-2 py-0.5 text-[10px] font-medium text-brass-600">
                      <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                      Admin
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      usuario.ativo ? 'bg-signal-green/10 text-signal-green' : 'bg-foam-200 text-slate-400'
                    }`}
                  >
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {usuario.email} · Comissão {usuario.comissao_percentual}%
                </p>
              </div>
              <button
                onClick={() => abrirEdicao(usuario)}
                className="text-wake-500 hover:text-wake-600"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <Modal
          title={editando ? `Editar ${editando.nome}` : 'Novo usuário'}
          onClose={fechar}
          size="xl"
          footer={
            <>
              <button onClick={fechar} className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={
                  salvando ||
                  !form.nome.trim() ||
                  (!editando && (!form.email.trim() || !form.senha.trim()))
                }
                className="rounded-md bg-hull-900 px-4 py-2 text-sm font-medium text-foam-50 disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <CampoTexto label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />

            {!editando && (
              <>
                <CampoTexto label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <CampoTexto
                  label="Senha temporária"
                  value={form.senha}
                  onChange={(v) => setForm({ ...form, senha: v })}
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <CampoNumero
                label="Comissão (%)"
                value={form.comissao_percentual}
                onChange={(v) => setForm({ ...form, comissao_percentual: v })}
              />
              {editando && (
                <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-hull-900">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    className="h-4 w-4 accent-brass-500"
                  />
                  Ativo
                </label>
              )}
            </div>

            {editando?.is_admin ? (
              <p className="rounded-md border border-foam-200 bg-foam-100 p-3 text-xs text-slate-500">
                Este usuário é administrador e tem acesso a tudo — não é necessário marcar
                permissões individuais.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-6 border-t border-foam-200 pt-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-hull-900">Abas do sistema</p>
                  <div className="space-y-1.5">
                    {tabsSistema.map((t) => (
                      <label key={t.chave} className="flex items-center gap-2 text-sm text-hull-900">
                        <input
                          type="checkbox"
                          checked={tabKeysSelecionadas.has(t.chave)}
                          onChange={() => toggleTabKey(t.chave)}
                          className="h-4 w-4 accent-brass-500"
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-hull-900">Catálogo</p>
                  <div className="space-y-3">
                    {categorias.map((categoria) => (
                      <div key={categoria.id}>
                        <p className="text-xs font-medium text-slate-500">{categoria.nome}</p>
                        <div className="ml-2 mt-1 space-y-1">
                          {subcategorias
                            .filter((s) => s.categoria_id === categoria.id)
                            .map((sub) => {
                              const chave = `catalogo:${sub.id}`
                              return (
                                <label key={sub.id} className="flex items-center gap-2 text-sm text-hull-900">
                                  <input
                                    type="checkbox"
                                    checked={tabKeysSelecionadas.has(chave)}
                                    onChange={() => toggleTabKey(chave)}
                                    className="h-4 w-4 accent-brass-500"
                                  />
                                  {sub.nome}
                                </label>
                              )
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
