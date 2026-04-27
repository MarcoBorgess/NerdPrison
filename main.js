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

  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Tip modal
  const modal    = document.getElementById('tip-modal');
  const tipBtn   = document.getElementById('tip-btn');
  const closeBtn = document.getElementById('tip-close');

  tipBtn.addEventListener('click', () => modal.classList.add('open'));
  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('open'); });

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
