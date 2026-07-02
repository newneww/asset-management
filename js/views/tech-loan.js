// tech-loan.js — เบิกอุปกรณ์ & ทำสัญญา: form + signature + PDF contract.
import db from '../db.js';
import { t, getLang } from '../i18n.js';
import { el, clear, notify, makeSignaturePad, printContract, fmtBaht } from '../utils.js';

export function renderLoan(view) {
  clear(view);
  const lang = getLang();
  view.appendChild(el('h1', { class: 'page-title' }, t('loanTitle')));
  view.appendChild(el('p', { class: 'page-sub' },
    lang === 'th' ? 'คีย์ข้อมูลการเบิก เลือกทรัพย์สินในคลัง เซ็นชื่อ แล้วออกสัญญายืมเป็น PDF'
      : 'Fill loan details, pick in-stock assets, sign, then issue a PDF loan contract.'));

  const shops = db.query('shops', s => s.status === 'เปิดใช้งาน')
    .sort((a, b) => a.shopId.localeCompare(b.shopId));
  const stock = db.query('assets', a => !a.shopId && a.status === 'ปกติ');

  // --- Shop + technician ---
  const shopSel = el('select', {}, [el('option', { value: '' }, t('select')),
    ...shops.map(s => el('option', { value: s.shopId }, `${s.shopId} — ${s.name}`))]);
  const techInput = el('input', { type: 'text', value: 'ช่างเอ (A. Somsak)' });

  const form = el('div', { class: 'panel' }, [
    el('div', { class: 'row' }, [
      el('div', { class: 'field' }, [el('label', {}, t('selectShop')), shopSel]),
      el('div', { class: 'field' }, [el('label', {}, t('technician')), techInput]),
    ]),
  ]);

  // --- Asset picker ---
  const picker = el('div', { class: 'pick-list' });
  if (!stock.length) {
    picker.appendChild(el('div', { class: 'empty' }, t('noStock')));
  } else {
    for (const a of stock.slice(0, 200)) {
      const cb = el('input', { type: 'checkbox', value: a.assetId });
      picker.appendChild(el('label', { class: 'pick-item' }, [
        cb,
        el('div', { class: 'pi-main' }, [
          el('div', {}, `${a.type} (${a.typeEn})`),
          el('div', { class: 'pi-sub' }, `${a.assetId} · ${a.serial} · ${t('deposit')} ${fmtBaht(a.deposit)} ฿`),
        ]),
      ]));
    }
  }
  const pickPanel = el('div', { class: 'panel' }, [
    el('h3', {}, t('selectAssets')),
    picker,
    el('div', { class: 'hint', id: 'pick-summary' }, '—'),
  ]);
  function selectedIds() {
    return [...picker.querySelectorAll('input:checked')].map(c => c.value);
  }
  picker.addEventListener('change', () => {
    const ids = selectedIds();
    const sum = db.query('assets', a => ids.includes(a.assetId)).reduce((s, a) => s + a.deposit, 0);
    pickPanel.querySelector('#pick-summary').textContent =
      `${ids.length} ${t('assets')} · ${t('deposit')} ${fmtBaht(sum)} ฿`;
  });

  // --- Signature ---
  const canvas = el('canvas', { class: 'signature' });
  const sigPanel = el('div', { class: 'panel' }, [
    el('h3', {}, t('signature')),
    el('div', { class: 'hint' }, t('signHint')),
    el('div', { class: 'sig-wrap' }, canvas),
  ]);
  const pad = makeSignaturePad(canvas);

  // --- Actions ---
  const clearBtn = el('button', { class: 'btn ghost', onclick: () => pad.clear() }, '🧹 ' + t('clear'));
  const submitBtn = el('button', { class: 'btn' }, '📄 ' + t('createContract'));
  sigPanel.appendChild(el('div', { class: 'btn-row' }, [clearBtn, submitBtn]));

  submitBtn.addEventListener('click', () => {
    const shopId = shopSel.value;
    const ids = selectedIds();
    if (!shopId || !ids.length) { notify(t('needShopAsset'), '', 'warn'); return; }
    if (pad.isEmpty()) { notify(t('needSignature'), '', 'warn'); return; }

    const shop = db.getById('shops', 'shopId', shopId);
    const technician = techInput.value.trim() || 'ช่าง';
    const sig = pad.toDataURL();
    const contractNo = db.genId('CT').toUpperCase();
    const now = new Date().toISOString();
    const chosen = db.query('assets', a => ids.includes(a.assetId));

    // Update asset ownership + write a loan log per asset.
    for (const a of chosen) {
      db.update('assets', x => x.assetId === a.assetId, { shopId });
      db.insert('logs', {
        logId: db.genId('LOG').toUpperCase(),
        ts: now, type: 'เบิก', assetId: a.assetId, shopId,
        technician, note: `สัญญา ${contractNo}`, approvalStatus: 'อนุมัติแล้ว', deposit: a.deposit,
        contractNo,
      });
    }
    notify(t('contractCreated'), `${contractNo} · ${chosen.length} ${t('assets')}`, 'ok');
    printContract({ contractNo, shop, technician, assets: chosen, signatureDataUrl: sig, date: now });
    renderLoan(view); // refresh stock list
  });

  view.appendChild(form);
  view.appendChild(pickPanel);
  view.appendChild(sigPanel);
}
