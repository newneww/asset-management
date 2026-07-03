import { useState } from 'react'
import { useAudit, useCreateAudit, useShops } from '@/hooks/queries'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { EmptyState, ErrorState } from '@/components/States'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/format'
import { conditionBadge, conditionLabels } from '@/lib/labels'
import { errMsg } from '@/lib/errors'
import type { AuditCondition, Shop } from '@/types/database'

interface AuditLine {
  asset_code: string
  asset_name: string
  expected_qty: number
  counted_qty: number
  condition: AuditCondition
  note: string
}

const thisYear = new Date().getFullYear()

export function AuditList() {
  const [cycle, setCycle] = useState(String(thisYear))
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isLoading, error } = useAudit({ cycle, pageSize: 100 })

  return (
    <div>
      <PageHeader
        title="ตรวจนับทรัพย์สิน (Audit)"
        subtitle="นับทรัพย์สินจริงประจำปี + บันทึกสถานะชำรุด/สูญหาย"
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            + เริ่มตรวจนับ
          </button>
        }
      />

      <div className="mb-4">
        <select className="input w-40" value={cycle} onChange={(e) => setCycle(e.target.value)}>
          {[thisYear, thisYear - 1, thisYear - 2].map((y) => (
            <option key={y} value={y}>
              รอบปี {y}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <Spinner label="กำลังโหลด..." />}
      {error && <ErrorState error={error} />}
      {data && data.rows.length === 0 && <EmptyState title="ยังไม่มีข้อมูลตรวจนับในรอบนี้" />}

      <div className="space-y-2">
        {data?.rows.map((r) => (
          <div key={r.id} className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="truncate font-medium">
                {r.asset_name} <span className="text-gray-400">({r.asset_code})</span>
              </div>
              <div className="text-sm text-gray-500">
                {r.shop_name} · คาดว่า {r.expected_qty} / นับได้ {r.counted_qty}
              </div>
              <div className="text-xs text-gray-400">
                {formatDateTime(r.ts)} · {r.technician}
              </div>
            </div>
            <span className={`badge ${conditionBadge[r.condition]}`}>{conditionLabels[r.condition]}</span>
          </div>
        ))}
      </div>

      <AuditModal open={modalOpen} onClose={() => setModalOpen(false)} defaultCycle={cycle} />
    </div>
  )
}

function AuditModal({ open, onClose, defaultCycle }: { open: boolean; onClose: () => void; defaultCycle: string }) {
  const create = useCreateAudit()
  const toast = useToast()
  const [shop, setShop] = useState<Shop | null>(null)
  const [lines, setLines] = useState<AuditLine[]>([blankLine()])

  function blankLine(): AuditLine {
    return { asset_code: '', asset_name: '', expected_qty: 0, counted_qty: 0, condition: 'ok', note: '' }
  }
  function setLine(i: number, patch: Partial<AuditLine>) {
    setLines((prev) => prev.map((l, x) => (x === i ? { ...l, ...patch } : l)))
  }

  async function submit() {
    const items = lines.filter((l) => l.asset_name.trim())
    if (items.length === 0) return toast.error('กรุณากรอกอย่างน้อย 1 รายการ')
    try {
      await create.mutateAsync({ cycle: defaultCycle, shop_id: shop?.id ?? '', items })
      toast.success(`บันทึกการตรวจนับ ${items.length} รายการแล้ว`)
      setLines([blankLine()])
      setShop(null)
      onClose()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`ตรวจนับ รอบปี ${defaultCycle}`}
      footer={
        <button className="btn-primary w-full" onClick={submit} disabled={create.isPending}>
          บันทึกการตรวจนับ
        </button>
      }
    >
      <div className="space-y-3">
        <ShopField shop={shop} onPick={setShop} />
        {lines.map((l, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-3">
            <input
              className="input mb-2"
              placeholder="ชื่ออุปกรณ์"
              value={l.asset_name}
              onChange={(e) => setLine(i, { asset_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="รหัส" value={l.asset_code} onChange={(e) => setLine(i, { asset_code: e.target.value })} />
              <select
                className="input"
                value={l.condition}
                onChange={(e) => setLine(i, { condition: e.target.value as AuditCondition })}
              >
                {(Object.keys(conditionLabels) as AuditCondition[]).map((c) => (
                  <option key={c} value={c}>
                    {conditionLabels[c]}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                placeholder="คาดว่า"
                value={l.expected_qty || ''}
                onChange={(e) => setLine(i, { expected_qty: Number(e.target.value) })}
              />
              <input
                className="input"
                type="number"
                placeholder="นับได้"
                value={l.counted_qty || ''}
                onChange={(e) => setLine(i, { counted_qty: Number(e.target.value) })}
              />
            </div>
          </div>
        ))}
        <button className="btn-secondary w-full" onClick={() => setLines((p) => [...p, blankLine()])}>
          + เพิ่มรายการ
        </button>
      </div>
    </Modal>
  )
}

function ShopField({ shop, onPick }: { shop: Shop | null; onPick: (s: Shop | null) => void }) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q)
  const { data } = useShops({ q: debounced, pageSize: 8 })
  return (
    <div>
      <label className="label">ร้านค้า (ไม่บังคับ)</label>
      {shop ? (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span>{shop.name}</span>
          <button className="text-brand" onClick={() => onPick(null)}>
            เปลี่ยน
          </button>
        </div>
      ) : (
        <>
          <input className="input" placeholder="ค้นหาร้าน" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <ul className="mt-1 max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
              {data?.rows.map((s) => (
                <li key={s.id}>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { onPick(s); setQ('') }}>
                    {s.name} <span className="text-gray-400">· {s.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
