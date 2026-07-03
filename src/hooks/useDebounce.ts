import { useEffect, useState } from 'react'

/** คืนค่า value ที่หน่วงเวลา (ใช้กับช่องค้นหา เพื่อไม่ยิง query ทุกตัวอักษร) */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
