// admin-report.js — สรุปรายงาน / Export CSV for each table.
import db from '../db.js';
import { t, getLang } from '../i18n.js';
import { el, clear, exportCsv, notify } from '../utils.js';

const TABLE_META = [
  { table: 'shops', labelKey: 'sheetShops', ico: '🏪' },
  { table: 'assets', labelKey: 'sheetAssets', ico: '📦' },
  { table: 'logs', labelKey: 'sheetLogs', ico: '🕘' },
  { table: 'audits', labelKey: 'sheetAudits', ico: '✅' },
];

export function renderReport(view) {
  clear(view);
  const lang = getLang();
  view.appendChild(el('h1', { class: 'page-title' }, t('reportTitle')));
  view.appendChild(el('p', { class: 'page-sub' },
    lang === 'th' ? 'ส่งออกข้อมูลแต่ละตารางเป็นไฟล์ CSV (เปิดใน Excel ได้)'
      : 'Export each table as CSV (opens in Excel).'));

  const cards = el('div', { class: 'cards' }, TABLE_META.map(m => {
    const n = db.count(m.table);
    const btn = el('button', { class: 'btn sm', onclick: () => {
      exportCsv(`${m.table}.csv`, db.getAll(m.table));
      notify(t('exportCsv'), `${m.table}.csv · ${n} ${t('rows')}`, 'ok');
    } }, '📤 ' + t('exportCsv'));
    return el('div', { class: 'stat accent-brand' }, [
      el('div', { class: 'stat-ico' }, m.ico),
      el('div', { class: 'stat-label' }, t(m.labelKey)),
      el('div', { class: 'stat-value' }, n.toLocaleString('en-US')),
      el('div', { class: 'btn-row' }, btn),
    ]);
  }));
  view.appendChild(cards);

  // Summary by status (asset condition).
  const assets = db.getAll('assets');
  const byStatus = {};
  for (const a of assets) byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  view.appendChild(el('div', { class: 'panel' }, [
    el('h3', {}, lang === 'th' ? 'สรุปสถานะทรัพย์สิน' : 'Asset condition summary'),
    el('div', { class: 'table-wrap' }, el('table', { class: 'data' }, [
      el('thead', {}, el('tr', {}, [el('th', {}, t('status')), el('th', {}, t('total'))])),
      el('tbody', {}, Object.entries(byStatus).map(([s, n]) =>
        el('tr', {}, [el('td', {}, s), el('td', {}, n.toLocaleString('en-US'))]))),
    ])),
  ]));

  // Reset demo data control.
  const resetBtn = el('button', { class: 'btn ghost', onclick: () => {
    if (confirm(t('resetConfirm'))) window.__resetDemo();
  } }, '♻️ ' + t('resetDemo'));
  view.appendChild(el('div', { class: 'panel' }, [
    el('h3', {}, t('resetDemo')),
    el('div', { class: 'btn-row' }, resetBtn),
  ]));
}
