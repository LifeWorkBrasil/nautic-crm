import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import Modal from '@/components/Modal'
import {
  listItensInclusosProduto,
  createItemInclusoProduto,
  updateItemInclusoProduto,
  deleteItemInclusoProduto,
  uploadLogoFabricante,
} from '@/lib/api'
import { usePermissoes } from '@/lib/PermissoesContext'
import type { ProdutoItemIncluso } from '@/types'
import { mensagemErro } from '@/lib/errors'

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
  const { perfil } = usePermissoes()
  const [itens, setItens] = useState<ProdutoItemIncluso[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [uploadandoId, setUploadandoId] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function carregar() {
    try {
      const i = await listItensInclusosProduto(produtoId)
      setItens(i)
      setErro(null)
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao carregar itens'))
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
        logo_url: null,
      })
      setItens((prev) => [...prev, item])
      onAlterar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao adicionar item'))
    }
  }

  function salvarItem(item: ProdutoItemIncluso, patch: Partial<ProdutoItemIncluso>) {
    setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)))
    updateItemInclusoProduto(item.id, patch)
      .then(onAlterar)
      .catch((e) => setErro(mensagemErro(e, 'Erro ao salvar item')))
  }

  async function removerItem(id: string) {
    try {
      await deleteItemInclusoProduto(id)
      setItens((prev) => prev.filter((i) => i.id !== id))
      onAlterar()
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao remover item'))
    }
  }

  async function handleLogoUpload(item: ProdutoItemIncluso, file: File) {
    if (!perfil?.empresa_id) return
    setUploadandoId(item.id)
    try {
      const url = await uploadLogoFabricante(perfil.empresa_id, item.id, file)
      salvarItem(item, { logo_url: url })
    } catch (e) {
      setErro(mensagemErro(e, 'Erro ao enviar logo'))
    } finally {
      setUploadandoId(null)
    }
  }

  function removerLogo(item: ProdutoItemIncluso) {
    salvarItem(item, { logo_url: null })
  }

  return (
    <Modal title={`Itens inclusos — ${nomeProduto}`} onClose={onClose} size="xl">
      <div className="space-y-5">
        {erro && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-2.5 text-sm text-signal-red">
            {erro}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-hull-900">
            {itens.length === 0 ? 'Nenhum item ainda.' : `${itens.length} item(ns)`}
          </p>
          <button
            onClick={adicionarItem}
            className="flex items-center gap-1 text-xs text-wake-500 hover:text-wake-600"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Adicionar item
          </button>
        </div>

        {itens.length > 0 && (
          <div className="space-y-3">
            {itens.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-foam-200 bg-white p-4 shadow-sm"
              >
                {/* Linha 1: Nome + Qtd + Estado + botão remover */}
                <div className="mb-3 grid grid-cols-12 items-center gap-2">
                  <div className="col-span-5">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Nome do item *
                    </label>
                    <input
                      value={item.nome}
                      onChange={(e) => salvarItem(item, { nome: e.target.value })}
                      placeholder="ex: Motor de popa"
                      className="input w-full"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Qtd
                    </label>
                    <input
                      type="number"
                      value={item.quantidade ?? ''}
                      onChange={(e) =>
                        salvarItem(item, {
                          quantidade: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="1"
                      className="input w-full"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Estado / Condição
                    </label>
                    <input
                      value={item.estado ?? ''}
                      onChange={(e) => salvarItem(item, { estado: e.target.value })}
                      placeholder="ex: Novo, Revisado"
                      className="input w-full"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end pt-5">
                    <button
                      onClick={() => removerItem(item.id)}
                      className="text-signal-red/60 hover:text-signal-red"
                      title="Remover item"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                {/* Linha 2: Descrição */}
                <div className="mb-3">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Descrição / Características
                  </label>
                  <input
                    value={item.descricao ?? ''}
                    onChange={(e) => salvarItem(item, { descricao: e.target.value })}
                    placeholder="Detalhes técnicos, especificações..."
                    className="input w-full"
                  />
                </div>

                {/* Linha 3: Marca + Logo do fabricante */}
                <div className="flex items-end gap-4 rounded-md bg-foam-100/60 p-3">
                  {/* Logo do fabricante */}
                  <div className="flex flex-col items-center gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Logo do fabricante
                    </label>

                    {item.logo_url ? (
                      <div className="relative">
                        <img
                          src={item.logo_url}
                          alt="Logo"
                          className="h-12 w-20 rounded-md border border-foam-200 bg-white object-contain p-1"
                        />
                        <button
                          onClick={() => removerLogo(item)}
                          className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-signal-red text-white hover:bg-signal-red/80"
                          title="Remover logo"
                        >
                          <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current[item.id]?.click()}
                        disabled={uploadandoId === item.id}
                        className="flex h-12 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-foam-300 bg-white text-slate-400 hover:border-wake-400 hover:text-wake-500 disabled:opacity-50"
                      >
                        {uploadandoId === item.id ? (
                          <span className="text-[9px]">Enviando…</span>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
                            <span className="text-[9px]">Upload</span>
                          </>
                        )}
                      </button>
                    )}

                    <input
                      ref={(el) => { fileInputRefs.current[item.id] = el }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleLogoUpload(item, file)
                        e.target.value = ''
                      }}
                    />
                  </div>

                  {/* Marca */}
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Marca / Fabricante
                    </label>
                    <input
                      value={item.marca ?? ''}
                      onChange={(e) => salvarItem(item, { marca: e.target.value })}
                      placeholder="ex: Yamaha, Mercury, Furuno..."
                      className="input w-full"
                    />
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      A marca e o logo aparecem na ficha PDF do produto.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
