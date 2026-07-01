// tech-audit.js — Audit ประจำปี: pick shop, count assets, mark status.
import db from '../db.js';
import { t, getLang } from '../i18n.js';
import { el, clear, notify } from '../utils.js';

const STATUSES = ['ปกติ', 'ชำรุด', 'สูญหาย'];

export function renderAudit(view) {
  clear(view);
  const lang = getLang();
  view.appendChild(el('h1', { class: 'page-title' }, t('auditTitle')));
  view.appendChild(el('p', { class: 'page-sub' },
    lang === 'th' ? 'เลือกร้าน นับทรัพย์สินจริง และระบุสถานะแต่ละชิ้น'
      : 'Pick a shop, count physical assets, and set each status.'));

  const shops = db.query('shops', s => s.status === 'เปิดใช้งาน').sort((a, b) => a.shopId.localeCompare(b.shopId));
  const sel = el('select', { onchange: () => load(sel.value) },
    [el('option', { value: '' }, t('select')), ...shops.map(s => el('option', { value: s.shopId }, `${s.shopId} — ${s.name}`))]);

  const body = el('div', {});
  view.appendChild(el('div', { class: 'panel' }, [
    el('h3', {}, t('auditPickShop')),
    el('div', { class: 'field' }, sel),
  ]));
  view.appendChild(body);

  const year = new Date().getFullYear();

  function load(shopId) {
    clear(body);
    if (!shopId) return;
    const list = db.query('assets', a => a.shopId === shopId);
    if (!list.length) { body.appendChild(el('div', { class: 'panel' }, el('div', { class: 'empty' }, t('noStock')))); return; }

    const rows = list.map(a => {
      const statusSel = el('select', {}, STATUSES.map(s => el('option', { value: s, selected: s === a.status }, s)));
      return { assetId: a.assetId, statusSel, node: el('tr', {}, [
        el('td', {}, a.assetId), el('td', {}, `${a.type} (${a.typeEn})`),
        el('td', {}, a.serial), el('td', {}, statusSel),
      ]) };
    });

    const saveBtn = el('button', { class: 'btn' }, '✅ ' + t('saveAudit'));
    saveBtn.addEventListener('click', () => {
      const now = new Date().toISOString();
      for (const r of rows) {
        const counted = r.statusSel.value;
        db.insert('audits', {
          auditId: db.genId('AUD').toUpperCase(), year, assetId: r.assetId, shopId,
          countedStatus: counted, auditor: 'ช่างเอ (A. Somsak)', ts: now,
        });
        // Sync asset master + write an audit log entry.
        db.update('assets', x => x.assetId === r.assetId, { status: counted });
        db.insert('logs', {
          logId: db.genId('LOG').toUpperCase(), ts: now, type: 'audit', assetId: r.assetId, shopId,
          technician: 'ช่างเอ (A. Somsak)', note: `Audit ${year}: ${counted}`, approvalStatus: 'อนุมัติแล้ว',
        });
      }
      notify(t('auditSaved'), `${shopId} · ${rows.length} ${t('assets')} · ${year}`, 'ok');
      load(shopId);
    });

    body.appendChild(el('div', { class: 'panel' }, [
      el('h3', {}, `${t('assets')}: ${list.length} (${year})`),
      el('div', { class: 'table-wrap' }, el('table', { class: 'data' }, [
        el('thead', {}, el('tr', {}, [el('th', {}, t('asset')), el('th', {}, t('type')),
          el('th', {}, t('serial')), el('th', {}, t('countedStatus'))])),
        el('tbody', {}, rows.map(r => r.node)),
      ])),
      el('div', { class: 'btn-row' }, saveBtn),
    ]));
  }
}
