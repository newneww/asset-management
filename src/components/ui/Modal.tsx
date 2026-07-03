import type { ReactNode } from 'react'

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="min-h-touch min-w-touch text-gray-400 hover:text-gray-600"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="border-t border-gray-200 p-4">{footer}</div>}
      </div>
    </div>
  )
}
