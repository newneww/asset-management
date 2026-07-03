import { useApproveMovement, useMovements } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { EmptyState, ErrorState } from '@/components/States'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/format'
import { logTypeLabels } from '@/lib/labels'
import { errMsg } from '@/lib/errors'

export function Approvals() {
  const { data, isLoading, error } = useMovements({ status: 'pending', pageSize: 100 })
  const approve = useApproveMovement()
  const toast = useToast()

  async function decide(id: string, decision: 'approved' | 'rejected') {
    try {
      await approve.mutateAsync({ id, decision })
      toast.success(decision === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว')
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div>
      <PageHeader title="รออนุมัติ" subtitle="อนุมัติการเคลื่อนย้าย / ตรวจนับ" />

      {isLoading && <Spinner label="กำลังโหลด..." />}
      {error && <ErrorState error={error} />}
      {data && data.rows.length === 0 && <EmptyState title="ไม่มีรายการรออนุมัติ" hint="เคลียร์หมดแล้ว 🎉" />}

      <div className="space-y-2">
        {data?.rows.map((m) => (
          <div key={m.id} className="card p-4">
            <div className="mb-2">
              <div className="font-medium">
                {logTypeLabels[m.type]} · {m.shop_name || 'คลัง'}
                {m.to_shop_id ? ' → ปลายทาง' : ''}
              </div>
              <div className="text-sm text-gray-500">{m.items_summary}</div>
              <div className="text-xs text-gray-400">
                {formatDateTime(m.ts)} · แจ้งโดย {m.technician}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={() => decide(m.id, 'approved')} disabled={approve.isPending}>
                ✅ อนุมัติ
              </button>
              <button className="btn-danger flex-1" onClick={() => decide(m.id, 'rejected')} disabled={approve.isPending}>
                ✕ ปฏิเสธ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
