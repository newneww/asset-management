import { useState } from 'react'
import { useAssets, useCreateMovement, useMovements, useShops } from '@/hooks/queries'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { EmptyState, ErrorState } from '@/components/States'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatDateTime } from '@/lib/format'
import { logStatusBadge, logStatusLabels, logTypeLabels } from '@/lib/labels'
import { errMsg } from '@/lib/errors'
import type { LoanItem, LogType, Shop } from '@/types/database'

export function MovementsList() {
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isLoading, error } = useMovements({ pageSize: 50 })

  return (
    <div>
      <PageHeader
        title="การเคลื่อนย้ายอุปกรณ์"
        subtitle="ย้ายร้าน / คืนเข้าคลัง (ต้องผ่านการอนุมัติ)"
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            + แจ้งเคลื่อนย้าย
          </button>
        }
      />

      {isLoading && <Spinner label="กำลังโหลด..." />}
      {error && <ErrorState error={error} />}
      {data && data.rows.length === 0 && <EmptyState title="ยังไม่มีรายการเคลื่อนย้าย" />}

      <div className="space-y-2">
        {data?.rows.map((m) => (
          <div key={m.id} className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="truncate font-medium">
                {logTypeLabels[m.type]} · {m.shop_name || 'คลัง'}
              </div>
              <div className="truncate text-sm text-gray-500">{m.items_summary}</div>
              <div className="text-xs text-gray-400">
                {formatDateTime(m.ts)} · {m.technician}
                {m.approved_by ? ` · โดย ${m.approved_by}` : ''}
              </div>
            </div>
            <span className={`badge ${logStatusBadge[m.status]}`}>{logStatusLabels[m.status]}</span>
          </div>
        ))}
      </div>

      <MovementModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

function MovementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateMovement()
  const toast = useToast()
  const [type, setType] = useState<LogType>('transfer')
  const [fromShop, setFromShop] = useState<Shop | null>(null)
  const [toShop, setToShop] = useState<Shop | null>(null)
  const [items, setItems] = useState<LoanItem[]>([])
  const [note, setNote] = useState('')

  function reset() {
    setType('transfer')
    setFromShop(null)
    setToShop(null)
    setItems([])
    setNote('')
  }

  async function submit() {
    if (items.length === 0) return toast.error('กรุณาเลือกอุปกรณ์')
    if (type === 'transfer' && !toShop) return toast.error('กรุณาเลือกร้านปลายทาง')
    try {
      await create.mutateAsync({
        type,
        from_shop_id: fromShop?.id ?? '',
        to_shop_id: toShop?.id ?? '',
        items,
        note,
      })
      toast.success('ส่งคำขอเคลื่อนย้ายแล้ว รอการอนุมัติ')
      reset()
      onClose()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="แจ้งเคลื่อนย้ายอุปกรณ์"
      footer={
        <button className="btn-primary w-full" onClick={submit} disabled={create.isPending}>
          ส่งคำขอ (รออนุมัติ)
        </button>
      }
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            className={`flex-1 rounded-lg py-2 text-sm ${type === 'transfer' ? 'bg-brand text-white' : 'bg-gray-100'}`}
            onClick={() => setType('transfer')}
          >
            ย้ายร้าน
          </button>
          <button
            className={`flex-1 rounded-lg py-2 text-sm ${type === 'return' ? 'bg-brand text-white' : 'bg-gray-100'}`}
            onClick={() => setType('return')}
          >
            คืนเข้าคลัง
          </button>
        </div>

        <ShopField label="จากร้าน (ต้นทาง)" shop={fromShop} onPick={setFromShop} />
        {type === 'transfer' && <ShopField label="ไปร้าน (ปลายทาง)" shop={toShop} onPick={setToShop} />}

        <div>
          <label className="label">อุปกรณ์</label>
          <AssetSearch onAdd={(it) => setItems((p) => [...p, it])} />
          <ul className="mt-2 divide-y divide-gray-100">
            {items.map((it, i) => (
              <li key={i} className="flex items-center justify-between py-1.5 text-sm">
                <span>{it.asset_name}</span>
                <button className="text-red-500" onClick={() => setItems((p) => p.filter((_, x) => x !== i))}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label className="label">หมายเหตุ</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function ShopField({ label, shop, onPick }: { label: string; shop: Shop | null; onPick: (s: Shop | null) => void }) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q)
  const { data } = useShops({ q: debounced, pageSize: 8 })
  return (
    <div>
      <label className="label">{label}</label>
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

function AssetSearch({ onAdd }: { onAdd: (it: LoanItem) => void }) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q)
  const { data } = useAssets({ q: debounced, pageSize: 8 })
  return (
    <div>
      <input className="input" placeholder="ค้นหาอุปกรณ์" value={q} onChange={(e) => setQ(e.target.value)} />
      {q && data && data.rows.length > 0 && (
        <ul className="mt-1 max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
          {data.rows.map((a) => (
            <li key={a.id}>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => { onAdd({ asset_id: a.id, asset_code: a.code, asset_name: a.name, qty: 1 }); setQ('') }}
              >
                {a.name} <span className="text-gray-400">· {a.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
