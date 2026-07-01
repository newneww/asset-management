// admin-approve.js — อนุมัติการย้าย/Audit: queue of pending items with Approve/Reject.
import db from '../db.js';
import { t, getLang } from '../i18n.js';
import { el, clear, notify, fmtDateTime } from '../utils.js';

export function renderApprove(view) {
  clear(view);
  const lang = getLang();
  view.appendChild(el('h1', { class: 'page-title' }, t('approveTitle')));
  view.appendChild(el('p', { class: 'page-sub' },
    lang === 'th' ? 'ตรวจสอบและอนุมัติการย้ายอุปกรณ์ที่ช่างส่งเข้ามา'
      : 'Review and approve asset moves submitted by technicians.'));

  const wrap = el('div', {});
  view.appendChild(wrap);

  function render() {
    clear(wrap);
    const pending = db.query('logs', l => l.approvalStatus === 'รออนุมัติ')
      .sort((a, b) => b.ts.localeCompare(a.ts));
    if (!pending.length) { wrap.appendChild(el('div', { class: 'empty' }, t('noPending'))); return; }

    const rows = pending.map(l => {
      const asset = db.getById('assets', 'assetId', l.assetId);
      const approveBtn = el('button', { class: 'btn ok sm' }, '✔ ' + t('approve'));
      const rejectBtn = el('button', { class: 'btn bad sm' }, '✖ ' + t('reject'));
      approveBtn.addEventListener('click', () => {
        db.update('logs', x => x.logId === l.logId, { approvalStatus: 'อนุมัติแล้ว' });
        if (asset) db.update('assets', a => a.assetId === l.assetId, { shopId: l.shopId }); // apply the move
        notify(t('itemApproved'), `${l.assetId} → ${l.shopId}`, 'ok');
        render();
      });
      rejectBtn.addEventListener('click', () => {
        db.update('logs', x => x.logId === l.logId, { approvalStatus: 'ไม่อนุมัติ' });
        notify(t('itemRejected'), `${l.assetId}`, 'bad');
        render();
      });
      return el('tr', {}, [
        el('td', {}, fmtDateTime(l.ts)),
        el('td', {}, l.type),
        el('td', {}, l.assetId),
        el('td', {}, `${l.fromShopId || '-'} → ${l.shopId}`),
        el('td', {}, l.technician),
        el('td', {}, el('div', { class: 'btn-row' }, [approveBtn, rejectBtn])),
      ]);
    });

    wrap.appendChild(el('div', { class: 'panel' }, [
      el('p', { class: 'count-note' }, `${pending.length} ${t('rows')}`),
      el('div', { class: 'table-wrap' }, el('table', { class: 'data' }, [
        el('thead', {}, el('tr', {}, [el('th', {}, t('date')), el('th', {}, t('action')),
          el('th', {}, t('asset')), el('th', {}, t('shop')), el('th', {}, t('technician')), el('th', {}, '')])),
        el('tbody', {}, rows),
      ])),
    ]));
  }
  render();
}
