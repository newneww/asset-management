import { Link } from 'react-router-dom'
import { useDashboard } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { ErrorState } from '@/components/States'
import { formatBaht, formatDateTime } from '@/lib/format'
import { logStatusBadge, logStatusLabels, logTypeLabels } from '@/lib/labels'
import { useAuth } from '@/context/AuthContext'

export function Dashboard() {
  const { user } = useAuth()
  const { data, isLoading, error } = useDashboard()

  return (
    <div>
      <PageHeader title={`สวัสดี ${user?.full_name ?? ''}`} subtitle="ภาพรวมสถานะระบบ" />

      {isLoading && <Spinner label="กำลังโหลดข้อมูล..." />}
      {error && <ErrorState error={error} />}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="ทรัพย์สินทั้งหมด" value={data.assets.total} icon="📦" />
            <Stat label="ถูกยืมอยู่" value={data.assets.loaned} icon="📤" tone="blue" />
            <Stat label="อยู่ในคลัง" value={data.assets.in_stock} icon="🏬" tone="green" />
            <Stat label="ชำรุด/สูญหาย" value={data.assets.damaged + data.assets.lost} icon="⚠️" tone="amber" />
            <Stat label="ใบยืมที่ยังไม่คืน" value={data.loans.active} icon="📄" />
            <Stat label="รออนุมัติ" value={data.pending} icon="⏳" tone="amber" />
            <Stat label="ร้านค้าใช้งาน" value={data.shops.active} icon="🏪" />
            <Stat label="มูลค่าทรัพย์สินรวม" value={formatBaht(data.assets.value)} icon="💰" tone="green" />
          </div>

          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">กิจกรรมล่าสุด</h2>
              <Link to="/movements" className="text-sm text-brand">
                ดูทั้งหมด
              </Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">ยังไม่มีกิจกรรม</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {logTypeLabels[r.type]} · {r.shop_name || '-'}
                      </div>
                      <div className="truncate text-xs text-gray-500">{r.items_summary}</div>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${logStatusBadge[r.status]}`}>{logStatusLabels[r.status]}</span>
                      <div className="mt-0.5 text-xs text-gray-400">{formatDateTime(r.ts)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  tone = 'gray',
}: {
  label: string
  value: number | string
  icon: string
  tone?: 'gray' | 'blue' | 'green' | 'amber'
}) {
  const tones: Record<string, string> = {
    gray: 'text-gray-900',
    blue: 'text-blue-700',
    green: 'text-green-700',
    amber: 'text-amber-700',
  }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  )
}
