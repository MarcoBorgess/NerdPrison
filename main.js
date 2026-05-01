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

async function init() {
  const [brainrots, rebirths, porretes] = await Promise.all([
    fetch('data/brainrots.json').then(r => r.json()),
    fetch('data/rebirths.json').then(r => r.json()),
    fetch('data/porretes.json').then(r => r.json()),
  ]);

  const coinBrainrots = brainrots.filter(b => b.currency !== 'rubi');
  const rubiBrainrots = brainrots.filter(b => b.currency === 'rubi');

  renderBrainrotTable('coins-table-wrap', coinBrainrots, brainrotSort, 'coins');
  renderBrainrotTable('rubi-table-wrap',  rubiBrainrots, rubiSort,     'rubi');
  renderRebirths(rebirths);
  renderPorretes(porretes);
  initMeusbrainrots(brainrots, rebirths);

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
