// admin-dashboard.js — ภาพรวมสถานะ: live summary cards + simple bar charts.
import db from '../db.js';
import { t, getLang } from '../i18n.js';
import { el, clear, fmtBaht } from '../utils.js';

function statCard(labelKey, value, ico, accent) {
  return el('div', { class: `stat accent-${accent}` }, [
    el('div', { class: 'stat-ico' }, ico),
    el('div', { class: 'stat-label' }, t(labelKey)),
    el('div', { class: 'stat-value' }, value),
  ]);
}

function barChart(titleKey, entries) {
  const max = Math.max(1, ...entries.map(e => e.value));
  return el('div', { class: 'panel' }, [
    el('h3', {}, t(titleKey)),
    el('div', { class: 'bars' }, entries.map(e => el('div', { class: 'bar-row' }, [
      el('div', {}, e.label),
      el('div', { class: 'bar-track' }, el('div', { class: 'bar-fill', style: `width:${(e.value / max) * 100}%` })),
      el('div', { style: 'text-align:right' }, e.value.toLocaleString('en-US')),
    ]))),
  ]);
}

export function renderDashboard(view) {
  clear(view);
  const assets = db.getAll('assets');
  const shops = db.getAll('shops');
  const logs = db.getAll('logs');

  const total = assets.length;
  const active = assets.filter(a => a.shopId && a.status === 'ปกติ').length;
  const damaged = assets.filter(a => a.status !== 'ปกติ').length;
  const pending = logs.filter(l => l.approvalStatus === 'รออนุมัติ').length;
  const activeShops = shops.filter(s => s.status === 'เปิดใช้งาน').length;
  const depositTotal = assets.filter(a => a.shopId).reduce((s, a) => s + (a.deposit || 0), 0);

  view.appendChild(el('h1', { class: 'page-title' }, t('navDashboard')));
  view.appendChild(el('p', { class: 'page-sub' }, '🟢 ' + t('realtime')));

  view.appendChild(el('div', { class: 'cards' }, [
    statCard('cardActive', active.toLocaleString('en-US'), '📦', 'ok'),
    statCard('cardTotal', total.toLocaleString('en-US'), '🗂️', 'brand'),
    statCard('cardDamaged', damaged.toLocaleString('en-US'), '⚠️', 'bad'),
    statCard('cardPending', pending.toLocaleString('en-US'), '🖊️', 'pending'),
    statCard('cardShops', activeShops.toLocaleString('en-US'), '🏪', 'brand'),
    statCard('cardDeposit', fmtBaht(depositTotal), '💰', 'ok'),
  ]));

  // By area (active/installed assets).
  const areaMap = {};
  for (const a of assets) {
    if (!a.shopId) continue;
    const shop = shops.find(s => s.shopId === a.shopId);
    if (!shop) continue;
    areaMap[shop.area] = (areaMap[shop.area] || 0) + 1;
  }
  const areaEntries = Object.entries(areaMap).map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // By type.
  const typeMap = {};
  for (const a of assets) typeMap[a.type] = (typeMap[a.type] || 0) + 1;
  const typeEntries = Object.entries(typeMap).map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const grid = el('div', { class: 'row' }, [
    barChart('byArea', areaEntries),
    barChart('byType', typeEntries),
  ]);
  view.appendChild(grid);
}
