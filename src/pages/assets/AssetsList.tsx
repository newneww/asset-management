import { useState } from 'react'
import { useAssets, useUpsertAsset } from '@/hooks/queries'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { EmptyState, ErrorState } from '@/components/States'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { assetStatusBadge, assetStatusLabels } from '@/lib/labels'
import { formatBaht } from '@/lib/format'
import type { Asset, AssetStatus } from '@/types/database'
import { errMsg } from '@/lib/errors'

const STATUSES: AssetStatus[] = ['in_stock', 'loaned', 'damaged', 'lost']

export function AssetsList() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<Asset | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const debounced = useDebounce(q)
  const { data, isLoading, error } = useAssets({ q: debounced, status, pageSize: 100 })

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(a: Asset) {
    setEditing(a)
    setModalOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="ทรัพย์สิน / อุปกรณ์"
        subtitle={data ? `${data.total} รายการ` : undefined}
        action={
          <button className="btn-primary" onClick={openNew}>
            + เพิ่มอุปกรณ์
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="input flex-1"
          placeholder="ค้นหา ชื่อ / รหัส / serial"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {assetStatusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <Spinner label="กำลังโหลด..." />}
      {error && <ErrorState error={error} />}
      {data && data.rows.length === 0 && <EmptyState title="ไม่พบอุปกรณ์" />}

      <div className="space-y-2">
        {data?.rows.map((a) => (
          <button
            key={a.id}
            onClick={() => openEdit(a)}
            className="card flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{a.name}</div>
              <div className="truncate text-sm text-gray-500">
                {a.code} · {a.category || '-'} {a.serial ? `· S/N ${a.serial}` : ''}
              </div>
            </div>
            <div className="text-right">
              <span className={`badge ${assetStatusBadge[a.status]}`}>{assetStatusLabels[a.status]}</span>
              <div className="mt-0.5 text-xs text-gray-400">{formatBaht(a.value)}</div>
            </div>
          </button>
        ))}
      </div>

      <AssetFormModal open={modalOpen} onClose={() => setModalOpen(false)} asset={editing} categories={data?.categories ?? []} />
    </div>
  )
}

function AssetFormModal({
  open,
  onClose,
  asset,
  categories,
}: {
  open: boolean
  onClose: () => void
  asset: Asset | null
  categories: string[]
}) {
  const upsert = useUpsertAsset()
  const toast = useToast()
  const [form, setForm] = useState<Partial<Asset>>({})

  // sync ค่าเริ่มต้นเมื่อเปิด modal
  const [lastId, setLastId] = useState<string | null>(null)
  if (open && (asset?.id ?? null) !== lastId) {
    setLastId(asset?.id ?? null)
    setForm(asset ?? { status: 'in_stock', unit: 'ชิ้น' })
  }

  function set<K extends keyof Asset>(key: K, value: Asset[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit() {
    try {
      await upsert.mutateAsync(form)
      toast.success(asset ? 'บันทึกแล้ว' : 'เพิ่มอุปกรณ์แล้ว')
      onClose()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={asset ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์'}
      footer={
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn-primary flex-1" onClick={submit} disabled={upsert.isPending || !form.name}>
            บันทึก
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">ชื่ออุปกรณ์ *</label>
          <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">หมวดหมู่</label>
            <input className="input" list="cats" value={form.category ?? ''} onChange={(e) => set('category', e.target.value)} />
            <datalist id="cats">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">Serial</label>
            <input className="input" value={form.serial ?? ''} onChange={(e) => set('serial', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">หน่วย</label>
            <input className="input" value={form.unit ?? ''} onChange={(e) => set('unit', e.target.value)} />
          </div>
          <div>
            <label className="label">มูลค่า (บาท)</label>
            <input
              className="input"
              type="number"
              value={form.value ?? ''}
              onChange={(e) => set('value', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="label">สถานะ</label>
          <select className="input" value={form.status ?? 'in_stock'} onChange={(e) => set('status', e.target.value as AssetStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {assetStatusLabels[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  )
}
