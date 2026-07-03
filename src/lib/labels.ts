// ป้ายกำกับภาษาไทยและ mapping สถานะ (ใช้ร่วมกันทั้งแอป)
import type {
  AssetStatus,
  AuditCondition,
  LogStatus,
  LogType,
  ShopStatus,
  UserRole,
} from '@/types/database'

export const roleLabels: Record<UserRole, string> = {
  technician: 'ช่าง',
  admin: 'แอดมิน',
  executive: 'ผู้บริหาร',
}

export const shopStatusLabels: Record<ShopStatus, string> = {
  active: 'ใช้งาน',
  inactive: 'ปิด',
}

export const assetStatusLabels: Record<AssetStatus, string> = {
  in_stock: 'อยู่ในคลัง',
  loaned: 'ถูกยืม',
  damaged: 'ชำรุด',
  lost: 'สูญหาย',
}

export const assetStatusBadge: Record<AssetStatus, string> = {
  in_stock: 'bg-green-100 text-green-800',
  loaned: 'bg-blue-100 text-blue-800',
  damaged: 'bg-amber-100 text-amber-800',
  lost: 'bg-red-100 text-red-700',
}

export const logTypeLabels: Record<LogType, string> = {
  issue: 'เบิก/ยืม',
  transfer: 'ย้ายร้าน',
  return: 'คืนคลัง',
}

export const logTypeBadge: Record<LogType, string> = {
  issue: 'bg-blue-100 text-blue-800',
  transfer: 'bg-purple-100 text-purple-800',
  return: 'bg-gray-100 text-gray-700',
}

export const logStatusLabels: Record<LogStatus, string> = {
  active: 'กำลังยืม',
  returned: 'คืนแล้ว',
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  cancelled: 'ยกเลิก',
}

export const logStatusBadge: Record<LogStatus, string> = {
  active: 'bg-green-100 text-green-800',
  returned: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
}

export const conditionLabels: Record<AuditCondition, string> = {
  ok: 'ปกติ',
  damaged: 'ชำรุด',
  lost: 'สูญหาย',
  missing: 'หาไม่พบ',
}

export const conditionBadge: Record<AuditCondition, string> = {
  ok: 'bg-green-100 text-green-800',
  damaged: 'bg-amber-100 text-amber-800',
  lost: 'bg-red-100 text-red-700',
  missing: 'bg-gray-100 text-gray-700',
}
