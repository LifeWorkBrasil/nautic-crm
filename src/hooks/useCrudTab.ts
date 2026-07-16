import { useState } from 'react'

interface UseCrudTabOptions<T, F> {
  list: () => Promise<T[]>
  create: (form: F) => Promise<T>
  update: (id: string, form: F) => Promise<void>
  remove: (id: string) => Promise<void>
  vazio: F
  mensagemExclusao?: string
}

export function useCrudTab<T extends { id: string }, F>({
  list,
  create,
  update,
  remove,
  vazio,
  mensagemExclusao = 'Excluir este item?',
}: UseCrudTabOptions<T, F>) {
  const [itens, setItens] = useState<T[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editando, setEditando] = useState<T | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<F>(vazio)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      setItens(await list())
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setCarregando(false)
    }
  }

  function abrirCriacao() {
    setForm(vazio)
    setCriando(true)
  }

  function abrirEdicao(item: T, formDeItem: F) {
    setForm(formDeItem)
    setEditando(item)
  }

  function fechar() {
    setCriando(false)
    setEditando(null)
  }

  async function salvar() {
    setSalvando(true)
    try {
      if (editando) {
        await update(editando.id, form)
      } else {
        await create(form)
      }
      fechar()
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm(mensagemExclusao)) return
    try {
      await remove(id)
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  return {
    itens,
    carregando,
    erro,
    editando,
    criando,
    form,
    salvando,
    setForm,
    carregar,
    abrirCriacao,
    abrirEdicao,
    fechar,
    salvar,
    excluir,
    modalAberto: criando || editando !== null,
  }
}
