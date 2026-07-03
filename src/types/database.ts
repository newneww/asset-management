// ชนิดข้อมูลกลาง — ตรงกับคอลัมน์ในแท็บ Google Sheets (ดู apps-script/Code.gs > HEADERS)

export type UserRole = 'technician' | 'admin' | 'executive'

export interface User {
  id: string
  username: string
  full_name: string
  role: UserRole
}

export type ShopStatus = 'active' | 'inactive'

export interface Shop {
  id: string
  code: string
  name: string
  address?: string
  subdistrict?: string
  district?: string
  province?: string
  contact_name?: string
  phone?: string
  lat?: number | string
  lng?: number | string
  status: ShopStatus
  created_at?: string
  updated_at?: string
}

export type AssetStatus = 'in_stock' | 'loaned' | 'damaged' | 'lost'

export interface Asset {
  id: string
  code: string
  category?: string
  name: string
  serial?: string
  unit?: string
  value?: number | string
  status: AssetStatus
  shop_id?: string
  created_at?: string
  updated_at?: string
}

export type LogType = 'issue' | 'transfer' | 'return'
export type LogStatus = 'active' | 'returned' | 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LoanItem {
  asset_id?: string
  asset_code?: string
  asset_name: string
  qty: number
}

export interface LogRow {
  id: string
  ts: string
  type: LogType
  loan_no?: string
  shop_id?: string
  shop_name?: string
  technician?: string
  items_json?: string
  items_summary?: string
  qty_total?: number
  deposit?: number
  status: LogStatus
  from_shop_id?: string
  to_shop_id?: string
  signature?: string
  contract_url?: string
  approved_by?: string
  approved_at?: string
  note?: string
  items?: LoanItem[]
}

export type AuditCondition = 'ok' | 'damaged' | 'lost' | 'missing'

export interface AuditRow {
  id: string
  ts: string
  cycle: string | number
  shop_id?: string
  shop_name?: string
  asset_code?: string
  asset_name?: string
  expected_qty?: number
  counted_qty?: number
  condition: AuditCondition
  technician?: string
  note?: string
  status?: string
}

export interface Paged<T> {
  rows: T[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardStats {
  assets: {
    total: number
    in_stock: number
    loaned: number
    damaged: number
    lost: number
    value: number
  }
  shops: { total: number; active: number }
  loans: { active: number; total: number }
  pending: number
  recent: LogRow[]
}
