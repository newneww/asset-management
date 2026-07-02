// app.js — Bootstrap: seed data, build header/nav, register routes, wire notifications.
import router from './router.js';
import i18n, { t } from './i18n.js';
import { seedIfEmpty, reseed } from './seed.js';
import { el, clear, notify, getNotifications, updateNotifBadge, fmtDateTime } from './utils.js';
import db from './db.js';

// Views
import { renderLoan } from './views/tech-loan.js';
import { renderUpdate } from './views/tech-update.js';
import { renderAudit } from './views/tech-audit.js';
import { renderHistory } from './views/tech-history.js';
import { renderDashboard } from './views/admin-dashboard.js';
import { renderApprove } from './views/admin-approve.js';
import { renderReport } from './views/admin-report.js';
import { renderData } from './views/data-viewer.js';

// Navigation model: 3 sections, each with items {path, key, ico}.
const SECTIONS = {
  tech: {
    labelKey: 'roleTech',
    items: [
      { path: '/tech/loan', key: 'navLoan', ico: '📝' },
      { path: '/tech/update', key: 'navUpdate', ico: '📍' },
      { path: '/tech/audit', key: 'navAudit', ico: '✅' },
      { path: '/tech/history', key: 'navHistory', ico: '🕘' },
    ],
  },
  admin: {
    labelKey: 'roleAdmin',
    items: [
      { path: '/admin/dashboard', key: 'navDashboard', ico: '📊' },
      { path: '/admin/approve', key: 'navApprove', ico: '🖊️' },
      { path: '/admin/report', key: 'navReport', ico: '📤' },
    ],
  },
  data: {
    labelKey: 'roleData',
    items: [{ path: '/data', key: 'roleData', ico: '🗄️' }],
  },
};

function sectionOf(path) {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/data')) return 'data';
  return 'tech';
}

function renderRoleSwitch(activeSection) {
  const host = document.getElementById('role-switch');
  clear(host);
  for (const [key, sec] of Object.entries(SECTIONS)) {
    const btn = el('button', {
      class: key === activeSection ? 'active' : '',
      onclick: () => router.navigate(sec.items[0].path),
    }, t(sec.labelKey));
    host.appendChild(btn);
  }
}

function renderSidenav(activeSection, activePath) {
  const host = document.getElementById('sidenav');
  clear(host);
  const sec = SECTIONS[activeSection];
  host.appendChild(el('div', { class: 'nav-group-title' }, t(sec.labelKey)));
  for (const item of sec.items) {
    host.appendChild(el('a', {
      href: '#' + item.path,
      class: activePath === item.path ? 'active' : '',
    }, [el('span', { class: 'nav-ico' }, item.ico), t(item.key)]));
  }
}

function renderNotifPanel() {
  const list = document.getElementById('notif-list');
  clear(list);
  const items = getNotifications();
  if (!items.length) {
    list.appendChild(el('div', { class: 'notif-empty' }, '—'));
    return;
  }
  for (const n of items) {
    list.appendChild(el('div', { class: 'notif-item' }, [
      el('div', { class: 'ni-title' }, n.title),
      el('div', { class: 'ni-body' }, n.body),
      el('div', { class: 'ni-ts' }, fmtDateTime(n.ts)),
    ]));
  }
}

function seedNotifications() {
  // Simulate Apps Script alerts derived from data.
  const pending = db.query('logs', l => l.approvalStatus === 'รออนุมัติ').length;
  if (pending) {
    notify(t('cardPending') + ` (${pending})`,
      i18n.getLang() === 'th' ? `มีรายการย้าย/Audit รอแอดมินอนุมัติ ${pending} รายการ`
        : `${pending} move/audit items awaiting approval`, 'pending');
  }
  const deposit = db.query('assets', a => a.shopId).reduce((s, a) => s + (a.deposit || 0), 0);
  notify(t('depositReminder'),
    (i18n.getLang() === 'th' ? 'มัดจำค้างรับรวมประมาณ ' : 'Outstanding deposits total approx. ')
      + deposit.toLocaleString('en-US') + ' ฿', 'info');
}

function wireHeader() {
  document.getElementById('lang-btn').addEventListener('click', () => {
    i18n.toggleLang();
    router.navigate(router.current()); // re-render current view in new language
    boot(false);
  });
  const panel = document.getElementById('notif-panel');
  document.getElementById('notif-btn').addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderNotifPanel();
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target.id !== 'notif-btn') panel.hidden = true;
  });
}

function registerRoutes() {
  router.register('/tech/loan', renderLoan);
  router.register('/tech/update', renderUpdate);
  router.register('/tech/audit', renderAudit);
  router.register('/tech/history', renderHistory);
  router.register('/admin/dashboard', renderDashboard);
  router.register('/admin/approve', renderApprove);
  router.register('/admin/report', renderReport);
  router.register('/data', renderData);
  router.setNotFound(renderLoan); // default landing
}

// Expose a reseed helper used by the data viewer / report reset buttons.
export function resetDemoData() {
  reseed();
  router.navigate(router.current());
}
window.__resetDemo = resetDemoData;

// (Re)build chrome around the current route.
function boot(navigateHome) {
  i18n.applyStatic();
  const path = router.current();
  const section = sectionOf(path);
  renderRoleSwitch(section);
  renderSidenav(section, path);
  updateNotifBadge();
}

function init() {
  seedIfEmpty();
  wireHeader();
  registerRoutes();
  router.setOnNavigate(() => boot(false));
  if (!location.hash) location.hash = '#/tech/loan';
  router.start();
  i18n.applyStatic();
  seedNotifications();
}

init();
