import { useState } from 'react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { errMsg } from '@/lib/errors'

const TABLES: { key: string; label: string }[] = [
  { key: 'LOG', label: 'ประวัติ/ใบยืม (Log & History)' },
  { key: 'ASSETS', label: 'ทรัพย์สิน (Asset Master)' },
  { key: 'SHOPS', label: 'ร้านค้า (Shop Master)' },
  { key: 'AUDIT', label: 'การตรวจนับ (Audit)' },
]

export function Reports() {
  const toast = useToast()
  const [table, setTable] = useState('LOG')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)

  async function exportCsv() {
    setLoading(true)
    try {
      const res = await api<{ filename: string; csv: string; count: number }>('exportCsv', {
        table,
        from: from ? new Date(from).toISOString() : '',
        to: to ? new Date(to + 'T23:59:59').toISOString() : '',
      })
      // เพิ่ม BOM เพื่อให้ Excel อ่านภาษาไทยถูกต้อง
      const blob = new Blob(['﻿' + res.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`ดาวน์โหลด ${res.count} แถวแล้ว`)
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="รายงาน & ส่งออก" subtitle="ส่งออกข้อมูลเป็น Excel/CSV (เช่น ส่งบัญชีทุก 6 เดือน)" />

      <section className="card space-y-4 p-4">
        <div>
          <label className="label">ตารางข้อมูล</label>
          <select className="input" value={table} onChange={(e) => setTable(e.target.value)}>
            {TABLES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">ตั้งแต่วันที่</label>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">ถึงวันที่</label>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <button className="btn-primary w-full" onClick={exportCsv} disabled={loading}>
          {loading ? 'กำลังสร้างไฟล์...' : '⬇️ ดาวน์โหลด CSV'}
        </button>
        <p className="text-xs text-gray-400">
          เว้นช่วงวันที่ไว้ = ส่งออกทั้งหมด · ไฟล์ CSV เปิดใน Excel/Google Sheets ได้ทันที
        </p>
      </section>
    </div>
  )
}
