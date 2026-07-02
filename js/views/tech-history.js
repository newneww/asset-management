// tech-history.js — ตรวจสอบประวัติร้าน: search shop, show loan/log timeline.
import db from '../db.js';
import { t, getLang } from '../i18n.js';
import { el, clear, fmtDateTime, statusPill } from '../utils.js';

const TYPE_ICO = { 'เบิก': '📝', 'ย้าย': '🔀', 'คืน': '↩️', 'audit': '✅', 'ร้านใหม่': '🏪' };

export function renderHistory(view) {
  clear(view);
  const lang = getLang();
  view.appendChild(el('h1', { class: 'page-title' }, t('historyTitle')));
  view.appendChild(el('p', { class: 'page-sub' },
    lang === 'th' ? 'ค้นหาร้านด้วยรหัสหรือชื่อ เพื่อดูสัญญายืมและกิจกรรมย้อนหลัง'
      : 'Search a shop by id or name to view its past loans and activity.'));

  const input = el('input', { type: 'text', placeholder: t('search') + ' (SH0001 / ชื่อร้าน)' });
  const results = el('div', {});
  input.addEventListener('input', () => run());

  view.appendChild(el('div', { class: 'panel' }, [
    el('div', { class: 'toolbar' }, [el('span', {}, '🔎'), input]),
    results,
  ]));

  function run() {
    clear(results);
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { results.appendChild(el('div', { class: 'empty' }, t('search') + ' …')); return; }
    const shops = db.query('shops', s =>
      s.shopId.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 8);
    if (!shops.length) { results.appendChild(el('div', { class: 'empty' }, '—')); return; }

    for (const shop of shops) {
      const logs = db.query('logs', l => l.shopId === shop.shopId).sort((a, b) => b.ts.localeCompare(a.ts));
      const current = db.query('assets', a => a.shopId === shop.shopId).length;
      const tl = el('ul', { class: 'timeline' }, logs.slice(0, 40).map(l => el('li', {}, [
        el('div', {}, [`${TYPE_ICO[l.type] || '•'} `, el('b', {}, l.type), '  ',
          l.assetId !== '-' ? el('span', {}, l.assetId) : '', '  ', statusPill(l.approvalStatus || '—')]),
        el('div', { class: 'tl-meta' }, `${fmtDateTime(l.ts)} · ${l.technician} · ${l.note || ''}`),
      ])));
      results.appendChild(el('div', { class: 'panel' }, [
        el('h3', {}, `${shop.shopId} — ${shop.name}`),
        el('p', { class: 'count-note' },
          `${shop.area} · ${shop.address} · ${t('assets')}: ${current} · ${logs.length} ${lang === 'th' ? 'รายการ' : 'events'}`),
        logs.length ? tl : el('div', { class: 'empty' }, '—'),
      ]));
    }
  }
  run();
}
