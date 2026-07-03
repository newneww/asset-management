import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useShops, useUpsertShop } from '@/hooks/queries'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/PageHeader'
import { Spinner } from '@/components/Spinner'
import { EmptyState, ErrorState } from '@/components/States'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { shopStatusLabels } from '@/lib/labels'
import type { Shop } from '@/types/database'
import { errMsg } from '@/lib/errors'

export function ShopsList() {
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const debounced = useDebounce(q)
  const { data, isLoading, error } = useShops({ q: debounced, pageSize: 50 })

  return (
    <div>
      <PageHeader
        title="ร้านค้า"
        subtitle={data ? `${data.total} ร้าน` : undefined}
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            + เพิ่มร้าน
          </button>
        }
      />

      <input
        className="input mb-4"
        placeholder="ค้นหาชื่อร้าน / รหัส / จังหวัด"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {isLoading && <Spinner label="กำลังโหลด..." />}
      {error && <ErrorState error={error} />}
      {data && data.rows.length === 0 && <EmptyState title="ไม่พบร้านค้า" hint="ลองเปลี่ยนคำค้น หรือเพิ่มร้านใหม่" />}

      <div className="space-y-2">
        {data?.rows.map((shop) => (
          <Link key={shop.id} to={`/shops/${shop.id}`} className="card flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
            <div className="min-w-0">
              <div className="truncate font-medium">{shop.name}</div>
              <div className="truncate text-sm text-gray-500">
                {shop.code} · {[shop.district, shop.province].filter(Boolean).join(', ') || '-'}
              </div>
            </div>
            <span className={`badge ${shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {shopStatusLabels[shop.status]}
            </span>
          </Link>
        ))}
      </div>

      <ShopFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

export function ShopFormModal({
  open,
  onClose,
  shop,
}: {
  open: boolean
  onClose: () => void
  shop?: Shop
}) {
  const upsert = useUpsertShop()
  const toast = useToast()
  const [form, setForm] = useState<Partial<Shop>>(shop ?? { status: 'active' })

  function set<K extends keyof Shop>(key: K, value: Shop[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit() {
    try {
      await upsert.mutateAsync(form)
      toast.success(shop ? 'บันทึกร้านค้าแล้ว' : 'เพิ่มร้านค้าแล้ว')
      onClose()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={shop ? 'แก้ไขร้านค้า' : 'เพิ่มร้านค้า'}
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
        <Field label="ชื่อร้าน *">
          <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="อำเภอ/เขต">
            <input className="input" value={form.district ?? ''} onChange={(e) => set('district', e.target.value)} />
          </Field>
          <Field label="จังหวัด">
            <input className="input" value={form.province ?? ''} onChange={(e) => set('province', e.target.value)} />
          </Field>
        </div>
        <Field label="ที่อยู่">
          <input className="input" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ผู้ติดต่อ">
            <input className="input" value={form.contact_name ?? ''} onChange={(e) => set('contact_name', e.target.value)} />
          </Field>
          <Field label="โทรศัพท์">
            <input className="input" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
          </Field>
        </div>
        <Field label="สถานะ">
          <select className="input" value={form.status ?? 'active'} onChange={(e) => set('status', e.target.value as Shop['status'])}>
            <option value="active">ใช้งาน</option>
            <option value="inactive">ปิด</option>
          </select>
        </Field>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
