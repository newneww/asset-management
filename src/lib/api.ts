// ชั้นสื่อสารกับ Apps Script Web App (ฐานข้อมูล Google Sheets)
// ทุกคำขอเป็น POST body JSON แบบ text/plain เพื่อเลี่ยง CORS preflight
// (Apps Script อ่านจาก e.postData.contents)

import { demoCall } from '@/lib/demo'

const API_URL = import.meta.env.VITE_API_URL
const DEMO = import.meta.env.VITE_DEMO === '1'

const TOKEN_KEY = 'am_token'
const USER_KEY = 'am_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}
export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}
export function setStoredUser(user: unknown | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }

export async function api<T = unknown>(
  action: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  if (DEMO) return demoCall<T>(action, params)

  if (!API_URL) {
    throw new Error(
      'ยังไม่ได้ตั้งค่า VITE_API_URL — คัดลอก .env.example เป็น .env แล้วใส่ URL ของ Apps Script Web app',
    )
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token: getToken(), ...params }),
    redirect: 'follow',
  })

  let json: ApiResponse<T>
  try {
    json = (await res.json()) as ApiResponse<T>
  } catch {
    throw new Error('การเชื่อมต่อผิดพลาด (คำตอบไม่ใช่ JSON) — ตรวจสอบ URL และการ Deploy ของ Apps Script')
  }
  if (!json.ok) throw new Error(json.error)
  return json.data
}
