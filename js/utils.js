// utils.js — Shared helpers: DOM, toasts/notifications, CSV export, print-to-PDF, signature pad.
import { t } from './i18n.js';

// --- Tiny DOM helper ---------------------------------------------------------
// el('div', {class:'x', onclick:fn}, ['text', childNode])
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number'
      ? document.createTextNode(String(c)) : c);
  }
  return node;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

// --- Formatting --------------------------------------------------------------
export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
export function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
export function fmtBaht(n) { return (n || 0).toLocaleString('en-US'); }

// --- Toasts & notification center -------------------------------------------
const _notifications = []; // {ts, title, body, kind}

export function toast(msg, kind = 'info') {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = el('div', { id: 'toast-host', class: 'toast-host' });
    document.body.appendChild(host);
  }
  const node = el('div', { class: `toast toast-${kind}` }, msg);
  host.appendChild(node);
  setTimeout(() => node.classList.add('show'), 10);
  setTimeout(() => { node.classList.remove('show'); setTimeout(() => node.remove(), 300); }, 3200);
}

export function notify(title, body, kind = 'info') {
  _notifications.unshift({ ts: new Date().toISOString(), title, body, kind });
  toast(title, kind);
  updateNotifBadge();
}

export function getNotifications() { return _notifications.slice(); }

export function updateNotifBadge() {
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = _notifications.length;
    badge.style.display = _notifications.length ? 'inline-flex' : 'none';
  }
}

// --- CSV export --------------------------------------------------------------
function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// rows: array of objects. Downloads a UTF-8 CSV (Excel-openable, with BOM).
export function exportCsv(filename, rows) {
  if (!rows.length) { toast('No data', 'warn'); return; }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map(h => csvCell(r[h])).join(','));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Print-to-PDF contract (mock Apps Script "generate PDF") -----------------
// Opens a print window with a styled loan contract; user picks "Save as PDF".
export function printContract({ contractNo, shop, technician, assets, signatureDataUrl, date }) {
  const w = window.open('', '_blank', 'width=800,height=1000');
  if (!w) { toast('โปรดอนุญาต popup / Please allow popups', 'warn'); return; }
  const rows = assets.map((a, i) => `
    <tr><td>${i + 1}</td><td>${a.assetId}</td><td>${a.type} (${a.typeEn})</td>
    <td>${a.serial}</td><td style="text-align:right">${fmtBaht(a.deposit)}</td></tr>`).join('');
  const totalDeposit = assets.reduce((s, a) => s + (a.deposit || 0), 0);
  w.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8">
    <title>สัญญายืม ${contractNo}</title>
    <style>
      body{font-family:'Tahoma','Sarabun',sans-serif;padding:40px;color:#111;font-size:14px}
      h1{text-align:center;font-size:20px;margin:0 0 4px}
      .sub{text-align:center;color:#555;margin-bottom:24px}
      .meta{display:flex;justify-content:space-between;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;margin:12px 0}
      th,td{border:1px solid #999;padding:6px 8px;font-size:13px}
      th{background:#f0f0f0}
      .terms{font-size:12px;color:#333;line-height:1.6;margin:16px 0}
      .sign{margin-top:48px;display:flex;justify-content:space-around;text-align:center}
      .sign img{max-height:70px;border-bottom:1px solid #333;display:block;margin:0 auto 4px}
      .line{border-bottom:1px solid #333;width:200px;height:70px;margin:0 auto 4px}
      @media print{@page{margin:16mm}}
    </style></head><body>
    <h1>สัญญายืมทรัพย์สิน / Asset Loan Agreement</h1>
    <div class="sub">เลขที่สัญญา / Contract No: <b>${contractNo}</b></div>
    <div class="meta">
      <div><b>ร้านค้า:</b> ${shop.name}<br><b>รหัสร้าน:</b> ${shop.shopId}<br><b>ที่อยู่:</b> ${shop.address}, ${shop.area}</div>
      <div style="text-align:right"><b>วันที่:</b> ${fmtDate(date)}<br><b>ช่างผู้ทำรายการ:</b> ${technician}</div>
    </div>
    <table><thead><tr><th>#</th><th>รหัสทรัพย์สิน</th><th>ประเภท</th><th>ซีเรียล</th><th>มัดจำ (บาท)</th></tr></thead>
    <tbody>${rows}<tr><td colspan="4" style="text-align:right"><b>รวมมัดจำ</b></td>
    <td style="text-align:right"><b>${fmtBaht(totalDeposit)}</b></td></tr></tbody></table>
    <div class="terms">
      <b>เงื่อนไข:</b> ผู้ยืมตกลงรับทรัพย์สินข้างต้นไปใช้งาน ณ ร้านค้าที่ระบุ และจะดูแลรักษาให้อยู่ในสภาพดี
      หากชำรุดหรือสูญหายยินยอมให้หักจากเงินมัดจำ และคืนทรัพย์สินเมื่อสิ้นสุดสัญญา
    </div>
    <div class="sign">
      <div>${signatureDataUrl ? `<img src="${signatureDataUrl}" alt="signature">` : '<div class="line"></div>'}
        (.......................................)<br>ผู้ยืม / Borrower</div>
      <div><div class="line"></div>(.......................................)<br>ผู้ให้ยืม / Lender (${technician})</div>
    </div>
    <script>window.onload=function(){setTimeout(function(){window.print();},400);}<\/script>
    </body></html>`);
  w.document.close();
}

// --- Signature pad (canvas) --------------------------------------------------
// Attaches drawing handlers; returns {clear, isEmpty, toDataURL}.
export function makeSignaturePad(canvas) {
  const ctx = canvas.getContext('2d');
  let drawing = false, dirty = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
  }
  // Defer resize until element is in layout.
  requestAnimationFrame(resize);

  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }
  function start(e) { drawing = true; dirty = true; const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y); e.preventDefault(); }
  function move(e) { if (!drawing) return; const { x, y } = pos(e); ctx.lineTo(x, y); ctx.stroke(); e.preventDefault(); }
  function end() { drawing = false; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);

  return {
    clear() { ctx.clearRect(0, 0, canvas.width, canvas.height); dirty = false; },
    isEmpty() { return !dirty; },
    toDataURL() { return dirty ? canvas.toDataURL('image/png') : null; },
  };
}

// Status pill helper.
export function statusPill(status) {
  const map = {
    'ปกติ': 'ok', 'ชำรุด': 'warn', 'สูญหาย': 'bad',
    'อนุมัติแล้ว': 'ok', 'รออนุมัติ': 'pending', 'เปิดใช้งาน': 'ok', 'ปิด': 'muted',
  };
  return el('span', { class: `pill pill-${map[status] || 'muted'}` }, status);
}
