/**
 * ระบบจัดการทรัพย์สินอุปกรณ์ — Backend (Google Apps Script)
 * ------------------------------------------------------------------
 * Google Sheets = ฐานข้อมูลหลัก, Apps Script = API + ประมวลผล (PDF/คำนวณ)
 *
 * วิธีใช้:
 *   1) เปิด Google Sheet ที่จะใช้เป็นฐานข้อมูล > Extensions > Apps Script
 *   2) วางไฟล์นี้ (Code.gs) และ appsscript.json
 *   3) รันฟังก์ชัน setup() หนึ่งครั้ง เพื่อสร้างแท็บ + ผู้ใช้แอดมินเริ่มต้น
 *   4) Deploy > New deployment > Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *      แล้วนำ URL (.../exec) ไปใส่ VITE_API_URL ในเว็บแอป
 *
 * ทุกคำขอเป็น POST body JSON: { action, token, ...params }
 * ตอบกลับ JSON: { ok: true, data } หรือ { ok: false, error }
 */

// ===== ค่าคงที่ =====
var SHEETS = {
  USERS: 'Users',
  SHOPS: 'Shop Master',
  ASSETS: 'Asset Master',
  LOG: 'Log & History',
  AUDIT: 'Audit',
};

var HEADERS = {
  USERS: ['id', 'username', 'full_name', 'role', 'pw_hash', 'active', 'created_at'],
  SHOPS: ['id', 'code', 'name', 'address', 'subdistrict', 'district', 'province',
    'contact_name', 'phone', 'lat', 'lng', 'status', 'created_at', 'updated_at'],
  ASSETS: ['id', 'code', 'category', 'name', 'serial', 'unit', 'value', 'status',
    'shop_id', 'created_at', 'updated_at'],
  LOG: ['id', 'ts', 'type', 'loan_no', 'shop_id', 'shop_name', 'technician',
    'items_json', 'items_summary', 'qty_total', 'deposit', 'status',
    'from_shop_id', 'to_shop_id', 'signature', 'contract_url',
    'approved_by', 'approved_at', 'note'],
  AUDIT: ['id', 'ts', 'cycle', 'shop_id', 'shop_name', 'asset_code', 'asset_name',
    'expected_qty', 'counted_qty', 'condition', 'technician', 'note', 'status'],
};

var ROLES = ['technician', 'admin', 'executive'];
var TOKEN_TTL_HOURS = 12;

// ===== Web entry points =====
// doGet เสิร์ฟหน้าเว็บทั้งหมด (Index.html) — เปิด URL /exec แล้วได้ตัวเว็บเลย
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ระบบจัดการทรัพย์สินอุปกรณ์')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * จุดเรียกจากหน้าเว็บผ่าน google.script.run — ใช้ ROUTES เดียวกับ doPost
 * รับ payload เป็น JSON string, คืน { ok, data } หรือ { ok, error }
 */
function apiCall(action, payload) {
  try {
    var body = payload ? JSON.parse(payload) : {};
    body.action = action;
    var handler = ROUTES[action];
    if (!handler) return { ok: false, error: 'ไม่รู้จัก action: ' + action };
    var open = { ping: true, login: true };
    var user = null;
    if (!open[action]) user = requireAuth_(body.token);
    return { ok: true, data: handler(body, user) };
  } catch (err) {
    return { ok: false, error: (err && err.message) ? err.message : String(err) };
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
    var action = body.action;
    if (!action) return json_({ ok: false, error: 'ไม่ได้ระบุ action' });
    var handler = ROUTES[action];
    if (!handler) return json_({ ok: false, error: 'ไม่รู้จัก action: ' + action });

    // action ที่ไม่ต้องล็อกอิน
    var open = { ping: true, login: true };
    var user = null;
    if (!open[action]) {
      user = requireAuth_(body.token);
    }
    var data = handler(body, user);
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: (err && err.message) ? err.message : String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== Routing =====
var ROUTES = {
  ping: function () { return { pong: true, time: new Date().toISOString() }; },
  login: apiLogin,
  me: function (_b, user) { return user; },

  listShops: apiListShops,
  getShop: apiGetShop,
  upsertShop: apiUpsertShop,

  listAssets: apiListAssets,
  upsertAsset: apiUpsertAsset,

  listLoans: apiListLoans,
  getLoan: apiGetLoan,
  createLoan: apiCreateLoan,
  returnLoan: apiReturnLoan,

  createMovement: apiCreateMovement,
  listMovements: apiListMovements,
  approveMovement: apiApproveMovement,

  listAudit: apiListAudit,
  createAudit: apiCreateAudit,

  dashboard: apiDashboard,
  exportCsv: apiExportCsv,
};

// ===================================================================
// AUTH
// ===================================================================
function apiLogin(body) {
  var username = String(body.username || '').trim().toLowerCase();
  var password = String(body.password || '');
  if (!username || !password) throw new Error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
  var users = readObjects_(SHEETS.USERS);
  var u = users.filter(function (r) {
    return String(r.username).trim().toLowerCase() === username;
  })[0];
  if (!u || String(u.active).toLowerCase() === 'false' || u.active === false) {
    throw new Error('ไม่พบผู้ใช้ หรือบัญชีถูกปิดใช้งาน');
  }
  if (hashPassword_(password) !== u.pw_hash) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  var safe = { id: u.id, username: u.username, full_name: u.full_name, role: u.role };
  return { token: makeToken_(u.id, u.role), user: safe };
}

function requireAuth_(token) {
  var payload = verifyToken_(token);
  if (!payload) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  var u = readObjects_(SHEETS.USERS).filter(function (r) { return r.id === payload.uid; })[0];
  if (!u) throw new Error('ไม่พบบัญชีผู้ใช้');
  return { id: u.id, username: u.username, full_name: u.full_name, role: u.role };
}

function requireRole_(user, roles) {
  if (roles.indexOf(user.role) === -1) throw new Error('ไม่มีสิทธิ์ดำเนินการนี้');
}

function secret_() {
  var sp = PropertiesService.getScriptProperties();
  var s = sp.getProperty('SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); sp.setProperty('SECRET', s); }
  return s;
}

function hashPassword_(pw) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, pw + '::' + secret_(), Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

function makeToken_(uid, role) {
  var exp = Date.now() + TOKEN_TTL_HOURS * 3600 * 1000;
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({ uid: uid, role: role, exp: exp }));
  var sig = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(payload, secret_()));
  return payload + '.' + sig;
}

function verifyToken_(token) {
  if (!token || token.indexOf('.') === -1) return null;
  var parts = token.split('.');
  var expected = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(parts[0], secret_()));
  if (expected !== parts[1]) return null;
  var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

// ===================================================================
// SHOPS
// ===================================================================
function apiListShops(body) {
  var q = String(body.q || '').trim().toLowerCase();
  var status = body.status || '';
  var rows = readObjects_(SHEETS.SHOPS);
  var filtered = rows.filter(function (r) {
    if (status && r.status !== status) return false;
    if (!q) return true;
    return [r.code, r.name, r.province, r.district, r.phone].join(' ').toLowerCase().indexOf(q) !== -1;
  });
  return paginate_(filtered, body);
}

function apiGetShop(body) {
  var id = body.id;
  var shop = findById_(SHEETS.SHOPS, id);
  if (!shop) throw new Error('ไม่พบร้านค้า');
  var assets = readObjects_(SHEETS.ASSETS).filter(function (a) { return a.shop_id === id; });
  var logs = readObjects_(SHEETS.LOG).filter(function (l) {
    return l.shop_id === id || l.from_shop_id === id || l.to_shop_id === id;
  }).sort(byTsDesc_).slice(0, 50);
  return { shop: shop, assets: assets, logs: logs };
}

function apiUpsertShop(body, user) {
  requireRole_(user, ['admin', 'technician']);
  var s = body.shop || {};
  var now = new Date().toISOString();
  if (s.id) {
    s.updated_at = now;
    updateById_(SHEETS.SHOPS, s.id, s);
    return findById_(SHEETS.SHOPS, s.id);
  }
  s.id = genId_('SH');
  s.status = s.status || 'active';
  s.created_at = now; s.updated_at = now;
  if (!s.code) s.code = 'SH-' + nextSeq_(SHEETS.SHOPS, 'code');
  appendObject_(SHEETS.SHOPS, s);
  return findById_(SHEETS.SHOPS, s.id);
}

// ===================================================================
// ASSETS
// ===================================================================
function apiListAssets(body) {
  var q = String(body.q || '').trim().toLowerCase();
  var rows = readObjects_(SHEETS.ASSETS);
  var categories = uniq_(rows.map(function (r) { return r.category; }).filter(Boolean));
  var filtered = rows.filter(function (r) {
    if (body.category && r.category !== body.category) return false;
    if (body.status && r.status !== body.status) return false;
    if (body.shop_id && r.shop_id !== body.shop_id) return false;
    if (!q) return true;
    return [r.code, r.name, r.serial, r.category].join(' ').toLowerCase().indexOf(q) !== -1;
  });
  var page = paginate_(filtered, body);
  page.categories = categories;
  return page;
}

function apiUpsertAsset(body, user) {
  requireRole_(user, ['admin', 'technician']);
  var a = body.asset || {};
  var now = new Date().toISOString();
  if (a.id) {
    a.updated_at = now;
    updateById_(SHEETS.ASSETS, a.id, a);
    return findById_(SHEETS.ASSETS, a.id);
  }
  a.id = genId_('AS');
  a.status = a.status || 'in_stock';
  a.unit = a.unit || 'ชิ้น';
  a.created_at = now; a.updated_at = now;
  if (!a.code) a.code = 'AS-' + nextSeq_(SHEETS.ASSETS, 'code');
  appendObject_(SHEETS.ASSETS, a);
  return findById_(SHEETS.ASSETS, a.id);
}

// ===================================================================
// LOANS (type = issue ในตาราง Log & History)
// ===================================================================
function apiListLoans(body) {
  var rows = readObjects_(SHEETS.LOG).filter(function (l) { return l.type === 'issue'; });
  var q = String(body.q || '').trim().toLowerCase();
  var filtered = rows.filter(function (r) {
    if (body.status && r.status !== body.status) return false;
    if (body.shop_id && r.shop_id !== body.shop_id) return false;
    if (!q) return true;
    return [r.loan_no, r.shop_name, r.technician, r.items_summary].join(' ').toLowerCase().indexOf(q) !== -1;
  }).sort(byTsDesc_);
  return paginate_(filtered, body);
}

function apiGetLoan(body) {
  var loan = findById_(SHEETS.LOG, body.id);
  if (!loan) throw new Error('ไม่พบใบยืม');
  loan.items = safeParse_(loan.items_json);
  return loan;
}

function apiCreateLoan(body, user) {
  requireRole_(user, ['admin', 'technician']);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var shop = findById_(SHEETS.SHOPS, body.shop_id);
    if (!shop) throw new Error('ไม่พบร้านค้า');
    var items = body.items || [];
    if (!items.length) throw new Error('กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ');

    var now = new Date();
    var loanNo = nextLoanNo_(now);
    var qtyTotal = items.reduce(function (s, it) { return s + Number(it.qty || 0); }, 0);
    var summary = items.map(function (it) {
      return it.asset_name + ' x' + it.qty;
    }).join(', ');

    // อัปเดตทรัพย์สินที่ยืม (ถ้าอ้างอิงชิ้นจริง) → status=loaned, ผูกกับร้าน
    items.forEach(function (it) {
      if (it.asset_id) {
        updateById_(SHEETS.ASSETS, it.asset_id,
          { status: 'loaned', shop_id: body.shop_id, updated_at: now.toISOString() });
      }
    });

    var row = {
      id: genId_('LG'),
      ts: now.toISOString(),
      type: 'issue',
      loan_no: loanNo,
      shop_id: body.shop_id,
      shop_name: shop.name,
      technician: user.full_name || user.username,
      items_json: JSON.stringify(items),
      items_summary: summary,
      qty_total: qtyTotal,
      deposit: Number(body.deposit || 0),
      status: 'active',
      signature: body.signature || '',
      note: body.note || '',
    };
    appendObject_(SHEETS.LOG, row);

    // สร้าง PDF สัญญายืม → เก็บใน Google Drive
    try {
      var url = buildContractPdf_(row, shop, items);
      updateById_(SHEETS.LOG, row.id, { contract_url: url });
      row.contract_url = url;
    } catch (pdfErr) {
      row.contract_error = String(pdfErr);
    }
    row.items = items;
    return row;
  } finally {
    lock.releaseLock();
  }
}

function apiReturnLoan(body, user) {
  requireRole_(user, ['admin', 'technician']);
  var loan = findById_(SHEETS.LOG, body.id);
  if (!loan) throw new Error('ไม่พบใบยืม');
  if (loan.status !== 'active') throw new Error('ใบยืมนี้ไม่ได้อยู่ในสถานะกำลังยืม');
  var items = safeParse_(loan.items_json);
  items.forEach(function (it) {
    if (it.asset_id) {
      updateById_(SHEETS.ASSETS, it.asset_id,
        { status: 'in_stock', shop_id: '', updated_at: new Date().toISOString() });
    }
  });
  updateById_(SHEETS.LOG, body.id, { status: 'returned', note: body.note || loan.note });
  // บันทึกเหตุการณ์คืน
  appendObject_(SHEETS.LOG, {
    id: genId_('LG'), ts: new Date().toISOString(), type: 'return',
    loan_no: loan.loan_no, shop_id: loan.shop_id, shop_name: loan.shop_name,
    technician: user.full_name || user.username, items_json: loan.items_json,
    items_summary: loan.items_summary, qty_total: loan.qty_total, status: 'approved',
    note: 'คืนจากใบยืม ' + loan.loan_no,
  });
  return findById_(SHEETS.LOG, body.id);
}

// ===================================================================
// MOVEMENTS (ย้ายร้าน / คืนคลัง — ต้องอนุมัติ)
// ===================================================================
function apiCreateMovement(body, user) {
  requireRole_(user, ['admin', 'technician']);
  var type = body.type; // 'transfer' | 'return'
  if (['transfer', 'return'].indexOf(type) === -1) throw new Error('ประเภทการเคลื่อนไหวไม่ถูกต้อง');
  var items = body.items || [];
  if (!items.length) throw new Error('กรุณาเลือกอุปกรณ์');
  var fromShop = body.from_shop_id ? findById_(SHEETS.SHOPS, body.from_shop_id) : null;
  var row = {
    id: genId_('LG'), ts: new Date().toISOString(), type: type,
    shop_id: body.from_shop_id || '', shop_name: fromShop ? fromShop.name : '',
    technician: user.full_name || user.username,
    items_json: JSON.stringify(items),
    items_summary: items.map(function (it) { return it.asset_name + ' x' + it.qty; }).join(', '),
    qty_total: items.reduce(function (s, it) { return s + Number(it.qty || 0); }, 0),
    status: 'pending',
    from_shop_id: body.from_shop_id || '', to_shop_id: body.to_shop_id || '',
    note: body.note || '',
  };
  appendObject_(SHEETS.LOG, row);
  return row;
}

function apiListMovements(body) {
  var rows = readObjects_(SHEETS.LOG).filter(function (l) {
    return l.type === 'transfer' || l.type === 'return';
  });
  var filtered = rows.filter(function (r) {
    if (body.status && r.status !== body.status) return false;
    return true;
  }).sort(byTsDesc_);
  return paginate_(filtered, body);
}

function apiApproveMovement(body, user) {
  requireRole_(user, ['admin']);
  var mv = findById_(SHEETS.LOG, body.id);
  if (!mv) throw new Error('ไม่พบรายการ');
  if (mv.status !== 'pending') throw new Error('รายการนี้ถูกดำเนินการไปแล้ว');
  var decision = body.decision === 'approved' ? 'approved' : 'rejected';
  if (decision === 'approved') {
    var items = safeParse_(mv.items_json);
    items.forEach(function (it) {
      if (!it.asset_id) return;
      if (mv.type === 'transfer') {
        updateById_(SHEETS.ASSETS, it.asset_id,
          { shop_id: mv.to_shop_id, status: 'loaned', updated_at: new Date().toISOString() });
      } else { // return
        updateById_(SHEETS.ASSETS, it.asset_id,
          { shop_id: '', status: 'in_stock', updated_at: new Date().toISOString() });
      }
    });
  }
  updateById_(SHEETS.LOG, body.id,
    { status: decision, approved_by: user.full_name || user.username, approved_at: new Date().toISOString() });
  return findById_(SHEETS.LOG, body.id);
}

// ===================================================================
// AUDIT (นับทรัพย์สินประจำปี)
// ===================================================================
function apiListAudit(body) {
  var rows = readObjects_(SHEETS.AUDIT).filter(function (r) {
    if (body.cycle && String(r.cycle) !== String(body.cycle)) return false;
    if (body.shop_id && r.shop_id !== body.shop_id) return false;
    return true;
  }).sort(byTsDesc_);
  return paginate_(rows, body);
}

function apiCreateAudit(body, user) {
  requireRole_(user, ['admin', 'technician']);
  var shop = body.shop_id ? findById_(SHEETS.SHOPS, body.shop_id) : null;
  var items = body.items || [];
  if (!items.length) throw new Error('ไม่มีรายการนับ');
  var now = new Date().toISOString();
  items.forEach(function (it) {
    appendObject_(SHEETS.AUDIT, {
      id: genId_('AD'), ts: now, cycle: body.cycle || new Date().getFullYear(),
      shop_id: body.shop_id || '', shop_name: shop ? shop.name : '',
      asset_code: it.asset_code || '', asset_name: it.asset_name || '',
      expected_qty: Number(it.expected_qty || 0), counted_qty: Number(it.counted_qty || 0),
      condition: it.condition || 'ok', technician: user.full_name || user.username,
      note: it.note || '', status: 'recorded',
    });
    // อัปเดตสถานะทรัพย์สินที่ชำรุด/สูญหาย (ถ้าอ้างอิงชิ้นจริง)
    if (it.asset_id && (it.condition === 'damaged' || it.condition === 'lost')) {
      updateById_(SHEETS.ASSETS, it.asset_id, { status: it.condition, updated_at: now });
    }
  });
  return { inserted: items.length };
}

// ===================================================================
// DASHBOARD & EXPORT
// ===================================================================
function apiDashboard() {
  var assets = readObjects_(SHEETS.ASSETS);
  var shops = readObjects_(SHEETS.SHOPS);
  var logs = readObjects_(SHEETS.LOG);
  function count(arr, fn) { return arr.filter(fn).length; }
  return {
    assets: {
      total: assets.length,
      in_stock: count(assets, function (a) { return a.status === 'in_stock'; }),
      loaned: count(assets, function (a) { return a.status === 'loaned'; }),
      damaged: count(assets, function (a) { return a.status === 'damaged'; }),
      lost: count(assets, function (a) { return a.status === 'lost'; }),
      value: assets.reduce(function (s, a) { return s + Number(a.value || 0); }, 0),
    },
    shops: { total: shops.length, active: count(shops, function (s) { return s.status === 'active'; }) },
    loans: {
      active: count(logs, function (l) { return l.type === 'issue' && l.status === 'active'; }),
      total: count(logs, function (l) { return l.type === 'issue'; }),
    },
    pending: count(logs, function (l) {
      return (l.type === 'transfer' || l.type === 'return') && l.status === 'pending';
    }),
    recent: logs.sort(byTsDesc_).slice(0, 8),
  };
}

function apiExportCsv(body, user) {
  requireRole_(user, ['admin', 'executive']);
  var key = (body.table || 'LOG').toUpperCase();
  var sheetName = SHEETS[key];
  if (!sheetName) throw new Error('ไม่รู้จักตาราง: ' + body.table);
  var rows = readObjects_(sheetName);
  if (body.from || body.to) {
    rows = rows.filter(function (r) {
      var t = r.ts || r.created_at;
      if (!t) return true;
      if (body.from && t < body.from) return false;
      if (body.to && t > body.to) return false;
      return true;
    });
  }
  var headers = HEADERS[key];
  var lines = [headers.join(',')];
  rows.forEach(function (r) {
    lines.push(headers.map(function (h) { return csvCell_(r[h]); }).join(','));
  });
  return {
    filename: sheetName.replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.csv',
    csv: lines.join('\n'),
    count: rows.length,
  };
}

// ===================================================================
// PDF สัญญายืม
// ===================================================================
function buildContractPdf_(loan, shop, items) {
  var rows = items.map(function (it, i) {
    return '<tr><td>' + (i + 1) + '</td><td>' + esc_(it.asset_name) +
      '</td><td>' + esc_(it.asset_code || '-') + '</td><td style="text-align:right">' +
      it.qty + '</td></tr>';
  }).join('');
  var sig = loan.signature
    ? '<img src="' + loan.signature + '" style="height:70px" />'
    : '<div style="height:70px"></div>';
  var html =
    '<html><head><meta charset="utf-8"><style>' +
    'body{font-family:sans-serif;font-size:13px;padding:24px;color:#111}' +
    'h1{font-size:20px;text-align:center;margin:0 0 4px}' +
    '.muted{color:#555}table{width:100%;border-collapse:collapse;margin-top:12px}' +
    'th,td{border:1px solid #999;padding:6px 8px;font-size:12px}' +
    'th{background:#eee}.sign{margin-top:32px;display:flex;justify-content:space-between}' +
    '</style></head><body>' +
    '<h1>สัญญายืมอุปกรณ์</h1>' +
    '<div class="muted" style="text-align:center">เลขที่ ' + esc_(loan.loan_no) +
    ' &nbsp;•&nbsp; วันที่ ' + new Date(loan.ts).toLocaleDateString('th-TH') + '</div>' +
    '<p><b>ร้านค้า:</b> ' + esc_(shop.name) + ' (' + esc_(shop.code) + ')<br>' +
    '<b>ที่อยู่:</b> ' + esc_([shop.address, shop.district, shop.province].filter(Boolean).join(' ')) + '<br>' +
    '<b>ผู้ส่งมอบ (ช่าง):</b> ' + esc_(loan.technician) + '</p>' +
    '<table><thead><tr><th>#</th><th>อุปกรณ์</th><th>รหัส</th><th>จำนวน</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>' +
    '<p style="margin-top:12px"><b>เงินมัดจำ:</b> ' + Number(loan.deposit || 0).toLocaleString() + ' บาท</p>' +
    (loan.note ? '<p><b>หมายเหตุ:</b> ' + esc_(loan.note) + '</p>' : '') +
    '<div class="sign"><div>ผู้ยืม<br>' + sig + '<br>(' + esc_(shop.contact_name || '.....................') + ')</div>' +
    '<div style="text-align:center">ผู้ส่งมอบ<br><div style="height:70px"></div>(' + esc_(loan.technician) + ')</div></div>' +
    '</body></html>';

  var pdf = Utilities.newBlob(html, MimeType.HTML, loan.loan_no + '.html').getAs(MimeType.PDF);
  pdf.setName('สัญญายืม-' + loan.loan_no + '.pdf');
  var folder = contractFolder_();
  var file = folder.createFile(pdf);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function contractFolder_() {
  var sp = PropertiesService.getScriptProperties();
  var id = sp.getProperty('CONTRACT_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* fall through */ } }
  var folder = DriveApp.createFolder('สัญญายืมอุปกรณ์ (Asset Loan Contracts)');
  sp.setProperty('CONTRACT_FOLDER_ID', folder.getId());
  return folder;
}

// ===================================================================
// ตัวช่วยอ่าน/เขียนชีต (Sheets เป็นฐานข้อมูล)
// ===================================================================
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบแท็บ "' + name + '" — กรุณารัน setup() ก่อน');
  return sh;
}

function readObjects_(name) {
  var sh = sheet_(name);
  var range = sh.getDataRange().getValues();
  if (range.length < 2) return [];
  var headers = range[0];
  var out = [];
  for (var i = 1; i < range.length; i++) {
    var row = range[i];
    if (row.join('') === '') continue;
    var obj = { _row: i + 1 };
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = row[c];
    out.push(obj);
  }
  return out;
}

function findById_(name, id) {
  if (!id) return null;
  return readObjects_(name).filter(function (r) { return String(r.id) === String(id); })[0] || null;
}

function appendObject_(name, obj) {
  var sh = sheet_(name);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var row = headers.map(function (h) { return obj[h] === undefined ? '' : obj[h]; });
  sh.appendRow(row);
}

function updateById_(name, id, patch) {
  var sh = sheet_(name);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var target = findById_(name, id);
  if (!target) throw new Error('ไม่พบข้อมูล id=' + id);
  var r = target._row;
  Object.keys(patch).forEach(function (k) {
    var c = headers.indexOf(k);
    if (c !== -1) sh.getRange(r, c + 1).setValue(patch[k]);
  });
}

function paginate_(rows, body) {
  var page = Math.max(1, Number(body.page || 1));
  var size = Math.max(1, Math.min(200, Number(body.pageSize || 20)));
  var start = (page - 1) * size;
  return { rows: rows.slice(start, start + size), total: rows.length, page: page, pageSize: size };
}

// ===== utils =====
function genId_(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
}

function nextSeq_(name, field) {
  var rows = readObjects_(name);
  var max = 0;
  rows.forEach(function (r) {
    var m = String(r[field] || '').match(/(\d+)\s*$/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return pad_(max + 1, 4);
}

function nextLoanNo_(date) {
  var year = date.getFullYear();
  var rows = readObjects_(SHEETS.LOG).filter(function (l) {
    return l.type === 'issue' && String(l.loan_no).indexOf('LN-' + year) === 0;
  });
  return 'LN-' + year + '-' + pad_(rows.length + 1, 4);
}

function pad_(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
function uniq_(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }
function byTsDesc_(a, b) { return String(b.ts || b.created_at || '').localeCompare(String(a.ts || a.created_at || '')); }
function safeParse_(s) { try { return JSON.parse(s || '[]'); } catch (e) { return []; } }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
function csvCell_(v) {
  var s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// ===================================================================
// SETUP — รันครั้งเดียวเพื่อสร้างแท็บ + ผู้ใช้แอดมินเริ่มต้น
// ===================================================================
function setup() {
  var ss = ss_();
  Object.keys(HEADERS).forEach(function (key) {
    var name = SHEETS[key];
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, HEADERS[key].length).setValues([HEADERS[key]]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, HEADERS[key].length).setFontWeight('bold');
    }
  });
  // ลบชีตเริ่มต้น "Sheet1" ถ้ายังว่าง
  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && ss.getSheets().length > 1 && s1.getLastRow() === 0) ss.deleteSheet(s1);

  // สร้างแอดมินเริ่มต้น (ถ้ายังไม่มีผู้ใช้)
  if (readObjects_(SHEETS.USERS).length === 0) {
    appendObject_(SHEETS.USERS, {
      id: genId_('US'), username: 'admin', full_name: 'ผู้ดูแลระบบ',
      role: 'admin', pw_hash: hashPassword_('admin1234'),
      active: true, created_at: new Date().toISOString(),
    });
    Logger.log('สร้างผู้ใช้ admin / รหัสผ่าน admin1234 (โปรดเปลี่ยนรหัสผ่านทันที)');
  }
  return 'setup เสร็จสิ้น';
}

/** ตัวช่วยสร้าง/รีเซ็ตรหัสผ่านผู้ใช้ — แก้ค่าในฟังก์ชันแล้วรัน */
function createUser() {
  var username = 'somchai';           // <-- แก้
  var fullName = 'สมชาย ใจดี';         // <-- แก้
  var role = 'technician';             // technician | admin | executive
  var password = 'changeme1234';       // <-- แก้
  var existing = readObjects_(SHEETS.USERS).filter(function (u) {
    return String(u.username).toLowerCase() === username.toLowerCase();
  })[0];
  if (existing) {
    updateById_(SHEETS.USERS, existing.id,
      { pw_hash: hashPassword_(password), role: role, full_name: fullName, active: true });
    return 'อัปเดตผู้ใช้ ' + username;
  }
  appendObject_(SHEETS.USERS, {
    id: genId_('US'), username: username, full_name: fullName, role: role,
    pw_hash: hashPassword_(password), active: true, created_at: new Date().toISOString(),
  });
  return 'สร้างผู้ใช้ ' + username;
}
