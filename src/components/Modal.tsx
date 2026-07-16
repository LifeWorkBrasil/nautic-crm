import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const TAMANHOS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ title, onClose, children, footer, size = 'md' }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-hull-950/50 p-4">
      <div className={`w-full ${TAMANHOS[size]} rounded-md bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-foam-200 px-5 py-4">
          <h2 className="font-display text-lg text-hull-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-foam-100 hover:text-hull-900"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-foam-200 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}
