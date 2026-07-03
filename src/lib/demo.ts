// โหมดสาธิต (VITE_DEMO=1): จำลอง backend ในหน่วยความจำเพื่อดู UI โดยไม่ต้องต่อ Google Sheets
// ไม่ใช่ข้อมูลจริงและไม่คงอยู่หลังรีเฟรช

import type { Asset, AuditRow, LogRow, Shop } from '@/types/database'

const now = () => new Date().toISOString()
const uid = (p: string) => p + '-' + Math.random().toString(36).slice(2, 8)

const shops: Shop[] = [
  { id: 'SH-1', code: 'SH-0001', name: 'ร้านลุงหนวด', district: 'เมือง', province: 'เชียงใหม่', contact_name: 'สมหมาย', phone: '0812345678', status: 'active' },
  { id: 'SH-2', code: 'SH-0002', name: 'ครัวริมโขง', district: 'เมือง', province: 'หนองคาย', contact_name: 'บุญมี', phone: '0898765432', status: 'active' },
  { id: 'SH-3', code: 'SH-0003', name: 'ผับกลางซอย', district: 'บางรัก', province: 'กรุงเทพฯ', contact_name: 'วิชัย', phone: '0801112222', status: 'inactive' },
]

const assets: Asset[] = [
  { id: 'AS-1', code: 'AS-0001', category: 'Tower', name: 'หัวจ่ายเบียร์ 2 หัว', serial: 'TW-001', unit: 'ชุด', value: 8500, status: 'loaned', shop_id: 'SH-1' },
  { id: 'AS-2', code: 'AS-0002', category: 'Cooler', name: 'ตู้แช่เบียร์สด', serial: 'CL-114', unit: 'เครื่อง', value: 22000, status: 'loaned', shop_id: 'SH-1' },
  { id: 'AS-3', code: 'AS-0003', category: 'CO2', name: 'ถังก๊าซ CO2', serial: 'CO-908', unit: 'ถัง', value: 3200, status: 'in_stock' },
  { id: 'AS-4', code: 'AS-0004', category: 'Coupler', name: 'หัวต่อถัง Keg', serial: 'KC-045', unit: 'ชิ้น', value: 1500, status: 'damaged' },
  { id: 'AS-5', code: 'AS-0005', category: 'Cooler', name: 'ตู้แช่เบียร์สด', serial: 'CL-115', unit: 'เครื่อง', value: 22000, status: 'in_stock' },
]

const logs: LogRow[] = [
  { id: 'LG-1', ts: now(), type: 'issue', loan_no: 'LN-2026-0001', shop_id: 'SH-1', shop_name: 'ร้านลุงหนวด', technician: 'สมชาย ใจดี', items_summary: 'ตู้แช่เบียร์สด x1, หัวจ่ายเบียร์ 2 หัว x1', qty_total: 2, deposit: 5000, status: 'active', items_json: JSON.stringify([{ asset_id: 'AS-2', asset_code: 'AS-0002', asset_name: 'ตู้แช่เบียร์สด', qty: 1 }, { asset_id: 'AS-1', asset_code: 'AS-0001', asset_name: 'หัวจ่ายเบียร์ 2 หัว', qty: 1 }]) },
  { id: 'LG-2', ts: now(), type: 'transfer', shop_id: 'SH-2', shop_name: 'ครัวริมโขง', from_shop_id: 'SH-2', to_shop_id: 'SH-1', technician: 'สมชาย ใจดี', items_summary: 'ถังก๊าซ CO2 x1', qty_total: 1, status: 'pending', items_json: JSON.stringify([{ asset_id: 'AS-3', asset_name: 'ถังก๊าซ CO2', qty: 1 }]) },
]

const audit: AuditRow[] = [
  { id: 'AD-1', ts: now(), cycle: 2026, shop_id: 'SH-1', shop_name: 'ร้านลุงหนวด', asset_code: 'AS-0002', asset_name: 'ตู้แช่เบียร์สด', expected_qty: 1, counted_qty: 1, condition: 'ok', technician: 'สมชาย ใจดี', status: 'recorded' },
]

const demoUser = { id: 'US-1', username: 'demo', full_name: 'ผู้ใช้สาธิต', role: 'admin' as const }

function paginate<T>(rows: T[], p: Record<string, unknown>) {
  const page = Math.max(1, Number(p.page || 1))
  const size = Math.max(1, Number(p.pageSize || 20))
  const start = (page - 1) * size
  return { rows: rows.slice(start, start + size), total: rows.length, page, pageSize: size }
}

export async function demoCall<T>(action: string, p: Record<string, any>): Promise<T> {
  await new Promise((r) => setTimeout(r, 120)) // จำลอง latency
  switch (action) {
    case 'ping':
      return { pong: true } as T
    case 'login':
      return { token: 'demo-token', user: demoUser } as T
    case 'me':
      return demoUser as T
    case 'listShops':
      return paginate(shops.filter((s) => !p.q || (s.name + s.code + s.province).toLowerCase().includes(String(p.q).toLowerCase())), p) as T
    case 'getShop': {
      const shop = shops.find((s) => s.id === p.id)
      return { shop, assets: assets.filter((a) => a.shop_id === p.id), logs: logs.filter((l) => l.shop_id === p.id) } as T
    }
    case 'upsertShop': {
      const s = p.shop as Shop
      if (s.id) Object.assign(shops.find((x) => x.id === s.id)!, s)
      else { s.id = uid('SH'); s.code = s.code || 'SH-' + uid(''); s.status = s.status || 'active'; shops.push(s) }
      return s as T
    }
    case 'listAssets': {
      const filtered = assets.filter((a) =>
        (!p.q || (a.name + a.code + (a.serial ?? '')).toLowerCase().includes(String(p.q).toLowerCase())) &&
        (!p.category || a.category === p.category) &&
        (!p.status || a.status === p.status))
      return { ...paginate(filtered, p), categories: [...new Set(assets.map((a) => a.category).filter(Boolean))] } as T
    }
    case 'upsertAsset': {
      const a = p.asset as Asset
      if (a.id) Object.assign(assets.find((x) => x.id === a.id)!, a)
      else { a.id = uid('AS'); a.code = a.code || 'AS-' + uid(''); a.status = a.status || 'in_stock'; assets.push(a) }
      return a as T
    }
    case 'listLoans':
      return paginate(logs.filter((l) => l.type === 'issue' && (!p.status || l.status === p.status)), p) as T
    case 'getLoan': {
      const l = logs.find((x) => x.id === p.id)!
      return { ...l, items: l.items_json ? JSON.parse(l.items_json) : [] } as T
    }
    case 'createLoan': {
      const row: LogRow = { id: uid('LG'), ts: now(), type: 'issue', loan_no: 'LN-2026-' + String(logs.length + 1).padStart(4, '0'), shop_id: p.shop_id, shop_name: shops.find((s) => s.id === p.shop_id)?.name, technician: demoUser.full_name, items_json: JSON.stringify(p.items), items_summary: p.items.map((i: any) => `${i.asset_name} x${i.qty}`).join(', '), qty_total: p.items.reduce((s: number, i: any) => s + Number(i.qty), 0), deposit: Number(p.deposit || 0), status: 'active', contract_url: '#demo-pdf', signature: p.signature }
      logs.unshift(row)
      return row as T
    }
    case 'returnLoan': {
      const l = logs.find((x) => x.id === p.id)!; l.status = 'returned'; return l as T
    }
    case 'createMovement': {
      const row: LogRow = { id: uid('LG'), ts: now(), type: p.type, shop_id: p.from_shop_id, from_shop_id: p.from_shop_id, to_shop_id: p.to_shop_id, technician: demoUser.full_name, items_json: JSON.stringify(p.items), items_summary: p.items.map((i: any) => `${i.asset_name} x${i.qty}`).join(', '), qty_total: p.items.length, status: 'pending' }
      logs.unshift(row); return row as T
    }
    case 'listMovements':
      return paginate(logs.filter((l) => (l.type === 'transfer' || l.type === 'return') && (!p.status || l.status === p.status)), p) as T
    case 'approveMovement': {
      const l = logs.find((x) => x.id === p.id)!; l.status = p.decision; l.approved_by = demoUser.full_name; return l as T
    }
    case 'listAudit':
      return paginate(audit.filter((a) => !p.cycle || String(a.cycle) === String(p.cycle)), p) as T
    case 'createAudit': {
      p.items.forEach((it: any) => audit.unshift({ id: uid('AD'), ts: now(), cycle: p.cycle || 2026, shop_id: p.shop_id, shop_name: shops.find((s) => s.id === p.shop_id)?.name, ...it, technician: demoUser.full_name, status: 'recorded' }))
      return { inserted: p.items.length } as T
    }
    case 'dashboard':
      return {
        assets: { total: assets.length, in_stock: assets.filter((a) => a.status === 'in_stock').length, loaned: assets.filter((a) => a.status === 'loaned').length, damaged: assets.filter((a) => a.status === 'damaged').length, lost: assets.filter((a) => a.status === 'lost').length, value: assets.reduce((s, a) => s + Number(a.value || 0), 0) },
        shops: { total: shops.length, active: shops.filter((s) => s.status === 'active').length },
        loans: { active: logs.filter((l) => l.type === 'issue' && l.status === 'active').length, total: logs.filter((l) => l.type === 'issue').length },
        pending: logs.filter((l) => (l.type === 'transfer' || l.type === 'return') && l.status === 'pending').length,
        recent: logs.slice(0, 8),
      } as T
    case 'exportCsv':
      return { filename: 'demo.csv', csv: 'id,demo\n1,ตัวอย่าง', count: 1 } as T
    default:
      throw new Error('demo: ไม่รองรับ action ' + action)
  }
}
