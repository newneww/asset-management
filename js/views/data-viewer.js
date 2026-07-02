// data-viewer.js — Central DB viewer (mock Google Sheets): tabbed table browser.
import db from '../db.js';
import { t, getLang } from '../i18n.js';
import { el, clear, statusPill, fmtDateTime, exportCsv } from '../utils.js';

const SHEETS = [
  { table: 'shops', labelKey: 'sheetShops' },
  { table: 'assets', labelKey: 'sheetAssets' },
  { table: 'logs', labelKey: 'sheetLogs' },
  { table: 'audits', labelKey: 'sheetAudits' },
];

const STATUS_FIELDS = new Set(['status', 'approvalStatus', 'countedStatus']);
const PAGE = 100;

export function renderData(view) {
  clear(view);
  const lang = getLang();
  view.appendChild(el('h1', { class: 'page-title' }, t('dataTitle')));
  view.appendChild(el('p', { class: 'page-sub' },
    lang === 'th' ? 'ตารางกลาง 4 ตาราง เหมือน Google Sheets — ค้นหา/กรอง และส่งออก CSV ได้'
      : 'Four central tables like Google Sheets — search/filter and export CSV.'));

  let activeTable = 'shops';

  const tabs = el('div', { class: 'segmented' }, SHEETS.map(s =>
    el('button', {
      class: s.table === activeTable ? 'active' : '', dataset: { table: s.table },
      onclick: () => { activeTable = s.table; sync(); },
    }, t(s.labelKey))));

  const searchInput = el('input', { type: 'text', placeholder: t('search') });
  searchInput.addEventListener('input', () => renderTable());
  const exportBtn = el('button', { class: 'btn sm', onclick: () => exportCsv(`${activeTable}.csv`, db.getAll(activeTable)) }, '📤 CSV');
  const countNote = el('span', { class: 'count-note' });

  const tableHost = el('div', {});
  view.appendChild(tabs);
  view.appendChild(el('div', { class: 'panel' }, [
    el('div', { class: 'toolbar' }, [searchInput, el('span', { class: 'spacer' }), countNote, exportBtn]),
    tableHost,
  ]));

  function sync() {
    tabs.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.table === activeTable));
    searchInput.value = '';
    renderTable();
  }

  function renderTable() {
    clear(tableHost);
    const q = searchInput.value.trim().toLowerCase();
    let rows = db.getAll(activeTable);
    if (q) rows = rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q)));
    const shown = rows.slice(0, PAGE);
    countNote.textContent = `${rows.length.toLocaleString('en-US')} ${t('rows')}` +
      (rows.length > PAGE ? ` (${lang === 'th' ? 'แสดง' : 'showing'} ${PAGE})` : '');

    if (!shown.length) { tableHost.appendChild(el('div', { class: 'empty' }, '—')); return; }
    const cols = Object.keys(shown[0]);
    tableHost.appendChild(el('div', { class: 'table-wrap' }, el('table', { class: 'data' }, [
      el('thead', {}, el('tr', {}, cols.map(c => el('th', {}, c)))),
      el('tbody', {}, shown.map(r => el('tr', {}, cols.map(c => {
        const v = r[c];
        if (STATUS_FIELDS.has(c) && v) return el('td', {}, statusPill(String(v)));
        if (c === 'ts') return el('td', {}, fmtDateTime(v));
        return el('td', {}, v == null ? '—' : String(v));
      })))),
    ])));
  }
  sync();
}
