import { escapeHtml } from '../../scripts/utils.js';

const DATA_URL = new URL('games.json', import.meta.url);
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const state = {
  games: [],
  year: 'all',
  order: 'asc',
  updatedAt: '',
  loading: true,
  error: '',
};

const els = {
  timeline: document.getElementById('timeline'),
  yearFilter: document.getElementById('yearFilter'),
  timelineCount: document.getElementById('timelineCount'),
  heroMeta: document.getElementById('heroMeta'),
  sortToggle: document.getElementById('sortToggle'),
  sortLabel: document.getElementById('sortLabel'),
};

const pad = (value) => String(value).padStart(2, '0');

function parseDate(value) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

const formatFullDate = (date) => `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
const formatAxisDate = (date) => `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
const formatDotDate = (date) => `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;

function formatUpdated(value) {
  const date = parseDate(value);
  return date ? formatDotDate(date) : '';
}

function sanitizeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value), document.baseURI);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function normalizeGame(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  const name = String(raw.name || '').trim();
  const date = parseDate(raw.betaDate);
  const dateNote = raw.dateNote ? String(raw.dateNote).trim() : '';

  // 有确切日期走时间线；没有日期（无论有没有档期说明）的归入待定区。
  // 公测时间完全未公布的游戏同样收录，公测时间字段显示「暂未公布」。
  if (!name) {
    console.warn('[game-timeline] 已跳过缺少名称的数据：', raw);
    return null;
  }

  return {
    domId: `game-${index + 1}`,
    id: String(raw.id || `game-${index + 1}`),
    name,
    nameEn: raw.nameEn ? String(raw.nameEn) : '',
    date,
    betaDate: date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : '',
    tba: !date,
    dateNote,
    publisher: raw.publisher ? String(raw.publisher) : '待公布',
    genre: raw.genre ? String(raw.genre) : '待公布',
    engine: raw.engine ? String(raw.engine) : '待公布',
    officialUrl: sanitizeUrl(raw.officialUrl),
    logo: sanitizeUrl(raw.logo),
    logoFit: raw.logoFit === 'contain' ? 'contain' : '',
    cover: sanitizeUrl(raw.cover),
    tagline: raw.tagline ? String(raw.tagline) : '',
  };
}

// 仅在「今天正好公测」时给一个提示标签，其余状态不再挂标签。
function isReleaseToday(date) {
  if (!date) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

// 官网链接直接显示域名本身，不再用「官网」字样做标签。
function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
}

const datedGames = () => state.games.filter((game) => !game.tba);
const tbaGames = () => state.games.filter((game) => game.tba);

// 待定分组内，有档期说明（如「定档 2026 年 12 月」）的排在完全没有消息的前面。
function sortPending(games) {
  return [...games].sort((a, b) => Number(Boolean(b.dateNote)) - Number(Boolean(a.dateNote)));
}

function filteredGames() {
  const direction = state.order === 'desc' ? -1 : 1;
  return datedGames()
    .filter((game) => state.year === 'all' || String(game.date.getFullYear()) === state.year)
    .sort((a, b) => (a.date.getTime() - b.date.getTime()) * direction);
}

function groupByYear(games) {
  const groups = new Map();
  games.forEach((game) => {
    const year = game.date.getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(game);
  });
  return [...groups.entries()];
}

const externalIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>`;

function renderMeta(game) {
  const dateValue = game.date
    ? formatFullDate(game.date)
    : `<span class="meta-pending">${escapeHtml(game.dateNote || '暂未公布')}</span>`;

  return `
    <div class="meta-item">
      <dt class="meta-label">公测时间</dt>
      <dd class="meta-value">${dateValue}</dd>
    </div>
    <div class="meta-item">
      <dt class="meta-label">运营厂商</dt>
      <dd class="meta-value">${escapeHtml(game.publisher)}</dd>
    </div>
    <div class="meta-item">
      <dt class="meta-label">游戏类型</dt>
      <dd class="meta-value">${escapeHtml(game.genre)}</dd>
    </div>
    <div class="meta-item">
      <dt class="meta-label">游戏引擎</dt>
      <dd class="meta-value">${escapeHtml(game.engine)}</dd>
    </div>`;
}

function renderItem(game) {
  const initial = Array.from(game.name)[0] || '?';

  const todayBadge = isReleaseToday(game.date)
    ? '<span class="status-badge status-today">今日公测</span>'
    : '';

  const officialLink = game.officialUrl
    ? `<a class="official-link" href="${escapeHtml(game.officialUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(game.name)} 官网，在新窗口打开">${escapeHtml(hostLabel(game.officialUrl))} ${externalIcon}</a>`
    : '';

  const logo = game.logo
    ? `<img src="${escapeHtml(game.logo)}" alt="${escapeHtml(game.name)} Logo" loading="lazy" decoding="async" referrerpolicy="no-referrer"${game.logoFit === 'contain' ? ' class="is-contain"' : ''} data-fallback>`
    : '';

  const cover = game.cover
    ? `<img src="${escapeHtml(game.cover)}" alt="${escapeHtml(game.name)} 宣传图" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fallback>`
    : '';

  const dateCell = game.date
    ? `<time class="item-date" datetime="${game.betaDate}">
        <span class="item-date-main">${formatAxisDate(game.date)}</span>
        <span class="item-date-week">${WEEKDAYS[game.date.getDay()]}</span>
      </time>`
    : `<div class="item-date is-pending">
        <span class="item-date-main">待定</span>
        <span class="item-date-week">TBA</span>
      </div>`;

  return `
    <article class="timeline-item" aria-labelledby="${game.domId}-name">
      ${dateCell}
      <span class="node-dot" aria-hidden="true"></span>
      <div class="game-card">
        <div class="game-logo">
          <span class="logo-fallback" aria-hidden="true">${escapeHtml(initial)}</span>
          ${logo}
        </div>
        <div class="game-info">
          <div class="game-head">
            <h3 class="game-name" id="${game.domId}-name">${escapeHtml(game.name)}</h3>
            ${game.nameEn ? `<span class="game-name-en">${escapeHtml(game.nameEn)}</span>` : ''}
            ${todayBadge}
            ${officialLink}
          </div>
          ${game.tagline ? `<p class="game-tagline">${escapeHtml(game.tagline)}</p>` : ''}
          <dl class="game-meta">${renderMeta(game)}</dl>
        </div>
        <div class="game-cover">
          <span class="cover-fallback" aria-hidden="true">
            <span class="cover-fallback-mark">${escapeHtml(initial)}</span>
            <span class="cover-fallback-name">${escapeHtml(game.name)}</span>
          </span>
          ${cover}
        </div>
      </div>
    </article>`;
}

function bindImageFallbacks() {
  els.timeline.querySelectorAll('img[data-fallback]').forEach((img) => {
    const handleError = () => {
      const wrapper = img.closest('.game-logo, .game-cover');
      if (wrapper && wrapper.classList.contains('game-cover')) wrapper.classList.add('is-missing');
      img.remove();
    };

    img.addEventListener('error', handleError, { once: true });
  });
}

function renderTimeline() {
  const list = filteredGames();
  els.timeline.setAttribute('aria-busy', String(state.loading));

  if (state.loading) {
    els.timeline.classList.add('has-state');
    els.timeline.innerHTML = `
      <div class="timeline-state" role="status">
        <div class="state-spinner" aria-hidden="true"></div>
        <p>正在载入公测时间线…</p>
      </div>`;
    return;
  }

  if (state.error) {
    els.timeline.classList.add('has-state');
    els.timeline.innerHTML = `
      <div class="timeline-state timeline-error" role="alert">
        <div class="state-icon" aria-hidden="true">!</div>
        <h2>时间线加载失败</h2>
        <p>${escapeHtml(state.error)}</p>
        <p class="state-hint">请通过本地 HTTP 服务访问本页（例如运行项目根目录的 <code>start_server.bat</code>）。直接双击 HTML 文件时，浏览器会阻止读取 <code>games.json</code>。</p>
        <button type="button" class="btn btn-primary" data-action="retry">重新加载</button>
      </div>`;
    return;
  }

  const pending = state.year === 'all' ? sortPending(tbaGames()) : [];

  if (!list.length && !pending.length) {
    els.timeline.classList.add('has-state');
    els.timeline.innerHTML = `
      <div class="timeline-state" role="status">
        <div class="state-icon" aria-hidden="true">∅</div>
        <p>${state.year === 'all' ? '还没有收录游戏数据。' : `${escapeHtml(state.year)} 年暂无收录的游戏，换个年份看看吧。`}</p>
      </div>`;
    return;
  }

  els.timeline.classList.remove('has-state');

  const pendingBlock = pending.length
    ? `
    <div class="timeline-year timeline-year-pending">
      <div class="year-heading">
        <h2 class="year-num year-num-pending">待定</h2>
        <span class="year-rule" aria-hidden="true"></span>
        <span class="year-count">${pending.length} 款</span>
      </div>
      ${pending.map(renderItem).join('')}
    </div>`
    : '';

  els.timeline.innerHTML = groupByYear(list).map(([year, games]) => `
    <div class="timeline-year">
      <div class="year-heading">
        <h2 class="year-num">${year}</h2>
        <span class="year-rule" aria-hidden="true"></span>
        <span class="year-count">${games.length} 款</span>
      </div>
      ${games.map(renderItem).join('')}
    </div>`).join('') + pendingBlock;

  bindImageFallbacks();
}

function renderYearFilter() {
  if (!state.games.length) {
    els.yearFilter.innerHTML = '';
    return;
  }

  const years = [...new Set(datedGames().map((game) => game.date.getFullYear()))]
    .sort((a, b) => (state.order === 'desc' ? b - a : a - b));

  const chips = [
    `<button type="button" class="filter-chip" data-year="all" aria-pressed="${state.year === 'all'}">全部</button>`,
    ...years.map((year) => `<button type="button" class="filter-chip" data-year="${year}" aria-pressed="${state.year === String(year)}">${year}</button>`),
  ];

  els.yearFilter.innerHTML = chips.join('');
}

function updateCount(list = filteredGames()) {
  if (!state.games.length) {
    els.timelineCount.textContent = '';
    return;
  }

  const pending = tbaGames().length;

  els.timelineCount.textContent = state.year === 'all'
    ? `收录 ${state.games.length} 款${pending ? ` · 待定 ${pending} 款` : ''}`
    : `${state.year} 年 · ${list.length} 款`;
}

// 页头只保留数据更新时间，其余统计信息交给工具栏。
function updateHeroMeta() {
  const updated = formatUpdated(state.updatedAt);
  els.heroMeta.innerHTML = updated
    ? `<span>数据更新 <strong>${updated}</strong></span>`
    : '<span>数据更新时间未知</span>';
}

function refresh() {
  renderYearFilter();
  renderTimeline();
  updateCount();
}

let requestInFlight = false;

async function load() {
  if (requestInFlight) return;

  requestInFlight = true;
  state.loading = true;
  state.error = '';
  refresh();

  try {
    const response = await fetch(DATA_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`无法读取 games.json（HTTP ${response.status}）`);

    const data = await response.json();
    const rawGames = Array.isArray(data) ? data : data && data.games;
    if (!Array.isArray(rawGames)) throw new Error('games.json 格式不正确：缺少 games 数组');

    const games = rawGames.map(normalizeGame).filter(Boolean);
    if (!games.length) throw new Error('games.json 中没有有效的游戏数据');

    state.games = games;
    state.updatedAt = !Array.isArray(data) && data && data.updatedAt ? String(data.updatedAt) : '';
    state.year = 'all';
    updateHeroMeta();
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const blockedByFileProtocol = window.location.protocol === 'file:';

    state.games = [];
    state.updatedAt = '';
    state.error = blockedByFileProtocol
      ? '浏览器禁止在 file:// 协议下读取本地 JSON 文件'
      : (message && !/failed to fetch|load failed/i.test(message)
        ? message
        : '无法读取 games.json，请确认文件存在并通过本地服务器访问');

    els.heroMeta.innerHTML = '<span>数据更新时间未知</span>';
  } finally {
    state.loading = false;
    requestInFlight = false;
    refresh();
  }
}

function onYearFilterClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  const button = target ? target.closest('button[data-year]') : null;
  if (!button) return;

  state.year = button.dataset.year;
  els.yearFilter.querySelectorAll('button[data-year]').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(chip === button));
  });

  renderTimeline();
  updateCount();
}

function onSortToggle() {
  state.order = state.order === 'asc' ? 'desc' : 'asc';

  els.sortToggle.dataset.order = state.order;
  els.sortToggle.setAttribute('aria-pressed', String(state.order === 'desc'));
  els.sortToggle.setAttribute(
    'aria-label',
    state.order === 'asc'
      ? '当前按公测时间由近到远排列，点击切换为由远到近'
      : '当前按公测时间由远到近排列，点击切换为由近到远',
  );
  els.sortLabel.textContent = state.order === 'asc' ? '即将公测在前' : '远期公测在前';

  renderYearFilter();
  renderTimeline();
  updateCount();
}

els.yearFilter.addEventListener('click', onYearFilterClick);
els.sortToggle.addEventListener('click', onSortToggle);
els.timeline.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (target && target.closest('[data-action="retry"]')) load();
});

load();
