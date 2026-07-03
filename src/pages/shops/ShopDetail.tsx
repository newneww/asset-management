import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useShop } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { ErrorState, Section } from '@/components/States'
import { ShopFormModal } from '@/pages/shops/ShopsList'
import { formatDateTime } from '@/lib/format'
import {
  assetStatusBadge,
  assetStatusLabels,
  logStatusBadge,
  logStatusLabels,
  logTypeLabels,
} from '@/lib/labels'

export function ShopDetail() {
  const { id } = useParams()
  const { data, isLoading, error } = useShop(id)
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) return <Spinner label="กำลังโหลด..." />
  if (error) return <ErrorState error={error} />
  if (!data?.shop) return <ErrorState error="ไม่พบร้านค้า" />

  const { shop, assets, logs } = data

  return (
    <div>
      <PageHeader
        title={shop.name}
        subtitle={`${shop.code} · ${[shop.district, shop.province].filter(Boolean).join(', ')}`}
        action={
          <div className="flex gap-2">
            <Link to={`/loans/new?shop=${shop.id}`} className="btn-primary">
              + ทำใบยืม
            </Link>
            <button className="btn-secondary" onClick={() => setEditOpen(true)}>
              แก้ไข
            </button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="ข้อมูลร้าน">
          <dl className="space-y-2 text-sm">
            <Row label="ผู้ติดต่อ" value={shop.contact_name} />
            <Row label="โทรศัพท์" value={shop.phone} />
            <Row label="ที่อยู่" value={[shop.address, shop.district, shop.province].filter(Boolean).join(' ')} />
          </dl>
        </Section>

        <Section title={`ทรัพย์สินที่ร้านนี้ (${assets.length})`}>
          {assets.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">ยังไม่มีอุปกรณ์ที่ร้านนี้</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {assets.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {a.name} <span className="text-gray-400">({a.code})</span>
                  </span>
                  <span className={`badge ${assetStatusBadge[a.status]}`}>{assetStatusLabels[a.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-4">
        <Section title="ประวัติการเคลื่อนไหว">
          {logs.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">ยังไม่มีประวัติ</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {logs.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {logTypeLabels[l.type]} {l.loan_no ? `· ${l.loan_no}` : ''}
                    </div>
                    <div className="truncate text-xs text-gray-500">{l.items_summary}</div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${logStatusBadge[l.status]}`}>{logStatusLabels[l.status]}</span>
                    <div className="mt-0.5 text-xs text-gray-400">{formatDateTime(l.ts)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <ShopFormModal open={editOpen} onClose={() => setEditOpen(false)} shop={shop} />
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium">{value || '-'}</dd>
    </div>
  )
}
