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
  if (a >= 1e27) return (n / 1e27).toFixed(1).replace(/\.0$/, '') + 'OC';
  if (a >= 1e24) return (n / 1e24).toFixed(1).replace(/\.0$/, '') + 'SS';
  if (a >= 1e21) return (n / 1e21).toFixed(1).replace(/\.0$/, '') + 'S';
  if (a >= 1e18) return (n / 1e18).toFixed(1).replace(/\.0$/, '') + 'QQ';
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
  if (a >= 1e27) return (n / 1e27).toFixed(2).replace(/\.00$/, '') + 'OC';
  if (a >= 1e24) return (n / 1e24).toFixed(2).replace(/\.00$/, '') + 'SS';
  if (a >= 1e21) return (n / 1e21).toFixed(2).replace(/\.00$/, '') + 'S';
  if (a >= 1e18) return (n / 1e18).toFixed(2).replace(/\.00$/, '') + 'QQ';
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
      <td class="num ${costCls}"><span class="cost-clickable" data-buy="${b.buyValue}" data-name="${b.name}">${fmt(b.buyValue)}</span><button class="cost-info-btn" data-buy="${b.buyValue}" data-name="${b.name}" title="Custo na esteira">i</button></td>
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

  wrap.querySelectorAll('.cost-clickable, .cost-info-btn').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      openEsteiraModal(parseFloat(el.dataset.buy), el.dataset.name);
    });
  });
}

function openEsteiraModal(buyValue, name) {
  const modal = document.getElementById('esteira-modal');
  document.getElementById('esteira-modal-title').textContent = name;
  const tbody = document.getElementById('esteira-tbody');
  let html = '';
  for (let i = 0; i < 10; i++) {
    const cost = buyValue * Math.pow(1.5, i);
    html += `<tr>
      <td class="esteira-click-num">${i + 1}º clique</td>
      <td class="num esteira-cost-val">${fmt2(cost)}</td>
    </tr>`;
  }
  tbody.innerHTML = html;
  modal.classList.add('open');
}

function rubiSuffix(rubiAmt) {
  if (!rubiAmt) return '';
  return ` <span class="rubi-plus">+</span> <span class="rubi-val">${fmt(rubiAmt)}</span>`;
}

function renderRebirths(data) {
  const wrap = document.getElementById('rebirths-table-wrap');
  let cumulative = 0;
  let rubiCumulative = 0;

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
    const rubiCost = r.costOfNeededBrainrotsRubi || 0;
    const total = r.cost + r.costOfNeededBrainrots;
    cumulative += total;
    rubiCumulative += rubiCost;
    html += `<tr>
      <td>${r.level}</td>
      <td class="num token-val">x${r.tokensMultiplier.toFixed(1)}</td>
      <td class="num green-val">x${r.coinsMultiplier.toFixed(1)}</td>
      <td class="num muted-val">${fmt(r.cost)}</td>
      <td class="num muted-val">${fmt(r.costOfNeededBrainrots)}${rubiSuffix(rubiCost)}</td>
      <td class="num green-val">${fmt(total)}${rubiSuffix(rubiCost)}</td>
      <td class="num dark-green-val">${fmt(cumulative)}${rubiSuffix(rubiCumulative)}</td>
      <td class="brainrots-needed">${r.neededBrainrots.replace(/\n/g, '<br>')}</td>
    </tr>`;
  }

  html += '</tbody></table></div></div>';
  wrap.innerHTML = html;
}

// ── Porretes ─────────────────────────────────────────────────────────────────

let _porretesData = [];

const PORRETES_LS = 'porretes_data';
function prLoad() {
  try { const v = localStorage.getItem(PORRETES_LS); return v ? JSON.parse(v) : { tokensBase: null, coinsBase: null, qty: {} }; } catch { return { tokensBase: null, coinsBase: null, qty: {} }; }
}
function prSave(d) { localStorage.setItem(PORRETES_LS, JSON.stringify(d)); }

function prFindNextTarget(qty) {
  let highest = 0;
  for (const p of _porretesData) {
    if ((qty[p.level] || 0) > 0 && p.level > highest) highest = p.level;
  }
  const nextLevel = Math.max(highest + 1, 2);
  return _porretesData.find(p => p.level === nextLevel) || null;
}

function prCalcMissing(targetLevel, qty) {
  const inv = {};
  for (const p of _porretesData) inv[p.level] = qty[p.level] || 0;
  const toAcquire = {};

  // Recursively produce `count` items at `level`, using inv + buying what's missing.
  // Buys at the lowest possible level that still has inventory (to use partial sets),
  // then falls back to buying directly at `level` for what can't be chained.
  function produce(level, count) {
    if (count <= 0) return;

    // Consume existing inventory first
    const use = Math.min(inv[level] || 0, count);
    inv[level] = (inv[level] || 0) - use;
    let still = count - use;
    if (!still) return;

    if (level === 1) {
      toAcquire[1] = (toAcquire[1] || 0) + still;
      return;
    }

    // For each unit still needed, try to chain from lower inventory (one at a time)
    let chained = 0;
    for (let i = 0; i < still; i++) {
      // Check if any lower level has inventory left
      let hasBelow = false;
      for (let l = level - 1; l >= 1; l--) {
        if ((inv[l] || 0) > 0) { hasBelow = true; break; }
      }
      if (!hasBelow) break;
      // Build 1 unit at `level` from 3 units at `level-1`
      produce(level - 1, 3);
      chained++;
    }
    still -= chained;

    // Remaining units: buy directly at this level
    if (still > 0) toAcquire[level] = (toAcquire[level] || 0) + still;
  }

  produce(targetLevel - 1, 3);
  return toAcquire;
}

function renderPorretesCard() {
  const el = document.getElementById('porretes-card-wrap');
  if (!el) return;
  const saved = prLoad();
  const qty   = saved.qty || {};
  const target = prFindNextTarget(qty);
  if (!target) { el.innerHTML = ''; return; }
  const missing = prCalcMissing(target.level, qty);
  const entries = Object.entries(missing).filter(([, v]) => v > 0).sort(([a], [b]) => Number(b) - Number(a));
  const tooltipText = entries.length
    ? entries.map(([lvl, cnt]) => { const p = _porretesData.find(x => x.level === Number(lvl)); return p ? `${cnt}× Nível ${lvl} - ${p.name}` : ''; }).filter(Boolean).join('\n')
    : 'Nenhum item necessário';
  let tokensNeeded = null, coinsNeeded = null;
  if (saved.tokensBase != null) tokensNeeded = entries.reduce((s, [lvl, cnt]) => { const p = _porretesData.find(x => x.level === Number(lvl)); return s + (p ? cnt * saved.tokensBase * p.level1Equivalents : 0); }, 0);
  if (saved.coinsBase  != null) coinsNeeded  = entries.reduce((s, [lvl, cnt]) => { const p = _porretesData.find(x => x.level === Number(lvl)); return s + (p ? cnt * saved.coinsBase  * p.level1Equivalents : 0); }, 0);
  el.innerHTML = `<div class="pnc-wrap">
    <div class="pnc-item">
      <span class="pnc-label">Próximo Nível</span>
      <span class="pnc-value">${mcImg(target.icon)}<strong>${target.level} - ${target.name}</strong></span>
    </div>
    <div class="pnc-sep"></div>
    <div class="pnc-item">
      <span class="pnc-label">Ainda Faltam <span class="pnc-info-btn" data-tooltip="${escAttr(tooltipText)}">i</span></span>
      <span class="pnc-amounts">
        <span class="pnc-amt"><span class="pnc-amt-label">Tokens</span><span class="token-val">${tokensNeeded != null ? fmtBig(tokensNeeded) : '—'}</span></span>
        <span class="pnc-amt"><span class="pnc-amt-label">Coins</span><span class="green-val">${coinsNeeded != null ? fmtBig(coinsNeeded) : '—'}</span></span>
      </span>
    </div>
  </div>`;
}

function prUpdateRow(level, saved) {
  const wrap = document.getElementById('porretes-table-wrap');
  if (!wrap) return;
  const p = _porretesData.find(x => x.level === level);
  if (!p) return;
  const q    = (saved.qty || {})[level] || 0;
  const tokV = saved.tokensBase != null ? saved.tokensBase * p.level1Equivalents : null;
  const coiV = saved.coinsBase  != null ? saved.coinsBase  * p.level1Equivalents : null;
  const totT = tokV != null ? tokV * q : null;
  const totC = coiV != null ? coiV * q : null;
  const row  = wrap.querySelector(`.pr-qty-input[data-level="${level}"]`)?.closest('tr');
  if (!row) return;
  row.querySelector('[data-pr-tot-t]').textContent = totT != null ? fmtBig(totT) : '—';
  row.querySelector('[data-pr-tot-c]').textContent = totC != null ? fmtBig(totC) : '—';
}

function prUpdateFooter(saved) {
  const qty = saved.qty || {};
  let tT = 0, tC = 0, hT = false, hC = false;
  for (const p of _porretesData) {
    const q = qty[p.level] || 0;
    if (saved.tokensBase != null && q > 0) { tT += saved.tokensBase * p.level1Equivalents * q; hT = true; }
    if (saved.coinsBase  != null && q > 0) { tC += saved.coinsBase  * p.level1Equivalents * q; hC = true; }
  }
  const fT = document.getElementById('pr-footer-t');
  const fC = document.getElementById('pr-footer-c');
  if (fT) fT.textContent = hT ? fmtBig(tT) : '—';
  if (fC) fC.textContent = hC ? fmtBig(tC) : '—';
}

function renderPorretes(data) {
  _porretesData = data;
  const wrap  = document.getElementById('porretes-table-wrap');
  const saved = prLoad();
  const qty   = saved.qty || {};

  let html = `<div class="brainrots-card"><div class="table-scroll"><table class="porretes-table"><thead><tr>
    <th>Item</th>
    <th>Mob ♥ HP ⚔ Hits</th>
    <th class="num">Dano</th>
    <th class="num">Rubi Base</th>
    <th class="num">Equiv. Nível 1</th>
    <th class="num">Qtd</th>
    <th class="num">Tokens / 1</th>
    <th class="num">Coins / 1</th>
    <th class="num">Total T</th>
    <th class="num">Total C</th>
  </tr></thead><tbody>`;

  let tT = 0, tC = 0, hT = false, hC = false;
  for (let i = 0; i < data.length; i++) {
    const p    = data[i];
    const prev = data[i - 1];
    const q    = qty[p.level] || 0;
    const tokV = saved.tokensBase != null ? saved.tokensBase * p.level1Equivalents : null;
    const coiV = saved.coinsBase  != null ? saved.coinsBase  * p.level1Equivalents : null;
    const totT = tokV != null ? tokV * q : null;
    const totC = coiV != null ? coiV * q : null;
    if (totT != null && q > 0) { tT += totT; hT = true; }
    if (totC != null && q > 0) { tC += totC; hC = true; }
    html += `<tr>
      <td class="td-name">${mcImg(p.icon)}<span class="brainrot-name">${p.level} - ${p.name}</span></td>
      <td>${p.mob ? `${p.mob}${p.hp != null ? ` <span class="hp-tag">♥ ${p.hp}</span>` : ''}${p.hp != null && p.damage != null ? ` <span class="hits-tag">⚔ ${Math.ceil(p.hp / p.damage)} Hits</span>` : ''}` : '—'}</td>
      <td class="num">${p.damage ?? '—'}</td>
      <td class="num rubi-val">${p.rubiBase != null ? fmt2(p.rubiBase) + (prev?.rubiBase != null ? ` <span class="rubi-pct">(+${((p.rubiBase / prev.rubiBase - 1) * 100).toFixed(0)}%)</span>` : '') : '—'}</td>
      <td class="num">${fmtFull(p.level1Equivalents)}</td>
      <td class="num"><input type="number" class="qty-input pr-qty-input" data-level="${p.level}" value="${q}" min="0"></td>
      <td class="num"><input type="text" class="ch-val-input pr-tok-input" data-level="${p.level}" value="${tokV != null ? fmtBig(tokV) : ''}" placeholder="—"></td>
      <td class="num"><input type="text" class="ch-val-input pr-coi-input" data-level="${p.level}" value="${coiV != null ? fmtBig(coiV) : ''}" placeholder="—"></td>
      <td class="num token-val" data-pr-tot-t>${totT != null ? fmtBig(totT) : '—'}</td>
      <td class="num green-val"  data-pr-tot-c>${totC != null ? fmtBig(totC) : '—'}</td>
    </tr>`;
  }

  html += `</tbody><tfoot><tr class="chaves-total-row">
    <td colspan="8" style="color:#666;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;padding:10px 16px">Total Geral</td>
    <td class="num token-val" id="pr-footer-t">${hT ? fmtBig(tT) : '—'}</td>
    <td class="num green-val"  id="pr-footer-c">${hC ? fmtBig(tC) : '—'}</td>
  </tr></tfoot></table></div></div>`;

  wrap.innerHTML = html;
  renderPorretesCard();

  wrap.querySelectorAll('.pr-qty-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const lvl = parseInt(inp.dataset.level);
      const val = parseInt(inp.value);
      if (isNaN(val) || val < 0) return;
      const s = prLoad();
      if (!s.qty) s.qty = {};
      s.qty[lvl] = val;
      prSave(s);
      prUpdateRow(lvl, s);
      prUpdateFooter(s);
      renderPorretesCard();
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
  });

  wrap.querySelectorAll('.pr-tok-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const lvl = parseInt(inp.dataset.level);
      const p   = _porretesData.find(x => x.level === lvl);
      if (!p) return;
      const val = parseNotation(inp.value);
      const s   = prLoad();
      s.tokensBase = val > 0 ? val / p.level1Equivalents : null;
      prSave(s);
      for (const pd of _porretesData) {
        if (pd.level === lvl) continue;
        const el = wrap.querySelector(`.pr-tok-input[data-level="${pd.level}"]`);
        if (el) el.value = s.tokensBase != null ? fmtBig(s.tokensBase * pd.level1Equivalents) : '';
        prUpdateRow(pd.level, s);
      }
      prUpdateRow(lvl, s);
      prUpdateFooter(s);
      renderPorretesCard();
      renderChavesTable();
    });
  });

  wrap.querySelectorAll('.pr-coi-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const lvl = parseInt(inp.dataset.level);
      const p   = _porretesData.find(x => x.level === lvl);
      if (!p) return;
      const val = parseNotation(inp.value);
      const s   = prLoad();
      s.coinsBase = val > 0 ? val / p.level1Equivalents : null;
      prSave(s);
      for (const pd of _porretesData) {
        if (pd.level === lvl) continue;
        const el = wrap.querySelector(`.pr-coi-input[data-level="${pd.level}"]`);
        if (el) el.value = s.coinsBase != null ? fmtBig(s.coinsBase * pd.level1Equivalents) : '';
        prUpdateRow(pd.level, s);
      }
      prUpdateRow(lvl, s);
      prUpdateFooter(s);
      renderPorretesCard();
      renderChavesTable();
    });
  });
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
  let rubiAfk = 0, rubiWorld = 0, rubiEvent = 0;
  for (const e of _mbLoadout) {
    const b = map[e.name];
    if (!b) continue;
    const cps = b.valuePerSec || 0;
    if (b.currency === 'rubi') {
      rubiAfk   += cps * cm * vip.bonus * vip.afkDebuff * e.qty;
      rubiWorld += cps * cm * vip.bonus * bst * e.qty;
      rubiEvent += cps * cm * vip.bonus * bst * evt * e.qty;
    } else {
      afk   += cps * cm * vip.bonus * vip.afkDebuff * e.qty;
      world += cps * cm * vip.bonus * bst * e.qty;
      event += cps * cm * vip.bonus * bst * evt * e.qty;
    }
  }
  return { afk, world, event, rubiAfk, rubiWorld, rubiEvent };
}

function mbRenderCards() {
  const c = document.getElementById('mb-cards');
  const vip = _mbVip(), bst = _mbBooster(), evt = _mbEvent();
  const level = _mbLevel;
  const cur  = _mbRebirth();
  const next = _mbRebirths.find(r => r.level === level + 1) || null;
  const { afk, world, event, rubiAfk, rubiWorld, rubiEvent } = _mbTotals();

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
      <div class="mb-card-title"><span>AFK <span class="mb-multi-hint">· ${vip.label}</span></span><span class="info-icon" style="margin-left:0" data-tip="Coins/s × Rebirth × VIP bônus × AFK debuff\n\nRebirth: ${_mbCoinsMulti()}x\nVIP bônus: +${Math.round((vip.bonus - 1) * 100)}%\nAFK debuff: -${Math.round((1 - vip.afkDebuff) * 100)}%">i</span></div>
      <div class="mb-gen-rows">
        <div class="mb-gen-row"><span>/ s</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(afk)}</strong>${rubiAfk > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiAfk)}</strong>` : ''}</div></div>
        <div class="mb-gen-row"><span>/ m</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(afk * 60)}</strong>${rubiAfk > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiAfk * 60)}</strong>` : ''}</div></div>
        <div class="mb-gen-row"><span>/ h</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(afk * 3600)}</strong>${rubiAfk > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiAfk * 3600)}</strong>` : ''}</div></div>
        <div class="mb-gen-row"><span>/ d</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(afk * 86400)}</strong>${rubiAfk > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiAfk * 86400)}</strong>` : ''}</div></div>
      </div>
    </div>
    <div class="mb-card">
      <div class="mb-card-title"><span>Mundo <span class="mb-multi-hint">· ${bst}x</span></span><span class="info-icon" style="margin-left:0" data-tip="Coins/s × Rebirth × VIP bônus × Booster\n\nRebirth: ${_mbCoinsMulti()}x\nVIP bônus: +${Math.round((vip.bonus - 1) * 100)}%\nBooster: ${bst}x">i</span></div>
      <div class="mb-gen-rows">
        <div class="mb-gen-row"><span>/ s</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(world)}</strong>${rubiWorld > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiWorld)}</strong>` : ''}</div></div>
        <div class="mb-gen-row"><span>/ m</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(world * 60)}</strong>${rubiWorld > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiWorld * 60)}</strong>` : ''}</div></div>
        <div class="mb-gen-row"><span>/ h</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(world * 3600)}</strong>${rubiWorld > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiWorld * 3600)}</strong>` : ''}</div></div>
        <div class="mb-gen-row"><span>/ d</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(world * 86400)}</strong>${rubiWorld > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiWorld * 86400)}</strong>` : ''}</div></div>
      </div>
    </div>
    <div class="mb-card">
      <div class="mb-card-title"><span>Evento <span class="mb-multi-hint">· ${bst}x · ${evt}x</span></span><span class="info-icon" style="margin-left:0" data-tip="Coins/s × Rebirth × VIP bônus × Booster × Multi Evento\n\nRebirth: ${_mbCoinsMulti()}x\nVIP bônus: +${Math.round((vip.bonus - 1) * 100)}%\nBooster: ${bst}x\nMulti Evento: ${evt}x">i</span></div>
      <div class="mb-gen-rows">
        <div class="mb-gen-row"><span>/ s</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(event)}</strong>${rubiEvent > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiEvent)}</strong>` : ''}</div></div>
        <div class="mb-gen-row"><span>/ m</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(event * 60)}</strong>${rubiEvent > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiEvent * 60)}</strong>` : ''}</div></div>
        <div class="mb-gen-row"><span>/ h</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(event * 3600)}</strong>${rubiEvent > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiEvent * 3600)}</strong>` : ''}</div></div>
        <div class="mb-gen-row"><span>/ d</span><div class="mb-gen-vals"><strong class="val-afk">${fmt2(event * 86400)}</strong>${rubiEvent > 0 ? `<span class="muted-val">/</span><strong class="rubi-val">${fmt2(rubiEvent * 86400)}</strong>` : ''}</div></div>
      </div>
    </div>`;

  document.getElementById('mb-dec').addEventListener('click', () => {
    _mbLevel = Math.max(0, _mbLevel - 1);
    mbSave(MB_LS.REBIRTH, _mbLevel);
    mbRenderCards();
    mbRenderTable();
  });
  document.getElementById('mb-inc').addEventListener('click', () => {
    _mbLevel = Math.min(25, _mbLevel + 1);
    mbSave(MB_LS.REBIRTH, _mbLevel);
    mbRenderCards();
    mbRenderTable();
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
    const cps    = b.valuePerSec || 0;
    const qty    = e.qty;
    const isRubi = b.currency === 'rubi';
    const afkPs  = cps * cm * vip.bonus * vip.afkDebuff * qty;
    const evtPs  = cps * cm * vip.bonus * bst * evt * qty;
    const color  = RARITY_COLORS[b.rarity] || '#e0e0e0';
    const idx    = _mbLoadout.indexOf(e);
    const cstCls = isRubi ? 'rubi-val' : 'green-val';
    const afkCls = isRubi ? 'rubi-val' : 'val-afk';
    const evtCls = isRubi ? 'rubi-event-val' : 'val-event';
    html += `<tr data-idx="${idx}">
      <td><div class="td-name-flex">${mobFace(b.icon)}<span class="brainrot-name" style="color:${color};font-weight:700">${b.name}</span></div></td>
      <td class="num qty-cell">
        <span class="qty-display">${qty}</span>
        <span class="qty-form hidden">
          <input type="number" class="qty-input" value="${qty}" min="0">
          <button class="qty-confirm">✓</button>
        </span>
      </td>
      <td class="num ${cstCls}">${fmt2(b.buyValue * qty)}</td>
      <td class="num ${afkCls}">${fmt2(afkPs)}</td>
      <td class="num ${evtCls}">${fmt2(evtPs)}</td>
      <td class="num ${afkCls}">${fmt2(afkPs * 60)}</td>
      <td class="num ${evtCls}">${fmt2(evtPs * 60)}</td>
      <td class="num ${afkCls}">${fmt2(afkPs * 3600)}</td>
      <td class="num ${evtCls}">${fmt2(evtPs * 3600)}</td>
      <td class="num ${afkCls}">${fmt2(afkPs * 86400)}</td>
      <td class="num ${evtCls}">${fmt2(evtPs * 86400)}</td>
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
    if (!isNaN(val) && val >= 0) {
      if (val === 0) {
        _mbLoadout.splice(idx, 1);
      } else {
        _mbLoadout[idx].qty = val;
      }
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

function mbInitAddDropdown() {
  const trigger  = document.getElementById('mb-add-trigger');
  const face     = document.getElementById('mb-add-face');
  const text     = document.getElementById('mb-add-text');
  const opts     = document.getElementById('mb-add-opts');
  const rarities = ['Mítico', 'Lendário', 'Raro', 'Incomum', 'Comum'];
  const coinBrainrots = _mbBrainrots.filter(b => b.currency !== 'rubi');
  const rubisBrainrots = _mbBrainrots.filter(b => b.currency === 'rubi');

  function buildGroup(list, prefix) {
    let html = '';
    for (const rarity of rarities) {
      const group = list.filter(b => b.rarity === rarity)
        .sort((a, b) => (b.valuePerSec || 0) - (a.valuePerSec || 0));
      if (!group.length) continue;
      const color = RARITY_COLORS[rarity] || '#aaa';
      html += `<div class="mb-add-opt-group" style="color:${color}">${prefix}${rarity}</div>`;
      for (const b of group) {
        html += `<div class="mb-add-opt" data-name="${escAttr(b.name)}">${mobFace(b.icon)}<span>${b.name}</span></div>`;
      }
    }
    return html;
  }

  opts.innerHTML = buildGroup(coinBrainrots, '') + buildGroup(rubisBrainrots, 'Rubi — ');

  function reset() {
    face.innerHTML = '';
    text.textContent = 'Adicionar brainrot...';
    text.classList.remove('has-mob');
    opts.classList.add('hidden');
    trigger.classList.remove('open');
  }

  function openOpts()  { opts.classList.remove('hidden'); trigger.classList.add('open'); }
  function closeOpts() { opts.classList.add('hidden');    trigger.classList.remove('open'); }

  trigger.addEventListener('click', () => opts.classList.contains('hidden') ? openOpts() : closeOpts());

  opts.addEventListener('click', e => {
    const opt = e.target.closest('.mb-add-opt');
    if (!opt) return;
    const name = opt.dataset.name;
    const existing = _mbLoadout.find(e => e.name === name);
    if (existing) { existing.qty += 1; }
    else { _mbLoadout.push({ name, qty: 1 }); }
    mbSave(MB_LS.LOADOUT, _mbLoadout);
    mbRenderTable();
    mbRenderCards();
    reset();
  });

  document.addEventListener('click', e => {
    if (!document.getElementById('mb-add-dropdown').contains(e.target)) closeOpts();
  });
}

function initMeusbrainrots(brainrots, rebirths) {
  _mbBrainrots = brainrots;
  _mbRebirths  = rebirths;
  _mbLevel     = mbLoad(MB_LS.REBIRTH, 0);
  _mbConfig    = mbLoad(MB_LS.CONFIG, { vip: 'none', booster: 3.50, eventMulti: 3.50 });
  _mbLoadout   = mbLoad(MB_LS.LOADOUT, []);

  mbRenderCards();
  mbRenderTable();
  mbInitAddDropdown();

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

  initCalcCompra();
}

// ── Calculadora de Compra ────────────────────────────────────────────────────

function initCalcCompra() {
  const vipSel      = document.getElementById('cc-vip');
  const rebirthSel  = document.getElementById('cc-rebirth');
  const boosterInp  = document.getElementById('cc-booster');
  const costInp     = document.getElementById('cc-cost');
  const afkInp      = document.getElementById('cc-afk-h');
  const mundoInp    = document.getElementById('cc-mundo-h');
  const eventosInp  = document.getElementById('cc-eventos');
  const evMultiInp  = document.getElementById('cc-evento-multi');
  const result      = document.getElementById('cc-result-rows');
  const vipBuffEl   = document.getElementById('cc-vip-buff');
  const vipDebuffEl = document.getElementById('cc-vip-debuff');
  const trigger     = document.getElementById('cc-mob-trigger');
  const triggerFace = document.getElementById('cc-mob-trigger-face');
  const triggerText = document.getElementById('cc-mob-trigger-text');
  const optsPanel   = document.getElementById('cc-mob-opts');
  let   _ccMob      = '';

  // Set rebirth input bounds
  const maxRebirth = _mbRebirths.length > 0 ? _mbRebirths[_mbRebirths.length - 1].level : 25;
  rebirthSel.max = maxRebirth;

  function addSpinner(input) {
    const wrap = document.createElement('div');
    wrap.className = 'cc-spin-wrap';
    input.parentNode.insertBefore(wrap, input);
    const btns = document.createElement('div');
    btns.className = 'cc-spin-btns';
    const up = document.createElement('button');
    const dn = document.createElement('button');
    up.type = dn.type = 'button';
    up.className = dn.className = 'cc-spin-btn';
    up.tabIndex = dn.tabIndex = -1;
    up.textContent = '▲';
    dn.textContent = '▼';
    btns.appendChild(up);
    btns.appendChild(dn);
    wrap.appendChild(btns);
    wrap.appendChild(input);
    input.addEventListener('click', () => input.select());
    up.addEventListener('pointerdown', e => {
      e.preventDefault();
      input.stepUp();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    dn.addEventListener('pointerdown', e => {
      e.preventDefault();
      input.stepDown();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  [rebirthSel, boosterInp, afkInp, mundoInp, eventosInp, evMultiInp].forEach(addSpinner);

  // Build custom mob dropdown — coins only, grouped by rarity descending
  const coinBrainrots = _mbBrainrots.filter(b => b.currency !== 'rubi');
  const rarities = ['Mítico', 'Lendário', 'Raro', 'Incomum', 'Comum'];
  const RARITY_COLORS_CC = { 'Mítico':'#FF55FF','Lendário':'#FFAA00','Raro':'#5555FF','Incomum':'#55FF55','Comum':'#AAAAAA' };
  let optsHtml = '';
  for (const rarity of rarities) {
    const group = coinBrainrots
      .filter(b => b.rarity === rarity)
      .sort((a, b) => (b.valuePerSec || 0) - (a.valuePerSec || 0));
    if (!group.length) continue;
    const color = RARITY_COLORS_CC[rarity] || '#aaa';
    optsHtml += `<div class="cc-mob-opt-group" style="color:${color}">${rarity}</div>`;
    for (const b of group) {
      optsHtml += `<div class="cc-mob-opt" data-name="${escAttr(b.name)}">${mobFace(b.icon)}<span>${b.name}</span></div>`;
    }
  }
  optsPanel.innerHTML = optsHtml;

  function selectMob(name) {
    _ccMob = name;
    optsPanel.querySelectorAll('.cc-mob-opt').forEach(el => el.classList.toggle('selected', el.dataset.name === name));
    if (!name) {
      triggerFace.innerHTML = '';
      triggerText.textContent = 'Selecione um brainrot...';
      triggerText.classList.remove('selected');
    } else {
      const b = _mbBrainrots.find(b => b.name === name);
      if (b) {
        triggerFace.innerHTML = mobFace(b.icon);
        triggerText.textContent = b.name;
        triggerText.classList.add('selected');
        costInp.value = fmt(b.buyValue);
      }
    }
    closeOpts();
    recalc();
  }

  function openOpts()  { optsPanel.classList.remove('hidden'); trigger.classList.add('open'); }
  function closeOpts() { optsPanel.classList.add('hidden');    trigger.classList.remove('open'); }

  trigger.addEventListener('click', () => optsPanel.classList.contains('hidden') ? openOpts() : closeOpts());
  optsPanel.addEventListener('click', e => {
    const opt = e.target.closest('.cc-mob-opt');
    if (opt) selectMob(opt.dataset.name);
  });
  document.addEventListener('click', e => {
    if (!document.getElementById('cc-mob-dropdown').contains(e.target)) closeOpts();
  });

  // Defaults from current _mbConfig / _mbLevel
  vipSel.value      = _mbConfig.vip;
  rebirthSel.value  = String(_mbLevel);
  boosterInp.value  = _mbConfig.booster;
  evMultiInp.value  = _mbConfig.eventMulti;

  function getVip()   { return VIP_DATA[vipSel.value] || VIP_DATA.none; }
  function getRbMulti() {
    const lvl = parseInt(rebirthSel.value) || 0;
    const r   = _mbRebirths.find(r => r.level === lvl) || null;
    return r ? r.coinsMultiplier : 1;
  }

  function updateVipInfo() {
    const vip       = getVip();
    const bonusPct  = Math.round((vip.bonus - 1) * 100);
    const debuffPct = Math.round((1 - vip.afkDebuff) * 100);
    vipBuffEl.textContent   = `+${bonusPct}% Coins`;
    vipDebuffEl.textContent = `−${debuffPct}% AFK`;
  }

  function updateRebirthInfo() {
    const cm = getRbMulti();
    document.getElementById('cc-rebirth-multi').textContent = `${cm}x Coins`;
  }

  function recalc() {
    const name = _ccMob;
    if (!name) {
      ['cc-r-afk','cc-r-mundo','cc-r-evento','cc-r-total','cc-r-be'].forEach(id => {
        document.getElementById(id).textContent = '—';
      });
      return;
    }
    const b = _mbBrainrots.find(b => b.name === name);
    if (!b) return;

    const cps      = b.valuePerSec || 0;
    const vip      = getVip();
    const cm       = getRbMulti();
    const booster  = parseFloat(boosterInp.value) || 1;
    const custo    = parseNotation(costInp.value);
    const afkH     = parseInt(afkInp.value)    || 0;
    const mundoH   = parseInt(mundoInp.value)   || 0;
    const evN      = parseInt(eventosInp.value) || 0;
    const evMulti  = parseFloat(evMultiInp.value) || 1;

    const mundoEf    = Math.max(0, mundoH - evN);
    const afkDaily   = cps * cm * vip.bonus * vip.afkDebuff * afkH   * 3600;
    const mundoDaily = cps * cm * vip.bonus * booster        * mundoEf * 3600;
    const evtDaily   = cps * cm * vip.bonus * booster * evMulti * evN * 3600;
    const totalDaily = afkDaily + mundoDaily + evtDaily;

    const beVal = totalDaily > 0 && custo > 0
      ? fmtTime(custo / (totalDaily / 86400))
      : '—';

    document.getElementById('cc-r-afk').textContent    = fmt2(afkDaily);
    document.getElementById('cc-r-mundo').textContent  = fmt2(mundoDaily);
    document.getElementById('cc-r-evento').textContent = fmt2(evtDaily);
    document.getElementById('cc-r-total').textContent  = fmt2(totalDaily);
    document.getElementById('cc-r-be').textContent     = beVal;
  }

  // Hours linkage: afk + mundo = 24, eventos <= mundo
  afkInp.addEventListener('input', () => {
    const afk   = Math.max(0, Math.min(24, parseInt(afkInp.value) || 0));
    const mundo = 24 - afk;
    const ev    = Math.min(parseInt(eventosInp.value) || 0, mundo);
    afkInp.value     = afk;
    mundoInp.value   = mundo;
    eventosInp.value = ev;
    recalc();
  });

  mundoInp.addEventListener('input', () => {
    const mundo = Math.max(0, Math.min(24, parseInt(mundoInp.value) || 0));
    const afk   = 24 - mundo;
    const ev    = Math.min(parseInt(eventosInp.value) || 0, mundo);
    mundoInp.value   = mundo;
    afkInp.value     = afk;
    eventosInp.value = ev;
    recalc();
  });

  eventosInp.addEventListener('input', () => {
    let ev    = Math.max(0, parseInt(eventosInp.value) || 0);
    let mundo = parseInt(mundoInp.value) || 0;
    let afk   = parseInt(afkInp.value)   || 0;
    if (ev > mundo) {
      const borrow = Math.min(ev - mundo, afk);
      mundo += borrow;
      afk   -= borrow;
      ev     = Math.min(ev, mundo);
      mundoInp.value = mundo;
      afkInp.value   = afk;
    }
    eventosInp.value = ev;
    recalc();
  });

  vipSel.addEventListener('change', () => { updateVipInfo(); recalc(); });
  rebirthSel.addEventListener('input', () => {
    const raw = parseInt(rebirthSel.value);
    if (!isNaN(raw)) rebirthSel.value = Math.max(0, Math.min(maxRebirth, raw));
    updateRebirthInfo();
    recalc();
  });
  [boosterInp, costInp, evMultiInp].forEach(el => el.addEventListener('input', recalc));

  updateVipInfo();
  updateRebirthInfo();
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
  const keyNames      = new Set(_chavesData.map(k => k.name));
  const tridentNames  = new Set(TRIDENTES);
  const porretesNames = new Set(_porretesData.map(p => p.name));
  const trData = trLoad();
  const prData = prLoad();
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
        } else if (porretesNames.has(item.name)) {
          const pd = _porretesData.find(p => p.name === item.name);
          if (pd) {
            if (prData.tokensBase != null) veT += prob * qty * prData.tokensBase * pd.level1Equivalents;
            if (prData.coinsBase  != null) veC += prob * qty * prData.coinsBase  * pd.level1Equivalents;
          }
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
  const modal         = document.getElementById('chaves-modal');
  const keyNames      = new Set(_chavesData.map(k => k.name));
  const tridentNames  = new Set(TRIDENTES);
  const porretesNames = new Set(_porretesData.map(p => p.name));
  const trData = trLoad();
  const prData = prLoad();
  document.getElementById('chaves-modal-title').textContent = key.name;

  const tbody  = document.getElementById('chaves-items-tbody');
  const probs  = calcProbs(key.items);
  const saved  = _chSaved[key.name] || {};
  const allEvs = computeAllKeyEVs();
  const last   = key.items.length - 1;

  let html = '';
  key.items.forEach((item, i) => {
    const prob       = probs[i];
    const qty        = parseNotation(item.qty);
    const isKey      = keyNames.has(item.name);
    const isTrident  = tridentNames.has(item.name);
    const isPorrete  = porretesNames.has(item.name);
    const oddTd      = `${item.odd}%`;

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
    } else if (isPorrete) {
      const pd  = _porretesData.find(p => p.name === item.name);
      const tP1 = pd && prData.tokensBase != null ? prData.tokensBase * pd.level1Equivalents : 0;
      const cP1 = pd && prData.coinsBase  != null ? prData.coinsBase  * pd.level1Equivalents : 0;
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
  const tbody         = document.getElementById('chaves-items-tbody');
  if (!tbody) return;
  const keyNames      = new Set(_chavesData.map(k => k.name));
  const tridentNames  = new Set(TRIDENTES);
  const porretesNames = new Set(_porretesData.map(p => p.name));
  const trData = trLoad();
  const prData = prLoad();
  const probs  = calcProbs(key.items);
  const saved  = _chSaved[key.name] || {};

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
    } else if (porretesNames.has(item.name)) {
      const pd  = _porretesData.find(p => p.name === item.name);
      const tP1 = pd && prData.tokensBase != null ? prData.tokensBase * pd.level1Equivalents : 0;
      const cP1 = pd && prData.coinsBase  != null ? prData.coinsBase  * pd.level1Equivalents : 0;
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

// ── Pesca ────────────────────────────────────────────────────────────────────

const PESCA_BASE_FISH = 15; // peixes por 30s
const PESCA_LS = 'pesca_accounts';

let _pescaAccounts = [];
let _pescaShop = [];
let _pescaTokenPerFish = 0;

function pescaLoad() {
  try { const v = localStorage.getItem(PESCA_LS); return v ? JSON.parse(v) : []; } catch { return []; }
}
function pescaSave() { localStorage.setItem(PESCA_LS, JSON.stringify(_pescaAccounts)); }

function pescaFishPerHour(vara)   { return (PESCA_BASE_FISH / 30) * vara * 3600; }
function pescaTokensPerHour(vara) { return pescaFishPerHour(vara) * _pescaTokenPerFish; }

function pescaRenderTable() {
  const tbody = document.getElementById('pesca-tbody');
  const tfoot = document.getElementById('pesca-tfoot');

  const online  = _pescaAccounts.filter(a => a.online);
  const offline = _pescaAccounts.filter(a => !a.online);
  const ordered = [...online, ...offline];

  if (ordered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:#555;padding:24px">Nenhuma conta adicionada</td></tr>`;
    tfoot.innerHTML = '';
    return;
  }

  let html = '';
  for (const acc of ordered) {
    const vara      = acc.vara;
    const fh        = pescaFishPerHour(vara);
    const th        = pescaTokensPerHour(vara);
    const offCls    = acc.online ? '' : ' class="pesca-row-offline"';
    const chipCls   = acc.online ? 'online' : 'offline';
    const chipLabel = acc.online ? 'Online' : 'Offline';
    const idx       = _pescaAccounts.indexOf(acc);

    html += `<tr${offCls} data-idx="${idx}">
      <td>${acc.name}</td>
      <td class="pesca-vara-cell"><input type="text" inputmode="decimal" class="pesca-vara-input" value="${vara.toFixed(1)}" data-idx="${idx}"></td>
      <td><span class="pesca-status-chip ${chipCls}" data-idx="${idx}">${chipLabel}</span></td>
      <td class="num pesca-fish-val">${fmt2(fh)}</td>
      <td class="num pesca-token-val">${fmt2(th)}</td>
      <td class="num pesca-fish-val">${fmt2(fh * 8)}</td>
      <td class="num pesca-token-val">${fmt2(th * 8)}</td>
      <td class="num pesca-fish-val">${fmt2(fh * 24)}</td>
      <td class="num pesca-token-val">${fmt2(th * 24)}</td>
      <td><button class="btn-remove pesca-remove" data-idx="${idx}">×</button></td>
    </tr>`;
  }
  tbody.innerHTML = html;

  const totalFh = online.reduce((s, a) => s + pescaFishPerHour(a.vara), 0);
  const totalTh = online.reduce((s, a) => s + pescaTokensPerHour(a.vara), 0);
  tfoot.innerHTML = online.length > 0 ? `<tr class="pesca-total-row">
    <td colspan="3" style="color:#aaa;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.04em">Total (online)</td>
    <td class="num pesca-fish-val">${fmt2(totalFh)}</td>
    <td class="num pesca-token-val">${fmt2(totalTh)}</td>
    <td class="num pesca-fish-val">${fmt2(totalFh * 8)}</td>
    <td class="num pesca-token-val">${fmt2(totalTh * 8)}</td>
    <td class="num pesca-fish-val">${fmt2(totalFh * 24)}</td>
    <td class="num pesca-token-val">${fmt2(totalTh * 24)}</td>
    <td></td>
  </tr>` : '';

  tbody.querySelectorAll('.pesca-vara-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const idx = parseInt(inp.dataset.idx);
      const val = parseFloat(inp.value.replace(',', '.'));
      if (!isNaN(val) && val >= 0.1) {
        _pescaAccounts[idx].vara = Math.round(val * 10) / 10;
        pescaSave();
        pescaRenderTable();
      } else {
        inp.value = _pescaAccounts[idx].vara.toFixed(1);
      }
    });
  });

  tbody.querySelectorAll('.pesca-status-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const idx = parseInt(chip.dataset.idx);
      _pescaAccounts[idx].online = !_pescaAccounts[idx].online;
      pescaSave();
      pescaRenderTable();
    });
  });

  tbody.querySelectorAll('.pesca-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      _pescaAccounts.splice(idx, 1);
      pescaSave();
      pescaRenderTable();
    });
  });
}

function pescaRenderShop() {
  const grid = document.getElementById('pesca-shop-grid');
  let html = '';
  for (const item of _pescaShop) {
    const tokenEquiv = item.cost * _pescaTokenPerFish;
    html += `<div class="pesca-shop-card">
      <div class="pesca-shop-card-header">
        ${mcImg(item.icon)}
        <span>${item.name}</span>
      </div>
      <div class="pesca-shop-card-cost">
        <span class="pesca-fish-val">${fmt2(item.cost)}</span> peixes
        = <span class="pesca-token-val">${fmt2(tokenEquiv)}</span> Tokens
      </div>
    </div>`;
  }
  grid.innerHTML = html;
}

function initPesca(shop) {
  _pescaShop = shop;
  _pescaTokenPerFish = shop[0].quantity / shop[0].cost;
  _pescaAccounts = pescaLoad();

  pescaRenderTable();
  pescaRenderShop();

  const addInput = document.getElementById('pesca-add-input');
  const addBtn   = document.getElementById('pesca-add-btn');

  function addAccount() {
    const name = addInput.value.trim();
    if (!name) return;
    _pescaAccounts.push({ name, vara: 1.0, online: true });
    pescaSave();
    pescaRenderTable();
    addInput.value = '';
  }

  addBtn.addEventListener('click', addAccount);
  addInput.addEventListener('keydown', e => { if (e.key === 'Enter') addAccount(); });

  const calcFish   = document.getElementById('pesca-calc-fish');
  const calcTokens = document.getElementById('pesca-calc-tokens');
  calcFish.addEventListener('input', () => {
    const fish = parseFloat(calcFish.value) || 0;
    calcTokens.textContent = fmt2(fish * _pescaTokenPerFish);
  });
}

async function init() {
  const [brainrots, rebirths, porretes, chaves, pesca] = await Promise.all([
    fetch('data/brainrots.json').then(r => r.json()),
    fetch('data/rebirths.json').then(r => r.json()),
    fetch('data/porretes.json').then(r => r.json()),
    fetch('data/chaves.json').then(r => r.json()),
    fetch('data/pesca.json').then(r => r.json()),
  ]);

  const coinBrainrots = brainrots.filter(b => b.currency !== 'rubi');
  const rubiBrainrots = brainrots.filter(b => b.currency === 'rubi');

  renderBrainrotTable('coins-table-wrap', coinBrainrots, brainrotSort, 'coins');
  renderBrainrotTable('rubi-table-wrap',  rubiBrainrots, rubiSort,     'rubi');
  renderRebirths(rebirths);
  renderPorretes(porretes);
  initMeusbrainrots(brainrots, rebirths);
  initChaves(chaves);
  initPesca(pesca);

  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  const tipModal  = document.getElementById('tip-modal');
  const tipBtn    = document.getElementById('tip-btn');
  const closeBtn  = document.getElementById('tip-close');

  tipBtn.addEventListener('click', () => tipModal.classList.add('open'));
  closeBtn.addEventListener('click', () => tipModal.classList.remove('open'));
  tipModal.addEventListener('click', e => { if (e.target === tipModal) tipModal.classList.remove('open'); });

  const esteiraModal = document.getElementById('esteira-modal');
  document.getElementById('esteira-modal-close').addEventListener('click', () => esteiraModal.classList.remove('open'));
  esteiraModal.addEventListener('click', e => { if (e.target === esteiraModal) esteiraModal.classList.remove('open'); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    tipModal.classList.remove('open');
    esteiraModal.classList.remove('open');
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
