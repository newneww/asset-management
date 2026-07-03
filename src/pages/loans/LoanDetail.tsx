import { useParams } from 'react-router-dom'
import { useLoan, useReturnLoan } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { ErrorState, Section } from '@/components/States'
import { useToast } from '@/components/ui/Toast'
import { formatBaht, formatDateTime } from '@/lib/format'
import { logStatusBadge, logStatusLabels } from '@/lib/labels'
import { errMsg } from '@/lib/errors'

export function LoanDetail() {
  const { id } = useParams()
  const { data: loan, isLoading, error } = useLoan(id)
  const ret = useReturnLoan()
  const toast = useToast()

  if (isLoading) return <Spinner label="กำลังโหลด..." />
  if (error) return <ErrorState error={error} />
  if (!loan) return <ErrorState error="ไม่พบใบยืม" />

  async function markReturned() {
    if (!id) return
    try {
      await ret.mutateAsync({ id })
      toast.success('บันทึกการคืนอุปกรณ์แล้ว')
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`ใบยืม ${loan.loan_no}`}
        subtitle={loan.shop_name}
        action={<span className={`badge ${logStatusBadge[loan.status]}`}>{logStatusLabels[loan.status]}</span>}
      />

      <div className="space-y-4">
        <Section title="รายการอุปกรณ์">
          <ul className="divide-y divide-gray-100">
            {(loan.items ?? []).map((it, i) => (
              <li key={i} className="flex justify-between py-2 text-sm">
                <span>
                  {it.asset_name} {it.asset_code ? <span className="text-gray-400">({it.asset_code})</span> : null}
                </span>
                <span className="font-medium">x{it.qty}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="รายละเอียด">
          <dl className="space-y-2 text-sm">
            <Row label="วันที่" value={formatDateTime(loan.ts)} />
            <Row label="ช่างผู้ส่งมอบ" value={loan.technician} />
            <Row label="เงินมัดจำ" value={formatBaht(loan.deposit)} />
            {loan.note && <Row label="หมายเหตุ" value={loan.note} />}
          </dl>
        </Section>

        {loan.signature && (
          <Section title="ลายเซ็นผู้ยืม">
            <img src={loan.signature} alt="ลายเซ็น" className="h-24 rounded border border-gray-200 bg-white" />
          </Section>
        )}

        <div className="flex flex-wrap gap-2">
          {loan.contract_url && loan.contract_url !== '#demo-pdf' && (
            <a href={loan.contract_url} target="_blank" rel="noreferrer" className="btn-secondary flex-1">
              📄 เปิดสัญญา PDF
            </a>
          )}
          {loan.status === 'active' && (
            <button className="btn-primary flex-1" onClick={markReturned} disabled={ret.isPending}>
              บันทึกการคืนอุปกรณ์
            </button>
          )}
        </div>
      </div>
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
