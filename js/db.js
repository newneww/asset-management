// db.js — Mock "Google Sheets" central database backed by localStorage.
// Four tables (sheets): shops, assets, logs, audits.
// Each table is an array of plain row objects. All persistence goes through here.

const STORAGE_KEY = 'assetmgmt.db.v1';

// The four "sheets" of our mock spreadsheet.
export const TABLES = ['shops', 'assets', 'logs', 'audits'];

let _cache = null;

function _load() {
  if (_cache) return _cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _cache = JSON.parse(raw);
      // Make sure every expected table exists even if schema grew.
      for (const t of TABLES) if (!Array.isArray(_cache[t])) _cache[t] = [];
      return _cache;
    }
  } catch (e) {
    console.warn('DB load failed, starting empty:', e);
  }
  _cache = { shops: [], assets: [], logs: [], audits: [] };
  return _cache;
}

function _save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_cache));
}

// Replace the whole database (used by the seeder).
export function replaceAll(data) {
  _cache = { shops: [], assets: [], logs: [], audits: [] };
  for (const t of TABLES) if (Array.isArray(data[t])) _cache[t] = data[t];
  _save();
}

export function isSeeded() {
  const db = _load();
  return db.shops.length > 0 && db.assets.length > 0;
}

// Return a shallow copy of a whole table.
export function getAll(table) {
  return _load()[table].slice();
}

export function count(table) {
  return _load()[table].length;
}

// Filter helper: query('assets', a => a.status === 'ปกติ')
export function query(table, predicate) {
  return _load()[table].filter(predicate);
}

export function find(table, predicate) {
  return _load()[table].find(predicate);
}

export function getById(table, idField, id) {
  return _load()[table].find(r => r[idField] === id);
}

// Insert a row, persist, return it.
export function insert(table, row) {
  _load()[table].push(row);
  _save();
  return row;
}

// Update the first row matching predicate with patch; returns updated row or null.
export function update(table, predicate, patch) {
  const rows = _load()[table];
  const row = rows.find(predicate);
  if (!row) return null;
  Object.assign(row, patch);
  _save();
  return row;
}

// Generate a short unique id with a prefix, e.g. genId('LOG') -> "LOG-lm3k9x2a".
export function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Wipe everything (used by "reset demo data" in the UI).
export function reset() {
  localStorage.removeItem(STORAGE_KEY);
  _cache = null;
}

export default {
  TABLES, replaceAll, isSeeded, getAll, count, query, find,
  getById, insert, update, genId, reset,
};
