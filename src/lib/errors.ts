/** ดึงข้อความ error ที่อ่านง่าย */
export function errMsg(err: unknown): string {
  if (!err) return 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  return 'เกิดข้อผิดพลาด'
}
