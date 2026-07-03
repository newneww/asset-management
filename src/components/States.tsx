import type { ReactNode } from 'react'
import { errMsg } from '@/lib/errors'

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card p-10 text-center text-gray-500">
      <div className="text-4xl">📭</div>
      <div className="mt-2 font-medium text-gray-700">{title}</div>
      {hint && <div className="mt-1 text-sm">{hint}</div>}
    </div>
  )
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="card border-red-200 bg-red-50 p-6 text-center text-red-700">
      <div className="font-medium">เกิดข้อผิดพลาด</div>
      <div className="mt-1 text-sm">{errMsg(error)}</div>
    </div>
  )
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
