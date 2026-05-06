const MC_BASE   = 'assets/items/';
const WIKI_BASE = 'https://minecraft.wiki/images/';

const RARITY_COLORS = {
  'Mítico':   '#FF55FF',
  'Lendário': '#FFAA00',
  'Raro':     '#5555FF',
  'Incomum':  '#55FF55',
  'Comum':    '#AAAAAA',
};

// Higher = better rarity (for sort: descending = Mítico first)
const RARITY_RANK = { 'Comum': 0, 'Incomum': 1, 'Raro': 2, 'Lendário': 3, 'Mítico': 4 };

const brainrotSort = { col: 'buyValue', asc: false };
const rubiSort     = { col: 'buyValue', asc: false };

function fmtFull(n) {
  return n.toLocaleString('pt-BR');
}

function fmt(n) {
  if (n == null || n === 0) return '0';
  const a = Math.abs(n);
  if (a >= 1e15) return (n / 1e15).toFixed(1).replace(/\.0$/, '') + 'Q';
  if (a >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
  if (a >= 1e9)  return (n / 1e9).toFixed(1).replace(/\.0$/, '')  + 'B';
  if (a >= 1e6)  return (n / 1e6).toFixed(1).replace(/\.0$/, '')  + 'M';
  if (a >= 1e3)  return (n / 1e3).toFixed(1).replace(/\.0$/, '')  + 'K';
  return String(n);
}

function fmt2(n) {
  if (n == null || n === 0) return '0';
  const a = Math.abs(n);
  if (a >= 1e15) return (n / 1e15).toFixed(2).replace(/\.00$/, '') + 'Q';
  if (a >= 1e12) return (n / 1e12).toFixed(2).replace(/\.00$/, '') + 'T';
  if (a >= 1e9)  return (n / 1e9).toFixed(2).replace(/\.00$/, '')  + 'B';
  if (a >= 1e6)  return (n / 1e6).toFixed(2).replace(/\.00$/, '')  + 'M';
  if (a >= 1e3)  return (n / 1e3).toFixed(2).replace(/\.00$/, '')  + 'K';
  return String(n);
}

function fmtTime(secs) {
  if (!secs || secs <= 0) return '—';
  const totalMin   = Math.floor(secs / 60);
  const totalHours = Math.floor(totalMin / 60);
  const totalDays  = Math.floor(totalHours / 24);
  const months = Math.floor(totalDays / 30);
  const days   = totalDays % 30;
  const hours  = totalHours % 24;
  const mins   = totalMin % 60;
  const parts  = [];
  if (months > 0) parts.push(months + 'm');
  if (days   > 0) parts.push(days   + 'd');
  if (hours  > 0) parts.push(hours  + 'h');
  if (mins   > 0) parts.push(mins   + 'min');
  return parts.join(' ') || '< 1min';
}

function beSecs(b) {
  if (!b.valuePerSec) return Infinity;
  return b.buyValue / 2 / b.valuePerSec;
}

function beFmt(b) {
  const s = beSecs(b);
  return s === Infinity ? '—' : fmtTime(s);
}

function rarityPill(rarity) {
  const color = RARITY_COLORS[rarity] || '#888';
  return `<span class="rarity-pill" style="color:${color};border-color:${color}33;background:${color}18">${rarity}</span>`;
}

function mcImg(id, cls = 'item-icon') {
  return `<img src="${MC_BASE}${id}.png" class="${cls}" alt="">`;
}

function mobFace(filename) {
  if (!filename) return '<span class="mob-unknown">?</span>';
  return `<img src="${WIKI_BASE}${filename}" class="row-icon" alt="">`;
}

function sortBrainrots(data, col, asc) {
  return [...data].sort((a, b) => {
    let va, vb;
    if (col === '_be') {
      va = beSecs(a);
      vb = beSecs(b);
    } else if (col === 'rarity') {
      va = RARITY_RANK[a.rarity] ?? -1;
      vb = RARITY_RANK[b.rarity] ?? -1;
    } else if (col === 'name') {
      return asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else {
      va = a[col] ?? 0;
      vb = b[col] ?? 0;
    }
    return asc ? va - vb : vb - va;
  });
}

// Shared colgroup for aligned columns between Coins and Rubi tables
const SHARED_COLS = `<colgroup>
  <col class="col-name">
  <col class="col-rarity">
  <col class="col-vps">
  <col class="col-buy">
  <col class="col-be">
</colgroup>`;

const BE_TOOLTIP = 'Valor de Compra ÷ 2 ÷ Coins/s';

function renderBrainrotTable(wrapperId, data, state, currency) {
  const wrap  = document.getElementById(wrapperId);
  const isRubi = currency === 'rubi';

  const cols = [
    { key: 'name',        label: 'Nome'     },
    { key: 'rarity',      label: 'Raridade' },
    { key: 'valuePerSec', label: isRubi ? 'Rubi/s' : 'Coins/s', num: true },
    { key: 'buyValue',    label: 'Custo', num: true },
    { key: '_be',         label: 'Tempo para se pagar', tooltip: BE_TOOLTIP, num: true },
  ];

  const sorted = sortBrainrots(data, state.col, state.asc);

  let html = `<div class="brainrots-card"><div class="table-scroll"><table class="brainrot-table">${SHARED_COLS}<thead><tr>`;
  for (const c of cols) {
    const active = state.col === c.key;
    const arrow  = active ? `<span class="sort-arrow">${state.asc ? '↑' : '↓'}</span>` : '';
    const tip    = c.tooltip ? `<span class="info-icon" data-tip="${c.tooltip}">i</span>` : '';
    const cls    = ['sortable', c.num ? 'num' : '', active ? 'sorted' : ''].filter(Boolean).join(' ');
    html += `<th class="${cls}" data-col="${c.key}">${c.label}${tip}${arrow}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const b of sorted) {
    const unknown  = !b.valuePerSec && b.name.endsWith('?');
    const rowCls   = unknown ? ' class="unknown"' : '';
    const costCls  = isRubi ? 'rubi-val' : 'green-val';
    html += `<tr${rowCls}>
      <td class="td-name">${mobFace(b.icon)}<span class="brainrot-name">${b.name}</span></td>
      <td>${rarityPill(b.rarity)}</td>
      <td class="num muted-val">${b.valuePerSec ? fmt(b.valuePerSec) : '—'}</td>
      <td class="num ${costCls}">${fmt(b.buyValue)}</td>
      <td class="num">${beFmt(b)}</td>
    </tr>`;
  }

  html += '</tbody></table></div></div>';
  wrap.innerHTML = html;

  wrap.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (state.col === col) {
        state.asc = !state.asc;
      } else {
        state.col = col;
        // _be: ascending first (shortest break-even = best investment)
        // rarity: descending first (Mítico first, rank 4 desc)
        // others: descending first (highest values first)
        state.asc = col === '_be';
      }
      renderBrainrotTable(wrapperId, data, state, currency);
    });
  });

  wrap.querySelectorAll('.info-icon').forEach(el => {
    el.addEventListener('click', e => e.stopPropagation());
  });
}

function renderRebirths(data) {
  const wrap = document.getElementById('rebirths-table-wrap');
  let cumulative = 0;

  let html = `<div class="brainrots-card"><div class="table-scroll"><table class="rebirths-table"><thead><tr>
    <th>Nível</th>
    <th class="num">Tokens Multi.</th>
    <th class="num">Coins Multi.</th>
    <th class="num">Custo</th>
    <th class="num">Custo dos Brainrots</th>
    <th class="num">Total</th>
    <th class="num">Total Acumulado</th>
    <th>Brainrots Necessários</th>
  </tr></thead><tbody>`;

  for (const r of data) {
    const total = r.cost + r.costOfNeededBrainrots;
    cumulative += total;
    html += `<tr>
      <td>${r.level}</td>
      <td class="num token-val">x${r.tokensMultiplier.toFixed(1)}</td>
      <td class="num green-val">x${r.coinsMultiplier.toFixed(1)}</td>
      <td class="num muted-val">${fmt(r.cost)}</td>
      <td class="num muted-val">${fmt(r.costOfNeededBrainrots)}</td>
      <td class="num green-val">${fmt(total)}</td>
      <td class="num dark-green-val">${fmt(cumulative)}</td>
      <td class="brainrots-needed">${r.neededBrainrots.replace(/\n/g, '<br>')}</td>
    </tr>`;
  }

  html += '</tbody></table></div></div>';
  wrap.innerHTML = html;
}

function renderPorretes(data) {
  const wrap = document.getElementById('porretes-table-wrap');

  let html = `<div class="brainrots-card"><div class="table-scroll"><table class="porretes-table"><thead><tr>
    <th>Item</th>
    <th>Mob ♥ HP ⚔ Hits</th>
    <th class="num">Dano</th>
    <th class="num">Equiv. Nível 1</th>
  </tr></thead><tbody>`;

  for (const p of data) {
    html += `<tr>
      <td class="td-name">${mcImg(p.icon)}<span class="brainrot-name">${p.level} - ${p.name}</span></td>
      <td>${p.mob
        ? `${p.mob}${p.hp != null ? ` <span class="hp-tag">♥ ${p.hp}</span>` : ''}${p.hp != null && p.damage != null ? ` <span class="hits-tag">⚔ ${Math.ceil(p.hp / p.damage)} Hits</span>` : ''}`
        : '—'}</td>
      <td class="num">${p.damage ?? '—'}</td>
      <td class="num">${fmtFull(p.level1Equivalents)}</td>
    </tr>`;
  }

  html += '</tbody></table></div></div>';
  wrap.innerHTML = html;
}

function switchView(view) {
  document.querySelectorAll('.view').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelector(`.nav-btn[data-view="${view}"]`).classList.add('active');
  window.scrollTo(0, 0);
}

// ── Meus Brainrots ──────────────────────────────────────────────────────────

const VIP_DATA = {
  none:      { bonus: 1.00, afkDebuff: 0.75, label: 'Sem VIP' },
  ouro:      { bonus: 1.05, afkDebuff: 0.77, label: 'VIP Ouro' },
  diamante:  { bonus: 1.10, afkDebuff: 0.80, label: 'VIP Diamante' },
  obsidian:  { bonus: 1.20, afkDebuff: 0.82, label: 'VIP Obsidian' },
  esmeralda: { bonus: 1.40, afkDebuff: 0.84, label: 'VIP Esmeralda' },
};

const MB_LS = { REBIRTH: 'mb_rebirth', CONFIG: 'mb_config', LOADOUT: 'mb_loadout' };

function mbLoad(key, def) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; } catch { return def; }
}
function mbSave(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

let _mbBrainrots = [];
let _mbRebirths  = [];
let _mbLevel     = 0;
let _mbConfig    = { vip: 'none', booster: 3.50, eventMulti: 3.50 };
let _mbLoadout   = [];

function _mbVip()     { return VIP_DATA[_mbConfig.vip] || VIP_DATA.none; }
function _mbBooster() { return parseFloat(_mbConfig.booster) || 1; }
function _mbEvent()   { return parseFloat(_mbConfig.eventMulti) || 1; }
function _mbRebirth() { return _mbRebirths.find(r => r.level === _mbLevel) || null; }
function _mbCoinsMulti() { const r = _mbRebirth(); return r ? r.coinsMultiplier : 1; }

function _mbTotals() {
  const vip = _mbVip(), bst = _mbBooster(), evt = _mbEvent(), cm = _mbCoinsMulti();
  const map = Object.fromEntries(_mbBrainrots.map(b => [b.name, b]));
  let afk = 0, world = 0, event = 0;
  for (const e of _mbLoadout) {
    const b = map[e.name];
    if (!b || b.currency === 'rubi') continue;
    const cps = b.valuePerSec || 0;
    afk   += cps * cm * vip.bonus * vip.afkDebuff * e.qty;
    world += cps * cm * vip.bonus * bst * e.qty;
    event += cps * cm * vip.bonus * bst * evt * e.qty;
  }
  return { afk, world, event };
}

function mbRenderCards() {
  const c = document.getElementById('mb-cards');
  const vip = _mbVip(), bst = _mbBooster(), evt = _mbEvent();
  const level = _mbLevel;
  const cur  = _mbRebirth();
  const next = _mbRebirths.find(r => r.level === level + 1) || null;
  const { afk, world, event } = _mbTotals();

  // Card 1: current rebirth
  const multiHtml = cur
    ? `<span>Coins <strong>${cur.coinsMultiplier}x</strong></span><span>Tokens <strong>${cur.tokensMultiplier}x</strong></span>`
    : `<span style="color:#555">Sem multiplicador</span>`;

  // Card 2: next rebirth (hidden at max)
  let card2 = '';
  if (next) {
    const total    = next.cost + next.costOfNeededBrainrots;
    const timeStr  = afk > 0 ? fmtTime(total / afk) : '—';
    card2 = `<div class="mb-card">
      <div class="mb-card-label">Próximo Rebirth (${next.level})</div>
      <div class="mb-next-cost">Custo: <strong>${fmt2(total)}</strong> <span class="mb-cost-detail">(${fmt2(next.cost)} + ${fmt2(next.costOfNeededBrainrots)})</span></div>
      <div class="mb-next-brainrots">${next.neededBrainrots}</div>
      <div class="mb-next-afk">Tempo AFK: <strong>${timeStr}</strong></div>
    </div>`;
  }

  c.innerHTML = `
    <div class="mb-card mb-card-rebirth">
      <div class="mb-card-label">Rebirth Atual</div>
      <div class="mb-rebirth-level">${level}</div>
      <div class="mb-rebirth-multi">${multiHtml}</div>
      <div class="mb-step-btns">
        <button class="rebirth-step-btn" id="mb-dec">−</button>
        <button class="rebirth-step-btn" id="mb-inc">+</button>
      </div>
    </div>
    ${card2}
    <div class="mb-card">
      <div class="mb-card-title">AFK <span class="mb-multi-hint">· ${vip.label}</span></div>
      <div class="mb-gen-rows">
        <div class="mb-gen-row"><span>/ s</span><strong class="val-afk">${fmt2(afk)}</strong></div>
        <div class="mb-gen-row"><span>/ m</span><strong class="val-afk">${fmt2(afk * 60)}</strong></div>
        <div class="mb-gen-row"><span>/ h</span><strong class="val-afk">${fmt2(afk * 3600)}</strong></div>
        <div class="mb-gen-row"><span>/ d</span><strong class="val-afk">${fmt2(afk * 86400)}</strong></div>
      </div>
    </div>
    <div class="mb-card">
      <div class="mb-card-title">Mundo <span class="mb-multi-hint">· ${bst}x</span></div>
      <div class="mb-gen-rows">
        <div class="mb-gen-row"><span>/ s</span><strong class="val-afk">${fmt2(world)}</strong></div>
        <div class="mb-gen-row"><span>/ m</span><strong class="val-afk">${fmt2(world * 60)}</strong></div>
        <div class="mb-gen-row"><span>/ h</span><strong class="val-afk">${fmt2(world * 3600)}</strong></div>
        <div class="mb-gen-row"><span>/ d</span><strong class="val-afk">${fmt2(world * 86400)}</strong></div>
      </div>
    </div>
    <div class="mb-card">
      <div class="mb-card-title">Evento <span class="mb-multi-hint">· ${bst}x · ${evt}x</span></div>
      <div class="mb-gen-rows">
        <div class="mb-gen-row"><span>/ s</span><strong class="val-event">${fmt2(event)}</strong></div>
        <div class="mb-gen-row"><span>/ m</span><strong class="val-event">${fmt2(event * 60)}</strong></div>
        <div class="mb-gen-row"><span>/ h</span><strong class="val-event">${fmt2(event * 3600)}</strong></div>
        <div class="mb-gen-row"><span>/ d</span><strong class="val-event">${fmt2(event * 86400)}</strong></div>
      </div>
    </div>`;

  document.getElementById('mb-dec').addEventListener('click', () => {
    _mbLevel = Math.max(0, _mbLevel - 1);
    mbSave(MB_LS.REBIRTH, _mbLevel);
    mbRenderCards();
  });
  document.getElementById('mb-inc').addEventListener('click', () => {
    _mbLevel = Math.min(20, _mbLevel + 1);
    mbSave(MB_LS.REBIRTH, _mbLevel);
    mbRenderCards();
  });
}

function mbRenderTable() {
  const tbody = document.getElementById('mb-tbody');
  const vip = _mbVip(), bst = _mbBooster(), evt = _mbEvent(), cm = _mbCoinsMulti();
  const map = Object.fromEntries(_mbBrainrots.map(b => [b.name, b]));

  if (_mbLoadout.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="color:#555;text-align:center;padding:20px;">Nenhum brainrot adicionado.</td></tr>`;
    return;
  }

  const sorted = [..._mbLoadout].sort((a, b) =>
    (map[b.name]?.valuePerSec || 0) - (map[a.name]?.valuePerSec || 0)
  );

  let html = '';
  for (const e of sorted) {
    const b = map[e.name];
    if (!b) continue;
    const cps   = b.valuePerSec || 0;
    const qty   = e.qty;
    const afkPs = cps * cm * vip.bonus * vip.afkDebuff * qty;
    const evtPs = cps * cm * vip.bonus * bst * evt * qty;
    const color = RARITY_COLORS[b.rarity] || '#e0e0e0';
    const idx   = _mbLoadout.indexOf(e);
    html += `<tr data-idx="${idx}">
      <td><div class="td-name-flex">${mobFace(b.icon)}<span class="brainrot-name" style="color:${color};font-weight:700">${b.name}</span></div></td>
      <td class="num qty-cell">
        <span class="qty-display">${qty}</span>
        <span class="qty-form hidden">
          <input type="number" class="qty-input" value="${qty}" min="1">
          <button class="qty-confirm">✓</button>
        </span>
      </td>
      <td class="num green-val">${fmt2(b.buyValue * qty)}</td>
      <td class="num val-afk">${fmt2(afkPs)}</td>
      <td class="num val-event">${fmt2(evtPs)}</td>
      <td class="num val-afk">${fmt2(afkPs * 60)}</td>
      <td class="num val-event">${fmt2(evtPs * 60)}</td>
      <td class="num val-afk">${fmt2(afkPs * 3600)}</td>
      <td class="num val-event">${fmt2(evtPs * 3600)}</td>
      <td class="num val-afk">${fmt2(afkPs * 86400)}</td>
      <td class="num val-event">${fmt2(evtPs * 86400)}</td>
      <td><button class="btn-remove">×</button></td>
    </tr>`;
  }
  tbody.innerHTML = html;

  tbody.querySelectorAll('.qty-display').forEach(span => {
    span.addEventListener('click', () => {
      span.classList.add('hidden');
      const form = span.nextElementSibling;
      form.classList.remove('hidden');
      const inp = form.querySelector('.qty-input');
      inp.focus();
      inp.select();
    });
  });

  function confirmQty(btn) {
    const row = btn.closest('tr');
    const idx = parseInt(row.dataset.idx);
    const inp = btn.closest('.qty-form').querySelector('.qty-input');
    const val = parseInt(inp.value);
    if (!isNaN(val) && val >= 1) {
      _mbLoadout[idx].qty = val;
      mbSave(MB_LS.LOADOUT, _mbLoadout);
      mbRenderTable();
      mbRenderCards();
    }
  }

  tbody.querySelectorAll('.qty-confirm').forEach(btn => {
    btn.addEventListener('click', () => confirmQty(btn));
  });

  tbody.querySelectorAll('.qty-input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmQty(inp.nextElementSibling);
    });
  });

  tbody.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.closest('tr').dataset.idx);
      _mbLoadout.splice(idx, 1);
      mbSave(MB_LS.LOADOUT, _mbLoadout);
      mbRenderTable();
      mbRenderCards();
    });
  });
}

function mbRenderAddSelect() {
  const sel = document.getElementById('mb-add-select');
  const coins = _mbBrainrots.filter(b => b.currency !== 'rubi');
  const rarities = ['Mítico', 'Lendário', 'Raro', 'Incomum', 'Comum'];
  sel.innerHTML = rarities.map(rarity => {
    const group = coins
      .filter(b => b.rarity === rarity)
      .sort((a, b) => (b.valuePerSec || 0) - (a.valuePerSec || 0));
    if (group.length === 0) return '';
    return `<optgroup label="${rarity}">${
      group.map(b => `<option value="${b.name}">${b.name} (${b.mob})</option>`).join('')
    }</optgroup>`;
  }).join('');
}

function initMeusbrainrots(brainrots, rebirths) {
  _mbBrainrots = brainrots;
  _mbRebirths  = rebirths;
  _mbLevel     = mbLoad(MB_LS.REBIRTH, 0);
  _mbConfig    = mbLoad(MB_LS.CONFIG, { vip: 'none', booster: 3.50, eventMulti: 3.50 });
  _mbLoadout   = mbLoad(MB_LS.LOADOUT, []);

  mbRenderCards();
  mbRenderTable();
  mbRenderAddSelect();

  // Add button
  document.getElementById('mb-add-btn').addEventListener('click', () => {
    const name = document.getElementById('mb-add-select').value;
    if (!name) return;
    const existing = _mbLoadout.find(e => e.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      _mbLoadout.push({ name, qty: 1 });
    }
    mbSave(MB_LS.LOADOUT, _mbLoadout);
    mbRenderTable();
    mbRenderCards();
  });

  // Config modal
  const modal = document.getElementById('mb-modal');

  function openMbModal() {
    document.getElementById('mb-vip').value         = _mbConfig.vip;
    document.getElementById('mb-booster').value     = _mbConfig.booster;
    document.getElementById('mb-event-multi').value = _mbConfig.eventMulti;
    modal.classList.add('open');
  }

  document.getElementById('mb-config-btn').addEventListener('click', openMbModal);
  document.querySelector('.nav-btn[data-view="meus-brainrots"]').addEventListener('click', () => {
    if (localStorage.getItem(MB_LS.CONFIG) === null) openMbModal();
  });
  document.getElementById('mb-modal-close').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  document.getElementById('mb-modal-save').addEventListener('click', () => {
    _mbConfig = {
      vip:        document.getElementById('mb-vip').value,
      booster:    parseFloat(document.getElementById('mb-booster').value) || 1,
      eventMulti: parseFloat(document.getElementById('mb-event-multi').value) || 1,
    };
    mbSave(MB_LS.CONFIG, _mbConfig);
    modal.classList.remove('open');
    mbRenderCards();
    mbRenderTable();
  });

}

// ── Calculadora de Chaves ────────────────────────────────────────────────────

const _PARSE_SUFFIXES = [
  ['OC', 1e27], ['SS', 1e24], ['S', 1e21], ['QQ', 1e18], ['Q', 1e15],
  ['T', 1e12], ['B', 1e9], ['M', 1e6], ['K', 1e3],
];

function parseNotation(str) {
  if (str === null || str === undefined || str === '') return 0;
  if (typeof str === 'number') return str;
  const s = String(str).trim().toUpperCase().replace(',', '.');
  for (const [sfx, mult] of _PARSE_SUFFIXES) {
    if (s.endsWith(sfx)) {
      const n = parseFloat(s.slice(0, -sfx.length));
      return isNaN(n) ? 0 : n * mult;
    }
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function fmtBig(n) {
  if (n === 0) return '0';
  const a = Math.abs(n);
  if (a >= 1e27) return (n / 1e27).toFixed(2) + 'OC';
  if (a >= 1e24) return (n / 1e24).toFixed(2) + 'SS';
  if (a >= 1e21) return (n / 1e21).toFixed(2) + 'S';
  if (a >= 1e18) return (n / 1e18).toFixed(2) + 'QQ';
  if (a >= 1e15) return (n / 1e15).toFixed(2) + 'Q';
  if (a >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (a >= 1e9)  return (n / 1e9 ).toFixed(2) + 'B';
  if (a >= 1e6)  return (n / 1e6 ).toFixed(2) + 'M';
  if (a >= 1e3)  return (n / 1e3 ).toFixed(2) + 'K';
  return n.toFixed(2);
}

function calcProbs(items) {
  const probs = [];
  let remaining = 1;
  for (let i = 0; i < items.length; i++) {
    if (i === items.length - 1) {
      probs.push(remaining);
    } else {
      const p = remaining * (items[i].odd / 100);
      probs.push(p);
      remaining *= (1 - items[i].odd / 100);
    }
  }
  return probs;
}

const TRIDENTES = [
  'Tridente Comum', 'Tridente Raro', 'Tridente Épico', 'Tridente Lendário',
  'Tridente Místico', 'Tridente Celestial', 'Tridente Supremo',
];
const TRIDENTE_COLORS = ['#AAAAAA', '#55FFFF', '#FF55FF', '#FFAA00', '#AA00AA', '#0000AA', '#AA0000'];

const TRIDENTES_LS = 'tridentes_data';
function trLoad() {
  try { const v = localStorage.getItem(TRIDENTES_LS); return v ? JSON.parse(v) : {}; } catch { return {}; }
}
function trSave(data) { localStorage.setItem(TRIDENTES_LS, JSON.stringify(data)); }

function recalcTridenteFooter(saved) {
  const tfoot = document.getElementById('tridentes-tfoot');
  if (!tfoot) return;
  let totalT = 0, totalC = 0, hasTotalT = false, hasTotalC = false;
  for (const name of TRIDENTES) {
    const d   = saved[name] || {};
    const qty = parseInt(d.qty) || 0;
    const tP1 = parseNotation(d.tokensP1);
    const cP1 = parseNotation(d.coinsP1);
    if (tP1 > 0) { totalT += tP1 * qty; hasTotalT = true; }
    if (cP1 > 0) { totalC += cP1 * qty; hasTotalC = true; }
  }
  tfoot.querySelector('[data-trid-total-t]').textContent = hasTotalT ? fmtBig(totalT) : '—';
  tfoot.querySelector('[data-trid-total-c]').textContent = hasTotalC ? fmtBig(totalC) : '—';
}

function renderTridentes() {
  const tbody = document.getElementById('tridentes-tbody');
  const tfoot = document.getElementById('tridentes-tfoot');
  const tr    = trLoad();

  let totalT = 0, totalC = 0, hasTotalT = false, hasTotalC = false;
  let html = '';

  TRIDENTES.forEach((name, i) => {
    const d   = tr[name] || { tokensP1: '', coinsP1: '', qty: 0 };
    const tP1 = parseNotation(d.tokensP1);
    const cP1 = parseNotation(d.coinsP1);
    const qty = parseInt(d.qty) || 0;
    const totT = tP1 > 0 ? tP1 * qty : null;
    const totC = cP1 > 0 ? cP1 * qty : null;
    if (totT !== null) { totalT += totT; hasTotalT = true; }
    if (totC !== null) { totalC += totC; hasTotalC = true; }

    html += `<tr data-trident-row="${escAttr(name)}">
      <td class="td-name">${mcImg('trident')}<span class="brainrot-name" style="color:${TRIDENTE_COLORS[i]};font-weight:700">${name}</span></td>
      <td class="num"><input type="number" class="qty-input tr-qty-input" data-trident="${escAttr(name)}" value="${qty}" min="0"></td>
      <td class="num"><input type="text" class="ch-val-input tr-input" data-trident="${escAttr(name)}" data-field="tokensP1" value="${escAttr(d.tokensP1 || '')}" placeholder="—"></td>
      <td class="num"><input type="text" class="ch-val-input tr-input" data-trident="${escAttr(name)}" data-field="coinsP1" value="${escAttr(d.coinsP1 || '')}" placeholder="—"></td>
      <td class="num token-val" data-tot-t>${totT !== null ? fmtBig(totT) : '—'}</td>
      <td class="num green-val"  data-tot-c>${totC !== null ? fmtBig(totC) : '—'}</td>
    </tr>`;
  });

  tbody.innerHTML = html;

  tfoot.innerHTML = `<tr class="chaves-total-row">
    <td colspan="4" style="color:#666;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;padding:10px 16px">Total</td>
    <td class="num token-val" data-trid-total-t>${hasTotalT ? fmtBig(totalT) : '—'}</td>
    <td class="num green-val"  data-trid-total-c>${hasTotalC ? fmtBig(totalC) : '—'}</td>
  </tr>`;

  tbody.querySelectorAll('.tr-input').forEach(input => {
    input.addEventListener('input', () => {
      const name  = input.dataset.trident;
      const field = input.dataset.field;
      const saved = trLoad();
      if (!saved[name]) saved[name] = { tokensP1: '', coinsP1: '', qty: 0 };
      saved[name][field] = input.value;
      trSave(saved);

      const row = tbody.querySelector(`tr[data-trident-row="${escAttr(name)}"]`);
      const d   = saved[name];
      const qty = parseInt(d.qty) || 0;
      const tP1 = parseNotation(d.tokensP1);
      const cP1 = parseNotation(d.coinsP1);
      row.querySelector('[data-tot-t]').textContent = tP1 > 0 ? fmtBig(tP1 * qty) : '—';
      row.querySelector('[data-tot-c]').textContent = cP1 > 0 ? fmtBig(cP1 * qty) : '—';
      recalcTridenteFooter(saved);
      renderChavesTable();
    });
  });

  tbody.querySelectorAll('.tr-qty-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const name = inp.dataset.trident;
      const val  = parseInt(inp.value);
      if (!isNaN(val) && val >= 0) {
        const saved = trLoad();
        if (!saved[name]) saved[name] = { tokensP1: '', coinsP1: '', qty: 0 };
        saved[name].qty = val;
        trSave(saved);
        renderTridentes();
      }
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
  });
}

function computeAllKeyEVs() {
  const keyNames     = new Set(_chavesData.map(k => k.name));
  const tridentNames = new Set(TRIDENTES);
  const trData       = trLoad();
  const evs = {};
  for (const key of _chavesData) evs[key.name] = { veT: 0, veC: 0 };

  for (let iter = 0; iter < 100; iter++) {
    const next = {};
    for (const key of _chavesData) {
      const saved = _chSaved[key.name] || {};
      const probs = calcProbs(key.items);
      let veT = 0, veC = 0;
      key.items.forEach((item, i) => {
        const prob = probs[i];
        const qty  = parseNotation(item.qty);
        if (keyNames.has(item.name)) {
          veT += prob * qty * evs[item.name].veT;
          veC += prob * qty * evs[item.name].veC;
        } else if (tridentNames.has(item.name)) {
          const tr = trData[item.name] || {};
          if (tr.tokensP1) veT += prob * qty * parseNotation(tr.tokensP1);
          if (tr.coinsP1)  veC += prob * qty * parseNotation(tr.coinsP1);
        } else {
          const s = (saved.items || {})[item.name] || {};
          if (s.valorT != null && s.valorT !== '') veT += prob * qty * parseNotation(s.valorT);
          if (s.valorC != null && s.valorC !== '') veC += prob * qty * parseNotation(s.valorC);
        }
      });
      next[key.name] = { veT, veC };
    }
    for (const k in next) evs[k] = next[k];
  }
  return evs;
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

const CHAVES_LS = 'chaves_data';
let _chavesData = [];
let _chSaved    = {};

function chLoad() {
  try { const v = localStorage.getItem(CHAVES_LS); return v ? JSON.parse(v) : {}; } catch { return {}; }
}
function chSave(data) { localStorage.setItem(CHAVES_LS, JSON.stringify(data)); }

function chKeyVE(key, allEvs) {
  const ev = allEvs[key.name] || { veT: 0, veC: 0 };
  return { veT: ev.veT > 0 ? ev.veT : null, veC: ev.veC > 0 ? ev.veC : null };
}

function renderChavesTable() {
  const tbody  = document.getElementById('chaves-tbody');
  const tfoot  = document.getElementById('chaves-tfoot');
  const allEvs = computeAllKeyEVs();

  let totalT = 0, totalC = 0, hasTotalT = false, hasTotalC = false;
  let html = '';

  for (const key of _chavesData) {
    const saved = _chSaved[key.name] || {};
    const qty   = saved.qty != null ? saved.qty : 0;
    const { veT, veC } = chKeyVE(key, allEvs);
    const totT  = veT !== null ? veT * qty : null;
    const totC  = veC !== null ? veC * qty : null;
    if (totT !== null) { totalT += totT; hasTotalT = true; }
    if (totC !== null) { totalC += totC; hasTotalC = true; }

    html += `<tr class="chave-row" data-key="${escAttr(key.name)}" style="cursor:pointer">
      <td class="td-name">${mcImg(key.icon)}<span class="brainrot-name">${key.name}</span></td>
      <td class="num"><input type="number" class="qty-input ch-qty-input" value="${qty}" min="0"></td>
      <td class="num token-val">${veT !== null ? fmtBig(veT) : '—'}</td>
      <td class="num green-val">${veC !== null ? fmtBig(veC) : '—'}</td>
      <td class="num token-val">${totT !== null ? fmtBig(totT) : '—'}</td>
      <td class="num green-val">${totC !== null ? fmtBig(totC) : '—'}</td>
      <td style="text-align:right"><button class="btn-itens">Itens</button></td>
    </tr>`;
  }

  if (_chavesData.length === 0) {
    html = `<tr><td colspan="7" style="color:#555;text-align:center;padding:20px">Nenhuma chave cadastrada.</td></tr>`;
  }

  tbody.innerHTML = html;

  tfoot.innerHTML = `<tr class="chaves-total-row">
    <td colspan="4" style="color:#666;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em">Total Geral</td>
    <td class="num token-val">${hasTotalT ? fmtBig(totalT) : '—'}</td>
    <td class="num green-val">${hasTotalC ? fmtBig(totalC) : '—'}</td>
    <td></td>
  </tr>`;

  tbody.querySelectorAll('.chave-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.ch-qty-input') || e.target.closest('.btn-itens')) return;
      openChavesModal(_chavesData.find(k => k.name === row.dataset.key));
    });
  });

  tbody.querySelectorAll('.btn-itens').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openChavesModal(_chavesData.find(k => k.name === btn.closest('tr').dataset.key));
    });
  });

  tbody.querySelectorAll('.ch-qty-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const keyName = inp.closest('tr').dataset.key;
      const val = parseInt(inp.value);
      if (!isNaN(val) && val >= 0) {
        if (!_chSaved[keyName]) _chSaved[keyName] = { qty: 0, items: {} };
        _chSaved[keyName].qty = val;
        chSave(_chSaved);
        renderChavesTable();
      }
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
  });
}

function openChavesModal(key) {
  if (!key) return;
  const modal        = document.getElementById('chaves-modal');
  const keyNames     = new Set(_chavesData.map(k => k.name));
  const tridentNames = new Set(TRIDENTES);
  const trData       = trLoad();
  document.getElementById('chaves-modal-title').textContent = key.name;

  const tbody  = document.getElementById('chaves-items-tbody');
  const probs  = calcProbs(key.items);
  const saved  = _chSaved[key.name] || {};
  const allEvs = computeAllKeyEVs();
  const last   = key.items.length - 1;

  let html = '';
  key.items.forEach((item, i) => {
    const prob      = probs[i];
    const qty       = parseNotation(item.qty);
    const isKey     = keyNames.has(item.name);
    const isTrident = tridentNames.has(item.name);
    const oddTd     = `${item.odd}%`;

    let valorTd, valorCd, veT, veC;
    if (isKey) {
      const refEv = allEvs[item.name] || { veT: 0, veC: 0 };
      valorTd = `<span class="ch-key-val" data-valor-t>${refEv.veT > 0 ? fmtBig(refEv.veT) : '—'}</span>`;
      valorCd = `<span class="ch-key-val" data-valor-c>${refEv.veC > 0 ? fmtBig(refEv.veC) : '—'}</span>`;
      veT     = refEv.veT > 0 ? fmtBig(prob * qty * refEv.veT) : '—';
      veC     = refEv.veC > 0 ? fmtBig(prob * qty * refEv.veC) : '—';
    } else if (isTrident) {
      const tr  = trData[item.name] || {};
      const tP1 = parseNotation(tr.tokensP1);
      const cP1 = parseNotation(tr.coinsP1);
      valorTd = `<span class="ch-key-val" data-valor-t>${tP1 > 0 ? fmtBig(tP1) : '—'}</span>`;
      valorCd = `<span class="ch-key-val" data-valor-c>${cP1 > 0 ? fmtBig(cP1) : '—'}</span>`;
      veT     = tP1 > 0 ? fmtBig(prob * qty * tP1) : '—';
      veC     = cP1 > 0 ? fmtBig(prob * qty * cP1) : '—';
    } else {
      const s    = (saved.items || {})[item.name] || {};
      const hasT = s.valorT != null && s.valorT !== '';
      const hasC = s.valorC != null && s.valorC !== '';
      valorTd = `<input type="text" class="ch-val-input" data-field="valorT" value="${escAttr(s.valorT || '')}" placeholder="—">`;
      valorCd = `<input type="text" class="ch-val-input" data-field="valorC" value="${escAttr(s.valorC || '')}" placeholder="—">`;
      veT     = hasT ? fmtBig(prob * qty * parseNotation(s.valorT)) : '—';
      veC     = hasC ? fmtBig(prob * qty * parseNotation(s.valorC)) : '—';
    }

    html += `<tr data-key="${escAttr(key.name)}" data-item="${escAttr(item.name)}" data-idx="${i}">
      <td class="td-name">${mcImg(item.icon)}<span class="brainrot-name">${item.name}</span></td>
      <td class="num muted-val">${oddTd}</td>
      <td class="num muted-val">${fmtBig(qty)}</td>
      <td class="num">${valorTd}</td>
      <td class="num">${valorCd}</td>
      <td class="num token-val" data-ve-t>${veT}</td>
      <td class="num green-val"  data-ve-c>${veC}</td>
    </tr>`;
  });

  tbody.innerHTML = html;
  modal.classList.add('open');

  tbody.querySelectorAll('.ch-val-input').forEach(input => {
    input.addEventListener('input', () => {
      const row      = input.closest('tr');
      const keyName  = row.dataset.key;
      const itemName = row.dataset.item;
      const field    = input.dataset.field;

      if (!_chSaved[keyName])                    _chSaved[keyName]               = { qty: 0, items: {} };
      if (!_chSaved[keyName].items)              _chSaved[keyName].items         = {};
      if (!_chSaved[keyName].items[itemName])    _chSaved[keyName].items[itemName] = {};
      _chSaved[keyName].items[itemName][field] = input.value;
      chSave(_chSaved);

      const newEvs = computeAllKeyEVs();
      updateModalVEs(key, newEvs);
      renderChavesTable();
    });
  });
}

function updateModalVEs(key, allEvs) {
  const tbody        = document.getElementById('chaves-items-tbody');
  if (!tbody) return;
  const keyNames     = new Set(_chavesData.map(k => k.name));
  const tridentNames = new Set(TRIDENTES);
  const trData       = trLoad();
  const probs        = calcProbs(key.items);
  const saved        = _chSaved[key.name] || {};

  key.items.forEach((item, i) => {
    const row = tbody.querySelector(`tr[data-idx="${i}"]`);
    if (!row) return;
    const prob = probs[i];
    const qty  = parseNotation(item.qty);

    if (keyNames.has(item.name)) {
      const refEv = allEvs[item.name] || { veT: 0, veC: 0 };
      row.querySelector('[data-valor-t]').textContent = refEv.veT > 0 ? fmtBig(refEv.veT) : '—';
      row.querySelector('[data-valor-c]').textContent = refEv.veC > 0 ? fmtBig(refEv.veC) : '—';
      row.querySelector('[data-ve-t]').textContent    = refEv.veT > 0 ? fmtBig(prob * qty * refEv.veT) : '—';
      row.querySelector('[data-ve-c]').textContent    = refEv.veC > 0 ? fmtBig(prob * qty * refEv.veC) : '—';
    } else if (tridentNames.has(item.name)) {
      const tr  = trData[item.name] || {};
      const tP1 = parseNotation(tr.tokensP1);
      const cP1 = parseNotation(tr.coinsP1);
      row.querySelector('[data-valor-t]').textContent = tP1 > 0 ? fmtBig(tP1) : '—';
      row.querySelector('[data-valor-c]').textContent = cP1 > 0 ? fmtBig(cP1) : '—';
      row.querySelector('[data-ve-t]').textContent    = tP1 > 0 ? fmtBig(prob * qty * tP1) : '—';
      row.querySelector('[data-ve-c]').textContent    = cP1 > 0 ? fmtBig(prob * qty * cP1) : '—';
    } else {
      const s    = (saved.items || {})[item.name] || {};
      const hasT = s.valorT != null && s.valorT !== '';
      const hasC = s.valorC != null && s.valorC !== '';
      row.querySelector('[data-ve-t]').textContent = hasT ? fmtBig(prob * qty * parseNotation(s.valorT)) : '—';
      row.querySelector('[data-ve-c]').textContent = hasC ? fmtBig(prob * qty * parseNotation(s.valorC)) : '—';
    }
  });
}

function initChaves(chaves) {
  _chavesData = chaves;
  _chSaved    = chLoad();

  let dirty = false;
  for (const key of _chavesData) {
    for (const item of key.items) {
      if (item.icon === 'horn_coral' && item.name.includes('Tokens')) {
        if (!_chSaved[key.name])                      _chSaved[key.name]               = { qty: 0, items: {} };
        if (!_chSaved[key.name].items)                _chSaved[key.name].items         = {};
        if (!_chSaved[key.name].items[item.name])     _chSaved[key.name].items[item.name] = {};
        if (!_chSaved[key.name].items[item.name].valorT) {
          _chSaved[key.name].items[item.name].valorT = '1';
          dirty = true;
        }
      }
    }
  }
  if (dirty) chSave(_chSaved);

  renderChavesTable();
  renderTridentes();

  const modal = document.getElementById('chaves-modal');
  document.getElementById('chaves-modal-close').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  const infoModal = document.getElementById('chaves-info-modal');
  const openInfo  = () => infoModal.classList.add('open');
  document.getElementById('chaves-info-btn').addEventListener('click', openInfo);
  document.getElementById('chaves-info-close').addEventListener('click', () => infoModal.classList.remove('open'));
  infoModal.addEventListener('click', e => { if (e.target === infoModal) infoModal.classList.remove('open'); });

  document.querySelector('.nav-btn[data-view="chaves"]').addEventListener('click', () => {
    if (!localStorage.getItem('chaves_info_seen')) {
      localStorage.setItem('chaves_info_seen', '1');
      openInfo();
    }
  });
}

async function init() {
  const [brainrots, rebirths, porretes, chaves] = await Promise.all([
    fetch('data/brainrots.json').then(r => r.json()),
    fetch('data/rebirths.json').then(r => r.json()),
    fetch('data/porretes.json').then(r => r.json()),
    fetch('data/chaves.json').then(r => r.json()),
  ]);

  const coinBrainrots = brainrots.filter(b => b.currency !== 'rubi');
  const rubiBrainrots = brainrots.filter(b => b.currency === 'rubi');

  renderBrainrotTable('coins-table-wrap', coinBrainrots, brainrotSort, 'coins');
  renderBrainrotTable('rubi-table-wrap',  rubiBrainrots, rubiSort,     'rubi');
  renderRebirths(rebirths);
  renderPorretes(porretes);
  initMeusbrainrots(brainrots, rebirths);
  initChaves(chaves);

  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  const tipModal  = document.getElementById('tip-modal');
  const tipBtn    = document.getElementById('tip-btn');
  const closeBtn  = document.getElementById('tip-close');

  tipBtn.addEventListener('click', () => tipModal.classList.add('open'));
  closeBtn.addEventListener('click', () => tipModal.classList.remove('open'));
  tipModal.addEventListener('click', e => { if (e.target === tipModal) tipModal.classList.remove('open'); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    tipModal.classList.remove('open');
    document.getElementById('mb-modal').classList.remove('open');
    document.getElementById('chaves-modal').classList.remove('open');
    document.getElementById('chaves-info-modal').classList.remove('open');
    document.querySelectorAll('#mb-tbody .qty-form:not(.hidden)').forEach(form => {
      form.classList.add('hidden');
      form.previousElementSibling.classList.remove('hidden');
    });
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.copy);
      const orig = btn.textContent;
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
    });
  });
}

// Floating tooltip — escapes overflow:hidden containers
const _floatingTip = document.createElement('div');
_floatingTip.id = 'floating-tip';
document.body.appendChild(_floatingTip);

document.addEventListener('mouseover', e => {
  const icon = e.target.closest('.info-icon');
  if (!icon) return;
  _floatingTip.textContent = icon.dataset.tip;
  _floatingTip.style.display = 'block';
  const r = icon.getBoundingClientRect();
  let left = r.left + r.width / 2 - _floatingTip.offsetWidth / 2;
  left = Math.min(left, window.innerWidth - _floatingTip.offsetWidth - 8);
  left = Math.max(left, 8);
  _floatingTip.style.left = left + 'px';
  _floatingTip.style.top  = (r.bottom + 6) + 'px';
});

document.addEventListener('mouseout', e => {
  if (e.target.closest('.info-icon')) _floatingTip.style.display = 'none';
});

init();
