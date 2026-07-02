// i18n.js — Bilingual (Thai / English) string table + helpers.
const LANG_KEY = 'assetmgmt.lang';

const STRINGS = {
  appTitle: { th: 'Asset Management', en: 'Asset Management' },
  appSubtitle: { th: 'เบิก · ยืม · Audit · อนุมัติ', en: 'Loan · Move · Audit · Approve' },
  roleTech: { th: 'ช่าง Service', en: 'Technician' },
  roleAdmin: { th: 'แอดมิน / ผู้บริหาร', en: 'Admin / Executive' },
  roleData: { th: 'ฐานข้อมูลกลาง', en: 'Central Database' },

  // Technician nav
  navLoan: { th: 'เบิกอุปกรณ์ & ทำสัญญา', en: 'Loan & Contract' },
  navUpdate: { th: 'อัปเดตหน้างาน', en: 'On-site Update' },
  navAudit: { th: 'Audit ประจำปี', en: 'Annual Audit' },
  navHistory: { th: 'ตรวจสอบประวัติร้าน', en: 'Shop History' },

  // Admin nav
  navDashboard: { th: 'ภาพรวมสถานะ', en: 'Overview' },
  navApprove: { th: 'อนุมัติการย้าย/Audit', en: 'Approvals' },
  navReport: { th: 'สรุปรายงาน / Export', en: 'Reports / Export' },

  // Common
  shop: { th: 'ร้านค้า', en: 'Shop' },
  asset: { th: 'ทรัพย์สิน', en: 'Asset' },
  assets: { th: 'ทรัพย์สิน', en: 'Assets' },
  status: { th: 'สถานะ', en: 'Status' },
  type: { th: 'ประเภท', en: 'Type' },
  serial: { th: 'ซีเรียล', en: 'Serial' },
  deposit: { th: 'มัดจำ', en: 'Deposit' },
  technician: { th: 'ช่างผู้ทำรายการ', en: 'Technician' },
  note: { th: 'หมายเหตุ', en: 'Note' },
  date: { th: 'วันที่', en: 'Date' },
  save: { th: 'บันทึก', en: 'Save' },
  submit: { th: 'ยืนยัน', en: 'Submit' },
  cancel: { th: 'ยกเลิก', en: 'Cancel' },
  search: { th: 'ค้นหา', en: 'Search' },
  select: { th: '— เลือก —', en: '— Select —' },
  clear: { th: 'ล้าง', en: 'Clear' },
  approve: { th: 'อนุมัติ', en: 'Approve' },
  reject: { th: 'ไม่อนุมัติ', en: 'Reject' },
  approved: { th: 'อนุมัติแล้ว', en: 'Approved' },
  pending: { th: 'รออนุมัติ', en: 'Pending' },
  total: { th: 'ทั้งหมด', en: 'Total' },
  action: { th: 'การทำรายการ', en: 'Action' },

  // Loan form
  loanTitle: { th: 'เบิกอุปกรณ์ & ทำสัญญายืม', en: 'Equipment Loan & Contract' },
  selectShop: { th: 'เลือกร้านค้า', en: 'Select shop' },
  selectAssets: { th: 'เลือกทรัพย์สินที่เบิก (ในคลัง)', en: 'Select assets to loan (in stock)' },
  signature: { th: 'ลายเซ็นผู้ยืม', en: "Borrower's signature" },
  signHint: { th: 'เซ็นชื่อในกรอบด้านล่างด้วยนิ้ว/เมาส์', en: 'Sign in the box below with finger/mouse' },
  createContract: { th: 'สร้างสัญญา & พิมพ์ PDF', en: 'Create contract & print PDF' },
  noStock: { th: 'ไม่มีทรัพย์สินในคลัง', en: 'No assets in stock' },

  // On-site update
  updateTitle: { th: 'อัปเดตหน้างาน', en: 'On-site Update' },
  actNewShop: { th: 'ร้านใหม่', en: 'New Shop' },
  actMove: { th: 'ย้ายอุปกรณ์', en: 'Move Asset' },
  actReturn: { th: 'คืนอุปกรณ์', en: 'Return Asset' },
  actCheck: { th: 'เช็กความครบ', en: 'Completeness Check' },
  shopName: { th: 'ชื่อร้าน', en: 'Shop name' },
  address: { th: 'ที่อยู่', en: 'Address' },
  area: { th: 'พื้นที่', en: 'Area' },
  destShop: { th: 'ย้ายไปร้าน', en: 'Move to shop' },
  moveNeedsApproval: { th: 'การย้ายต้องรอแอดมินอนุมัติ', en: 'Moves require admin approval' },

  // Audit
  auditTitle: { th: 'Audit ทรัพย์สินประจำปี', en: 'Annual Asset Audit' },
  auditPickShop: { th: 'เลือกร้านเพื่อนับทรัพย์สิน', en: 'Pick a shop to count assets' },
  countedStatus: { th: 'สถานะที่นับได้', en: 'Counted status' },
  saveAudit: { th: 'บันทึกผล Audit', en: 'Save audit results' },

  // History
  historyTitle: { th: 'ประวัติร้าน (สัญญายืมย้อนหลัง)', en: 'Shop History (past loans)' },

  // Dashboard
  cardActive: { th: 'ทรัพย์สินใช้งาน (Active)', en: 'Active Assets' },
  cardTotal: { th: 'ทรัพย์สินทั้งหมด', en: 'Total Assets' },
  cardDamaged: { th: 'ชำรุด/สูญหาย', en: 'Damaged/Lost' },
  cardPending: { th: 'รออนุมัติ', en: 'Pending Approval' },
  cardShops: { th: 'ร้านค้าเปิดใช้งาน', en: 'Active Shops' },
  cardDeposit: { th: 'มัดจำรวม (บาท)', en: 'Total Deposit (THB)' },
  byArea: { th: 'ทรัพย์สินตามพื้นที่', en: 'Assets by Area' },
  byType: { th: 'ทรัพย์สินตามประเภท', en: 'Assets by Type' },
  realtime: { th: 'ข้อมูลเรียลไทม์จากฐานข้อมูลกลาง', en: 'Live data from central DB' },

  // Approvals
  approveTitle: { th: 'รายการรออนุมัติ', en: 'Pending Approvals' },
  noPending: { th: 'ไม่มีรายการรออนุมัติ 🎉', en: 'No pending items 🎉' },

  // Report
  reportTitle: { th: 'สรุปรายงาน & ส่งออกข้อมูล', en: 'Reports & Data Export' },
  exportCsv: { th: 'Export CSV', en: 'Export CSV' },
  table: { th: 'ตาราง', en: 'Table' },
  rows: { th: 'แถว', en: 'rows' },

  // Data viewer
  dataTitle: { th: 'ฐานข้อมูลกลาง (จำลอง Google Sheets)', en: 'Central Database (mock Google Sheets)' },
  sheetShops: { th: 'ตารางร้านค้า (Shop Master)', en: 'Shop Master' },
  sheetAssets: { th: 'ตารางทรัพย์สิน (Asset Master)', en: 'Asset Master' },
  sheetLogs: { th: 'ตารางประวัติ (Log & History)', en: 'Log & History' },
  sheetAudits: { th: 'ตาราง Audit', en: 'Audit' },

  resetDemo: { th: 'รีเซ็ตข้อมูลตัวอย่าง', en: 'Reset demo data' },
  resetConfirm: { th: 'ล้างและสร้างข้อมูลตัวอย่างใหม่ทั้งหมด?', en: 'Wipe and regenerate all demo data?' },

  // toasts
  contractCreated: { th: 'สร้างสัญญาและบันทึกแล้ว', en: 'Contract created and saved' },
  updateSaved: { th: 'บันทึกการอัปเดตหน้างานแล้ว', en: 'On-site update saved' },
  auditSaved: { th: 'บันทึกผล Audit แล้ว', en: 'Audit saved' },
  itemApproved: { th: 'อนุมัติรายการแล้ว', en: 'Item approved' },
  itemRejected: { th: 'ปฏิเสธรายการแล้ว', en: 'Item rejected' },
  depositReminder: { th: 'แจ้งเตือนมัดจำค้างรับ', en: 'Deposit collection reminder' },
  needSignature: { th: 'กรุณาเซ็นชื่อก่อน', en: 'Please sign first' },
  needShopAsset: { th: 'เลือกร้านและทรัพย์สินก่อน', en: 'Select a shop and assets first' },
};

let _lang = localStorage.getItem(LANG_KEY) || 'th';

export function getLang() { return _lang; }

export function setLang(lang) {
  _lang = lang === 'en' ? 'en' : 'th';
  localStorage.setItem(LANG_KEY, _lang);
  applyStatic();
}

export function toggleLang() { setLang(_lang === 'th' ? 'en' : 'th'); }

// Translate a key.
export function t(key) {
  const s = STRINGS[key];
  if (!s) return key;
  return s[_lang] || s.th || key;
}

// Apply translations to any element with data-i18n in the current DOM.
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.documentElement.lang = _lang;
}

export default { getLang, setLang, toggleLang, t, applyStatic };
