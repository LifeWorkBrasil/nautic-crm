import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import {
  listItensInclusosProduto,
  createItemInclusoProduto,
  updateItemInclusoProduto,
  deleteItemInclusoProduto,
} from '@/lib/api'
import type { ProdutoItemIncluso } from '@/types'

export default function ItensInclusosProduto({
  produtoId,
  nomeProduto,
  onClose,
  onAlterar,
}: {
  produtoId: string
  nomeProduto: string
  onClose: () => void
  onAlterar: () => void
}) {
  const [itens, setItens] = useState<ProdutoItemIncluso[]>([])
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    try {
      const i = await listItensInclusosProduto(produtoId)
      setItens(i)
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar itens')
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoId])

  async function adicionarItem() {
    try {
      const item = await createItemInclusoProduto({
        produto_id: produtoId,
        nome: '',
        descricao: '',
        quantidade: null,
        estado: '',
        marca: '',
      })
      setItens((prev) => [...prev, item])
      onAlterar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar item')
    }
  }

  function salvarItem(item: ProdutoItemIncluso, patch: Partial<ProdutoItemIncluso>) {
    setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)))
    updateItemInclusoProduto(item.id, patch)
      .then(onAlterar)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao salvar item'))
  }

  async function removerItem(id: string) {
    try {
      await deleteItemInclusoProduto(id)
      setItens((prev) => prev.filter((i) => i.id !== id))
      onAlterar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao remover item')
    }
  }

  return (
    <Modal title={`Itens inclusos — ${nomeProduto}`} onClose={onClose} size="xl">
      <div className="space-y-4">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-hull-900">Itens inclusos</p>
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
      </div>
    </Modal>
  )
}
