// seed.js — Generates realistic demo data so the dashboard shows 2,000+ Active / 4,000+ Total.
// Simulates what would otherwise live in Google Sheets.
import db from './db.js';

const ASSET_TYPES = [
  { th: 'ตู้แช่', en: 'Freezer', deposit: 5000 },
  { th: 'ตู้เย็น', en: 'Fridge', deposit: 4000 },
  { th: 'เครื่อง POS', en: 'POS Terminal', deposit: 3000 },
  { th: 'ป้ายไฟ', en: 'Light Box', deposit: 1500 },
  { th: 'ชั้นวางสินค้า', en: 'Shelf Rack', deposit: 800 },
  { th: 'เครื่องทำน้ำแข็ง', en: 'Ice Maker', deposit: 6000 },
];

const AREAS = ['กรุงเทพฯ', 'ปริมณฑล', 'ภาคกลาง', 'ภาคเหนือ', 'ภาคอีสาน', 'ภาคใต้'];
const SHOP_PREFIX = ['ร้าน', 'มินิมาร์ท', 'โชห่วย', 'ร้านสะดวกซื้อ'];
const SHOP_NAMES = ['สมชาย', 'ป้าแดง', 'เจ๊หมวย', 'ลุงมี', 'พรทิพย์', 'รุ่งเรือง', 'ทรัพย์เจริญ',
  'ชัยพร', 'สุขใจ', 'มั่งมี', 'ไทยเจริญ', 'บ้านสวน', 'ริมทาง', 'หัวมุม', 'ตลาดสด'];
const TECHNICIANS = ['ช่างเอ (A. Somsak)', 'ช่างบี (B. Wichai)', 'ช่างซี (C. Prayut)', 'ช่างดี (D. Nattapong)'];
const ASSET_STATUS = ['ปกติ', 'ปกติ', 'ปกติ', 'ปกติ', 'ปกติ', 'ปกติ', 'ชำรุด', 'สูญหาย']; // weighted normal

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n, len) { return String(n).padStart(len, '0'); }
function daysAgo(d) { return new Date(Date.now() - d * 86400000).toISOString(); }

export function generate() {
  const shops = [];
  const assets = [];
  const logs = [];
  const audits = [];

  const NUM_SHOPS = 600;
  const NUM_ASSETS = 4200; // Total > 4000

  // --- Shop Master ---
  for (let i = 1; i <= NUM_SHOPS; i++) {
    const active = Math.random() > 0.08; // ~92% active
    shops.push({
      shopId: 'SH' + pad(i, 4),
      name: `${pick(SHOP_PREFIX)}${pick(SHOP_NAMES)} สาขา ${i}`,
      address: `${Math.floor(Math.random() * 999) + 1} หมู่ ${Math.floor(Math.random() * 12) + 1} ต.ในเมือง`,
      area: pick(AREAS),
      status: active ? 'เปิดใช้งาน' : 'ปิด',
    });
  }

  // --- Asset Master ---
  // Assign roughly 70% of assets to shops (Active = installed at an active shop, status ปกติ),
  // the rest sit in warehouse (shopId = null) or are damaged/lost.
  for (let i = 1; i <= NUM_ASSETS; i++) {
    const type = pick(ASSET_TYPES);
    const status = pick(ASSET_STATUS);
    const inField = status === 'ปกติ' && Math.random() > 0.22;
    const shop = inField ? pick(shops.filter(s => s.status === 'เปิดใช้งาน')) : null;
    assets.push({
      assetId: 'AS' + pad(i, 5),
      type: type.th,
      typeEn: type.en,
      serial: `SN-${type.en.slice(0, 3).toUpperCase()}-${pad(i, 5)}`,
      shopId: shop ? shop.shopId : null,
      status,
      deposit: type.deposit,
    });
  }

  // --- Log & History --- (loans / moves / returns), some pending approval.
  let logSeq = 1;
  const fieldAssets = assets.filter(a => a.shopId);
  for (const a of fieldAssets) {
    // Original loan log for each installed asset.
    logs.push({
      logId: 'LOG' + pad(logSeq++, 6),
      ts: daysAgo(Math.floor(Math.random() * 700) + 30),
      type: 'เบิก',
      assetId: a.assetId,
      shopId: a.shopId,
      technician: pick(TECHNICIANS),
      note: 'ติดตั้งอุปกรณ์และทำสัญญายืม',
      approvalStatus: 'อนุมัติแล้ว',
      deposit: a.deposit,
    });
  }
  // A handful of recent moves still waiting for admin approval.
  const movers = fieldAssets.slice(0, 18);
  for (const a of movers) {
    const dest = pick(shops.filter(s => s.status === 'เปิดใช้งาน' && s.shopId !== a.shopId));
    logs.push({
      logId: 'LOG' + pad(logSeq++, 6),
      ts: daysAgo(Math.floor(Math.random() * 10)),
      type: 'ย้าย',
      assetId: a.assetId,
      shopId: dest.shopId,
      fromShopId: a.shopId,
      technician: pick(TECHNICIANS),
      note: `ขอย้ายจาก ${a.shopId} ไป ${dest.shopId}`,
      approvalStatus: 'รออนุมัติ',
      deposit: a.deposit,
    });
  }

  // --- Audit --- last year's audit sample.
  const lastYear = new Date().getFullYear() - 1;
  for (const a of fieldAssets.slice(0, 400)) {
    audits.push({
      auditId: 'AUD' + pad(audits.length + 1, 6),
      year: lastYear,
      assetId: a.assetId,
      shopId: a.shopId,
      countedStatus: pick(ASSET_STATUS),
      auditor: pick(TECHNICIANS),
      ts: daysAgo(Math.floor(Math.random() * 200) + 120),
    });
  }

  return { shops, assets, logs, audits };
}

// Seed the DB if empty. Returns true if it seeded.
export function seedIfEmpty() {
  if (db.isSeeded()) return false;
  db.replaceAll(generate());
  return true;
}

// Force re-seed (used by the reset button).
export function reseed() {
  db.reset();
  db.replaceAll(generate());
}
