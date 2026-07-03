// ยูทิลิตี้จัดรูปแบบภาษาไทย: วันที่ dd/mm/yyyy และสกุลเงินบาท

export function formatDate(value?: string | Date | null): string {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '-'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '-'
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(d)} ${hh}:${min}`
}

const bahtFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** ฿ 1,234 — คืน '-' ถ้าไม่มีค่า */
export function formatBaht(value?: number | string | null): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (n == null || Number.isNaN(n)) return '-'
  return `฿ ${bahtFormatter.format(n)}`
}

const numberFormatter = new Intl.NumberFormat('th-TH')
export function formatNumber(value?: number | string | null): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (n == null || Number.isNaN(n)) return '-'
  return numberFormatter.format(n)
}
