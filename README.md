# Asset Management

เว็บสาธิต (demo/prototype) สำหรับบริหารจัดการการเบิก–ยืมอุปกรณ์ให้ร้านค้า, อัปเดตหน้างาน,
ตรวจนับทรัพย์สินประจำปี (Audit) และแดชบอร์ดผู้บริหาร — สร้างด้วย **HTML/CSS/JavaScript ล้วน**
(ไม่มี build step) ใช้ **localStorage** เป็นฐานข้อมูลจำลอง Google Sheets และรองรับ **ไทย/อังกฤษ**

A demo asset & equipment-loan management app. Pure HTML/CSS/JS, no build step,
localStorage as a mock "Google Sheets" database, bilingual Thai/English UI.

## รันเว็บ / Run

ไม่ต้องติดตั้งอะไร — เปิดไฟล์ `index.html` ในเบราว์เซอร์ได้เลย หรือรันเป็นเซิร์ฟเวอร์:

```bash
python3 -m http.server 8000
# แล้วเปิด http://localhost:8000
```

> เปิดผ่าน `http://` (ไม่ใช่ `file://`) เพราะโค้ดใช้ ES Modules

## โครงสร้าง / Structure

```
index.html            – app shell (สลับบทบาท ช่าง/แอดมิน/ฐานข้อมูล + toggle ภาษา)
css/styles.css        – responsive (มือถือสำหรับช่าง / เดสก์ท็อปสำหรับแอดมิน)
js/db.js              – ฐานข้อมูลจำลอง 4 ตาราง บน localStorage (CRUD)
js/seed.js            – สร้างข้อมูลตัวอย่าง (2,000+ Active / 4,000+ Total)
js/i18n.js            – ตารางคำแปล TH/EN + t()
js/router.js          – hash router
js/utils.js           – CSV export, print-to-PDF สัญญา, toast/แจ้งเตือน, ช่องเซ็นชื่อ
js/app.js             – bootstrap: seed, nav, routes, notifications
js/views/tech-*.js    – หน้าจอฝั่งช่าง Service
js/views/admin-*.js   – หน้าจอฝั่งแอดมิน/ผู้บริหาร
js/views/data-*.js    – ตัวดูฐานข้อมูลกลาง
```

## ฟีเจอร์ / Features

**1. ช่าง Service (มือถือ/แท็บเล็ต)**
- เบิกอุปกรณ์ & ทำสัญญา — ฟอร์ม + ช่องเซ็นชื่อบนหน้าจอ → ออกสัญญายืมเป็น PDF (พิมพ์/บันทึก)
- อัปเดตหน้างาน — ร้านใหม่ / ย้ายอุปกรณ์ / คืนอุปกรณ์ / เช็กความครบ
- Audit ประจำปี — นับทรัพย์สินจริง ระบุสถานะ (ปกติ/ชำรุด/สูญหาย)
- ตรวจสอบประวัติร้าน — ไทม์ไลน์สัญญายืมและกิจกรรมย้อนหลัง

**2. ฐานข้อมูลกลาง (จำลอง Google Sheets)** — Shop Master, Asset Master, Log & History, Audit
พร้อมค้นหา/กรอง และส่งออก CSV

**3. แอดมิน & ผู้บริหาร (เดสก์ท็อป)**
- ภาพรวมสถานะ — การ์ดสรุปเรียลไทม์ + กราฟแท่ง (ตามพื้นที่/ประเภท)
- อนุมัติการย้าย/Audit — ปุ่ม Approve / Reject
- สรุปรายงาน — Export Excel/CSV แต่ละตาราง + รีเซ็ตข้อมูลตัวอย่าง

**4. ระบบประมวลผล (จำลอง Apps Script)** — สร้างสัญญายืม PDF และแจ้งเตือนมัดจำ/สถานะรออนุมัติ

## หมายเหตุ / Notes
- ข้อมูลถูกเก็บใน `localStorage` ของเบราว์เซอร์ (คงอยู่หลังรีโหลด) — กด **รีเซ็ตข้อมูลตัวอย่าง**
  ในหน้า *สรุปรายงาน* เพื่อสร้างชุดข้อมูลใหม่
- ฟอนต์ Sarabun โหลดจาก Google Fonts (ถ้าออฟไลน์จะ fallback เป็น Tahoma/system อัตโนมัติ)
