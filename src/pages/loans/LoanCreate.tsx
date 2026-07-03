import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAssets, useCreateLoan, useShops } from '@/hooks/queries'
import { useDebounce } from '@/hooks/useDebounce'
import { PageHeader } from '@/components/PageHeader'
import { SignaturePad } from '@/components/SignaturePad'
import { useToast } from '@/components/ui/Toast'
import { errMsg } from '@/lib/errors'
import type { LoanItem, Shop } from '@/types/database'

export function LoanCreate() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreateLoan()

  const [shop, setShop] = useState<Shop | null>(null)
  const [items, setItems] = useState<LoanItem[]>([])
  const [deposit, setDeposit] = useState('')
  const [note, setNote] = useState('')
  const [signature, setSignature] = useState<string | null>(null)

  // ถ้าเปิดจากหน้าร้าน (?shop=ID) โหลดร้านนั้นมาตั้งต้น
  const prefillShopId = params.get('shop')
  const { data: shopData } = useShops({ pageSize: 1000 })
  if (prefillShopId && !shop && shopData) {
    const found = shopData.rows.find((s) => s.id === prefillShopId)
    if (found) setShop(found)
  }

  function addItem(item: LoanItem) {
    setItems((prev) => [...prev, item])
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }
  function setQty(idx: number, qty: number) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, qty } : it)))
  }

  async function submit() {
    if (!shop) return toast.error('กรุณาเลือกร้านค้า')
    if (items.length === 0) return toast.error('กรุณาเพิ่มอุปกรณ์อย่างน้อย 1 รายการ')
    try {
      const loan = await create.mutateAsync({
        shop_id: shop.id,
        items,
        deposit: Number(deposit || 0),
        note,
        signature,
      })
      toast.success(`สร้างใบยืม ${loan.loan_no} แล้ว`)
      navigate(`/loans/${loan.id}`)
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="ทำใบยืมอุปกรณ์" subtitle="เบิก/ส่งมอบอุปกรณ์ให้ร้านค้า" />

      <div className="space-y-4">
        {/* ร้านค้า */}
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">1. เลือกร้านค้า</h2>
          {shop ? (
            <div className="flex items-center justify-between rounded-lg bg-brand/5 px-3 py-2">
              <div>
                <div className="font-medium">{shop.name}</div>
                <div className="text-sm text-gray-500">{shop.code}</div>
              </div>
              <button className="text-sm text-brand" onClick={() => setShop(null)}>
                เปลี่ยน
              </button>
            </div>
          ) : (
            <ShopPicker onPick={setShop} />
          )}
        </section>

        {/* อุปกรณ์ */}
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">2. เพิ่มอุปกรณ์</h2>
          <AssetPicker onAdd={addItem} />
          {items.length > 0 && (
            <ul className="mt-3 divide-y divide-gray-100">
              {items.map((it, i) => (
                <li key={i} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{it.asset_name}</div>
                    {it.asset_code && <div className="text-xs text-gray-400">{it.asset_code}</div>}
                  </div>
                  <input
                    type="number"
                    min={1}
                    className="input w-20"
                    value={it.qty}
                    onChange={(e) => setQty(i, Number(e.target.value))}
                  />
                  <button className="min-h-touch px-2 text-red-500" onClick={() => removeItem(i)} aria-label="ลบ">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* มัดจำ + หมายเหตุ */}
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">3. รายละเอียด</h2>
          <div className="space-y-3">
            <div>
              <label className="label">เงินมัดจำ (บาท)</label>
              <input className="input" type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </div>
            <div>
              <label className="label">หมายเหตุ</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        </section>

        {/* ลายเซ็น */}
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">4. ลายเซ็นผู้ยืม</h2>
          <SignaturePad onChange={setSignature} />
        </section>

        <button className="btn-primary w-full" onClick={submit} disabled={create.isPending}>
          {create.isPending ? 'กำลังบันทึก & สร้างสัญญา PDF...' : 'บันทึกใบยืม & สร้างสัญญา'}
        </button>
      </div>
    </div>
  )
}

function ShopPicker({ onPick }: { onPick: (s: Shop) => void }) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q)
  const { data } = useShops({ q: debounced, pageSize: 10 })
  return (
    <div>
      <input className="input" placeholder="ค้นหาร้านค้า" value={q} onChange={(e) => setQ(e.target.value)} />
      {q && (
        <ul className="mt-2 max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
          {data?.rows.map((s) => (
            <li key={s.id}>
              <button className="min-h-touch w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => onPick(s)}>
                <span className="font-medium">{s.name}</span> <span className="text-gray-400">· {s.code}</span>
              </button>
            </li>
          ))}
          {data && data.rows.length === 0 && <li className="px-3 py-2 text-sm text-gray-400">ไม่พบร้าน</li>}
        </ul>
      )}
    </div>
  )
}

function AssetPicker({ onAdd }: { onAdd: (item: LoanItem) => void }) {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q)
  const { data } = useAssets({ q: debounced, status: 'in_stock', pageSize: 10 })

  function addManual() {
    if (!q.trim()) return
    onAdd({ asset_name: q.trim(), qty: 1 })
    setQ('')
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="ค้นหาอุปกรณ์ในคลัง หรือพิมพ์ชื่อใหม่"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-secondary" onClick={addManual}>
          + เพิ่มเอง
        </button>
      </div>
      {q && data && data.rows.length > 0 && (
        <ul className="mt-2 max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
          {data.rows.map((a) => (
            <li key={a.id}>
              <button
                className="min-h-touch w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => {
                  onAdd({ asset_id: a.id, asset_code: a.code, asset_name: a.name, qty: 1 })
                  setQ('')
                }}
              >
                <span className="font-medium">{a.name}</span>{' '}
                <span className="text-gray-400">· {a.code} {a.serial ? `· ${a.serial}` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
