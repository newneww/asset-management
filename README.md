# ระบบจัดการทรัพย์สินอุปกรณ์ (Asset Management)

เว็บแอปติดตามการยืม/ติดตั้ง/ตรวจนับอุปกรณ์ที่บริษัทให้ร้านค้ายืมไปใช้งาน
โดยใช้ **Google Sheets เป็นฐานข้อมูลหลัก** และ **Google Apps Script เป็น API/ประมวลผล**
(แนวทาง Low-Code — ไม่ต้องมีเซิร์ฟเวอร์ฐานข้อมูลหรือค่าโฮสต์แยก)

## Tech stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + TanStack Query
- **Database:** Google Sheets (4 แท็บ: `Shop Master`, `Asset Master`, `Log & History`, `Audit`)
- **Backend/API:** Google Apps Script Web App (`apps-script/Code.gs`)
  - สร้างเลขที่ใบยืมอัตโนมัติ (`LN-YYYY-NNNN`)
  - สร้าง **สัญญายืม PDF → เก็บใน Google Drive**
  - คำนวณยอด/สรุปแดชบอร์ด, ส่งออก CSV
  - ยืนยันตัวตนด้วย token (HMAC) + แบ่งสิทธิ์ 3 ระดับ

## บทบาทผู้ใช้ (roles)

| Role | ใช้งานหลัก | สิทธิ์ |
|------|-----------|--------|
| `technician` (ช่าง) | มือถือ/แท็บเล็ตหน้างาน | ทำใบยืม+เซ็นสัญญา, แจ้งย้าย/คืน, ตรวจนับ, ดูประวัติร้าน |
| `admin` (แอดมิน) | เดสก์ท็อป | จัดการทุกตาราง, อนุมัติการเคลื่อนย้าย, จัดการผู้ใช้ |
| `executive` (ผู้บริหาร) | เดสก์ท็อป | ดูแดชบอร์ด/รายงาน + ส่งออกไฟล์ |

---

## ตั้งค่าฐานข้อมูล + backend (ทำครั้งเดียว)

1. สร้าง **Google Sheet** ใหม่ (จะใช้เป็นฐานข้อมูล) แล้วเปิด **Extensions → Apps Script**
2. คัดลอกเนื้อหาไฟล์ `apps-script/Code.gs` ไปวางแทน `Code.gs` เดิม
   และเพิ่มไฟล์ manifest จาก `apps-script/appsscript.json`
   (ใน Apps Script Editor: ⚙️ Project Settings → เปิด "Show appsscript.json")
3. รันฟังก์ชัน **`setup`** หนึ่งครั้ง (เลือก `setup` แล้วกด Run — อนุญาตสิทธิ์ตามที่ขอ)
   - จะสร้างแท็บทั้ง 4 พร้อมหัวคอลัมน์
   - สร้างผู้ใช้เริ่มต้น **`admin` / รหัสผ่าน `admin1234`** → **โปรดเปลี่ยนรหัสผ่านทันที**
4. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - กด Deploy แล้วคัดลอก **Web app URL** (ลงท้าย `/exec`)

### เพิ่ม/แก้ผู้ใช้ (ช่าง, แอดมิน, ผู้บริหาร)

แก้ค่าในฟังก์ชัน `createUser()` ใน `Code.gs` (username / ชื่อ / role / password) แล้วกด Run
รันซ้ำด้วย username เดิม = รีเซ็ตรหัสผ่าน/สิทธิ์

> รหัสผ่านถูก hash ด้วย SHA-256 + secret เฉพาะโปรเจกต์ ไม่เก็บเป็น plaintext

---

## ติดตั้งและรันเว็บแอป (local)

```bash
# 1) ติดตั้ง dependencies
npm install

# 2) ตั้งค่า environment
cp .env.example .env
#   แก้ .env: VITE_API_URL = Web app URL ที่ได้จากขั้นตอน Deploy

# 3) รัน dev server
npm run dev
```

เปิด http://localhost:5173 แล้วเข้าสู่ระบบด้วย `admin` / `admin1234`

### โหมดสาธิต (ดู UI โดยไม่ต้องต่อ Google Sheets)

```bash
# ตั้ง VITE_DEMO=1 ใน .env แล้ว
npm run dev
```

โหมดนี้ใช้ข้อมูลตัวอย่างในหน่วยความจำ (mock) — เข้าสู่ระบบด้วยอะไรก็ได้ (สิทธิ์แอดมิน)
ข้อมูลไม่คงอยู่หลังรีเฟรช

---

## โครงสร้างข้อมูล (แท็บใน Google Sheet)

- **Shop Master** — ร้านค้า: `id, code, name, address, subdistrict, district, province, contact_name, phone, lat, lng, status, ...`
- **Asset Master** — ทรัพย์สินรายชิ้น: `id, code, category, name, serial, unit, value, status(in_stock/loaned/damaged/lost), shop_id, ...`
- **Log & History** — เหตุการณ์ยืม/ย้าย/คืน: `id, ts, type(issue/transfer/return), loan_no, shop_id, items_json, deposit, status, signature, contract_url, approved_by, ...`
- **Audit** — การตรวจนับ: `id, ts, cycle, shop_id, asset_code, expected_qty, counted_qty, condition(ok/damaged/lost), ...`

> คอลัมน์จริงกำหนดใน `apps-script/Code.gs` (ค่าคงที่ `HEADERS`) — ปรับได้ที่จุดเดียว

---

## Deploy เว็บแอป

รองรับ Vercel/Cloudflare Pages (มี `vercel.json` สำหรับ SPA rewrite แล้ว)

```bash
npm run build   # ออกไฟล์ static ที่ dist/
```

ตั้ง env `VITE_API_URL` ในแพลตฟอร์มโฮสต์ให้ตรงกับ Web app URL

## ความปลอดภัยของข้อมูล

`.gitignore` กันไฟล์ `.env*`, `node_modules/`, `dist/`, และไฟล์ข้อมูลจริง
(`*.xlsx/*.csv`, `import-data/`, `data/`, `uploads/`) ออกจาก repo
Apps Script เข้าถึงเฉพาะ Sheet ที่ผูกไว้ (`spreadsheets.currentonly`) และ Drive สำหรับเก็บ PDF สัญญา
