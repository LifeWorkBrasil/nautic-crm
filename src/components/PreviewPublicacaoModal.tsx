import { useState } from 'react'
import { Instagram } from 'lucide-react'
import Modal from '@/components/Modal'

export default function PreviewPublicacaoModal({
  fotoUrls,
  legenda,
  confirmando,
  erro,
  onClose,
  onConfirmar,
}: {
  fotoUrls: string[]
  legenda: string
  confirmando: boolean
  erro: string | null
  onClose: () => void
  onConfirmar: () => void
}) {
  const [indice, setIndice] = useState(0)

  return (
    <Modal
      title="Pré-visualizar publicação"
      onClose={onClose}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={confirmando}
            className="rounded-md px-4 py-2 text-sm text-slate-500 hover:text-hull-900 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={confirmando}
            className="flex items-center gap-2 rounded-md bg-brass-400 px-4 py-2 text-sm font-medium text-hull-900 hover:bg-brass-500 disabled:opacity-50"
          >
            <Instagram className="h-4 w-4" strokeWidth={1.75} />
            {confirmando ? 'Publicando…' : 'Confirmar e publicar'}
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

        {fotoUrls.length > 0 ? (
          <div>
            <div className="aspect-square overflow-hidden rounded-md bg-hull-900/[0.04]">
              <img src={fotoUrls[indice]} alt="" className="h-full w-full object-cover" />
            </div>
            {fotoUrls.length > 1 && (
              <>
                <div className="mt-2 flex gap-1.5 overflow-x-auto">
                  {fotoUrls.map((url, i) => (
                    <button
                      key={`${url}-${i}`}
                      onClick={() => setIndice(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
                        i === indice ? 'border-wake-400' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Carrossel com {fotoUrls.length} fotos — todas serão publicadas juntas.
                </p>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Este post não tem fotos.</p>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-hull-900">Legenda</p>
          <p className="whitespace-pre-wrap rounded-md border border-foam-200 bg-foam-100 p-3 text-sm text-hull-900">
            {legenda || '(sem legenda)'}
          </p>
        </div>
      </div>
    </Modal>
  )
}
