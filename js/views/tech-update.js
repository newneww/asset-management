// tech-update.js — อัปเดตหน้างาน: ร้านใหม่ / ย้าย / คืน / เช็กความครบ.
import db from '../db.js';
import { t, getLang } from '../i18n.js';
import { el, clear, notify, statusPill, fmtBaht } from '../utils.js';

const ACTIONS = [
  { id: 'new', key: 'actNewShop', ico: '🏪' },
  { id: 'move', key: 'actMove', ico: '🔀' },
  { id: 'return', key: 'actReturn', ico: '↩️' },
  { id: 'check', key: 'actCheck', ico: '🔎' },
];

export function renderUpdate(view) {
  clear(view);
  const lang = getLang();
  view.appendChild(el('h1', { class: 'page-title' }, t('updateTitle')));
  view.appendChild(el('p', { class: 'page-sub' },
    lang === 'th' ? 'บันทึกการเปลี่ยนแปลงหน้างาน ระบบจะบันทึกลงตารางประวัติทันที'
      : 'Record on-site changes; each is logged to the history table.'));

  let active = 'new';
  const seg = el('div', { class: 'segmented' },
    ACTIONS.map(a => el('button', {
      class: a.id === active ? 'active' : '', dataset: { id: a.id },
      onclick: () => { active = a.id; sync(); },
    }, [el('span', { class: 'seg-ico' }, a.ico), t(a.key)])));

  const body = el('div', {});
  view.appendChild(seg);
  view.appendChild(body);

  function sync() {
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.id === active));
    clear(body);
    if (active === 'new') body.appendChild(formNewShop());
    else if (active === 'move') body.appendChild(formMove());
    else if (active === 'return') body.appendChild(formReturn());
    else body.appendChild(formCheck());
  }
  sync();
}

const AREAS = ['กรุงเทพฯ', 'ปริมณฑล', 'ภาคกลาง', 'ภาคเหนือ', 'ภาคอีสาน', 'ภาคใต้'];

function formNewShop() {
  const name = el('input', { type: 'text', placeholder: t('shopName') });
  const addr = el('input', { type: 'text', placeholder: t('address') });
  const area = el('select', {}, AREAS.map(a => el('option', { value: a }, a)));
  const btn = el('button', { class: 'btn' }, '💾 ' + t('save'));
  btn.addEventListener('click', () => {
    if (!name.value.trim()) { notify(t('shopName'), '', 'warn'); return; }
    const seq = db.count('shops') + 1;
    const shopId = 'SH' + String(seq).padStart(4, '0');
    db.insert('shops', { shopId, name: name.value.trim(), address: addr.value.trim() || '-', area: area.value, status: 'เปิดใช้งาน' });
    db.insert('logs', {
      logId: db.genId('LOG').toUpperCase(), ts: new Date().toISOString(), type: 'ร้านใหม่',
      assetId: '-', shopId, technician: 'ช่างเอ (A. Somsak)', note: `เปิดร้านใหม่ ${name.value.trim()}`,
      approvalStatus: 'อนุมัติแล้ว',
    });
    notify(t('updateSaved'), `${shopId} — ${name.value.trim()}`, 'ok');
    name.value = ''; addr.value = '';
  });
  return el('div', { class: 'panel' }, [
    el('h3', {}, t('actNewShop')),
    el('div', { class: 'field' }, [el('label', {}, t('shopName')), name]),
    el('div', { class: 'field' }, [el('label', {}, t('address')), addr]),
    el('div', { class: 'field' }, [el('label', {}, t('area')), area]),
    el('div', { class: 'btn-row' }, btn),
  ]);
}

// Shared asset lookup by shop.
function shopSelect(onChange) {
  const shops = db.query('shops', s => s.status === 'เปิดใช้งาน').sort((a, b) => a.shopId.localeCompare(b.shopId));
  const sel = el('select', { onchange: () => onChange(sel.value) },
    [el('option', { value: '' }, t('select')), ...shops.map(s => el('option', { value: s.shopId }, `${s.shopId} — ${s.name}`))]);
  return sel;
}

function formMove() {
  const assetBox = el('div', { class: 'pick-list' }, el('div', { class: 'empty' }, t('selectShop')));
  const fromSel = shopSelect(loadAssets);
  const destShops = db.query('shops', s => s.status === 'เปิดใช้งาน').sort((a, b) => a.shopId.localeCompare(b.shopId));
  const destSel = el('select', {}, [el('option', { value: '' }, t('select')), ...destShops.map(s => el('option', { value: s.shopId }, `${s.shopId} — ${s.name}`))]);

  function loadAssets(shopId) {
    clear(assetBox);
    const list = db.query('assets', a => a.shopId === shopId);
    if (!list.length) { assetBox.appendChild(el('div', { class: 'empty' }, t('noStock'))); return; }
    for (const a of list) {
      assetBox.appendChild(el('label', { class: 'pick-item' }, [
        el('input', { type: 'checkbox', value: a.assetId }),
        el('div', { class: 'pi-main' }, [el('div', {}, `${a.type} (${a.typeEn})`),
          el('div', { class: 'pi-sub' }, `${a.assetId} · ${a.serial}`)]),
      ]));
    }
  }

  const btn = el('button', { class: 'btn' }, '🔀 ' + t('actMove'));
  btn.addEventListener('click', () => {
    const ids = [...assetBox.querySelectorAll('input:checked')].map(c => c.value);
    if (!fromSel.value || !destSel.value || !ids.length) { notify(t('needShopAsset'), '', 'warn'); return; }
    if (fromSel.value === destSel.value) { notify(t('destShop'), '', 'warn'); return; }
    const now = new Date().toISOString();
    for (const id of ids) {
      db.insert('logs', {
        logId: db.genId('LOG').toUpperCase(), ts: now, type: 'ย้าย', assetId: id,
        shopId: destSel.value, fromShopId: fromSel.value, technician: 'ช่างเอ (A. Somsak)',
        note: `ขอย้าย ${id} จาก ${fromSel.value} ไป ${destSel.value}`, approvalStatus: 'รออนุมัติ',
      });
    }
    notify(t('updateSaved'), `${ids.length} ${t('assets')} · ${t('pending')}`, 'pending');
    loadAssets(fromSel.value);
  });

  return el('div', { class: 'panel' }, [
    el('h3', {}, t('actMove')),
    el('div', { class: 'row' }, [
      el('div', { class: 'field' }, [el('label', {}, t('shop')), fromSel]),
      el('div', { class: 'field' }, [el('label', {}, t('destShop')), destSel]),
    ]),
    el('div', { class: 'field' }, [el('label', {}, t('selectAssets')), assetBox]),
    el('div', { class: 'hint' }, '⚠️ ' + t('moveNeedsApproval')),
    el('div', { class: 'btn-row' }, btn),
  ]);
}

function formReturn() {
  const assetBox = el('div', { class: 'pick-list' }, el('div', { class: 'empty' }, t('selectShop')));
  const sel = shopSelect(load);
  function load(shopId) {
    clear(assetBox);
    const list = db.query('assets', a => a.shopId === shopId);
    if (!list.length) { assetBox.appendChild(el('div', { class: 'empty' }, t('noStock'))); return; }
    for (const a of list) {
      assetBox.appendChild(el('label', { class: 'pick-item' }, [
        el('input', { type: 'checkbox', value: a.assetId }),
        el('div', { class: 'pi-main' }, [el('div', {}, `${a.type} (${a.typeEn})`),
          el('div', { class: 'pi-sub' }, `${a.assetId} · ${a.serial}`)]),
      ]));
    }
  }
  const btn = el('button', { class: 'btn' }, '↩️ ' + t('actReturn'));
  btn.addEventListener('click', () => {
    const ids = [...assetBox.querySelectorAll('input:checked')].map(c => c.value);
    if (!sel.value || !ids.length) { notify(t('needShopAsset'), '', 'warn'); return; }
    const now = new Date().toISOString();
    for (const id of ids) {
      db.update('assets', a => a.assetId === id, { shopId: null }); // back to warehouse
      db.insert('logs', {
        logId: db.genId('LOG').toUpperCase(), ts: now, type: 'คืน', assetId: id, shopId: sel.value,
        technician: 'ช่างเอ (A. Somsak)', note: `คืนอุปกรณ์ ${id} จาก ${sel.value}`, approvalStatus: 'อนุมัติแล้ว',
      });
    }
    notify(t('updateSaved'), `${t('actReturn')} · ${ids.length} ${t('assets')}`, 'ok');
    load(sel.value);
  });
  return el('div', { class: 'panel' }, [
    el('h3', {}, t('actReturn')),
    el('div', { class: 'field' }, [el('label', {}, t('shop')), sel]),
    el('div', { class: 'field' }, [el('label', {}, t('selectAssets')), assetBox]),
    el('div', { class: 'btn-row' }, btn),
  ]);
}

function formCheck() {
  const result = el('div', {});
  const sel = shopSelect(run);
  function run(shopId) {
    clear(result);
    if (!shopId) return;
    const list = db.query('assets', a => a.shopId === shopId);
    const damaged = list.filter(a => a.status !== 'ปกติ');
    const table = el('table', { class: 'data' }, [
      el('thead', {}, el('tr', {}, [el('th', {}, '#'), el('th', {}, t('asset')), el('th', {}, t('type')),
        el('th', {}, t('serial')), el('th', {}, t('status'))])),
      el('tbody', {}, list.map((a, i) => el('tr', {}, [
        el('td', {}, i + 1), el('td', {}, a.assetId), el('td', {}, `${a.type}`),
        el('td', {}, a.serial), el('td', {}, statusPill(a.status)),
      ]))),
    ]);
    result.appendChild(el('p', { class: 'count-note' },
      `${t('total')}: ${list.length} · ⚠️ ${damaged.length} ${t('cardDamaged')}`));
    result.appendChild(list.length ? el('div', { class: 'table-wrap' }, table) : el('div', { class: 'empty' }, t('noStock')));
  }
  return el('div', { class: 'panel' }, [
    el('h3', {}, t('actCheck')),
    el('div', { class: 'field' }, [el('label', {}, t('shop')), sel]),
    result,
  ]);
}
