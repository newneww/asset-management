import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoans } from '@/hooks/queries'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { EmptyState, ErrorState } from '@/components/States'
import { formatBaht, formatDate } from '@/lib/format'
import { logStatusBadge, logStatusLabels } from '@/lib/labels'

export function LoansList() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const debounced = useDebounce(q)
  const { data, isLoading, error } = useLoans({ q: debounced, status, pageSize: 50 })

  return (
    <div>
      <PageHeader
        title="ใบยืมอุปกรณ์"
        subtitle={data ? `${data.total} ใบ` : undefined}
        action={
          <Link to="/loans/new" className="btn-primary">
            + ทำใบยืม
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="input flex-1"
          placeholder="ค้นหา เลขที่ / ร้าน / ช่าง"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="active">กำลังยืม</option>
          <option value="returned">คืนแล้ว</option>
        </select>
      </div>

      {isLoading && <Spinner label="กำลังโหลด..." />}
      {error && <ErrorState error={error} />}
      {data && data.rows.length === 0 && <EmptyState title="ยังไม่มีใบยืม" />}

      <div className="space-y-2">
        {data?.rows.map((l) => (
          <Link key={l.id} to={`/loans/${l.id}`} className="card flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
            <div className="min-w-0">
              <div className="truncate font-medium">
                {l.loan_no} · {l.shop_name}
              </div>
              <div className="truncate text-sm text-gray-500">{l.items_summary}</div>
              <div className="text-xs text-gray-400">
                {formatDate(l.ts)} · {l.technician} · มัดจำ {formatBaht(l.deposit)}
              </div>
            </div>
            <span className={`badge ${logStatusBadge[l.status]}`}>{logStatusLabels[l.status]}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
