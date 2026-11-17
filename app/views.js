import { esc, money, num, timeLeft, dateStr, pct, toStr, toArr, toNum, toObj } from './format.js';

/** Loading placeholder */
export function loadingHTML() {
  return `<div class="loading-skeleton">
    <div class="skeleton title"></div>
    <div class="skeleton list"></div>
  </div>`;
}

/** Error view with retry button */
export function errorHTML(message) {
  return `<div class="error">
    <p>${esc(toStr(message))}</p>
    <button data-retry>Retry</button>
  </div>`;
}

/** Empty state view */
export function emptyHTML(message) {
  return `<div class="empty"><p>${esc(toStr(message, 'Nothing here'))}</p></div>`;
}

/** Board controls and container */
export function boardHTML(cats = [], activeCat = 'All') {
  const clean = [...new Set(toArr(cats).flatMap(c => toArr(c)).map(c => toStr(c)).filter(Boolean))];
  const catButtons = ['All', ...clean]
    .map(cat => `<button data-cat="${esc(cat)}"${cat === activeCat ? ' class="active"' : ''}>${esc(cat)}</button>`)
    .join('');
  return `<section class="board-controls">
    <input id="q" type="search" aria-label="Search" placeholder="Search…" />
    <div class="chips">${catButtons}</div>
    <select id="sort" aria-label="Sort">
      <option value="ending">Ending soon</option>
      <option value="pot">Highest pot</option>
      <option value="entries">Most entries</option>
    </select>
  </section>
  <div id="list"></div>`;
}

/** List of bounty cards */
export function boardListHTML(list = [], pots = {}) {
  const items = toArr(list);
  if (!items.length) return emptyHTML('No bounties found');
  const potMap = toObj(pots);
  const cards = items.map(raw => {
    const it = toObj(raw);
    const slug = toStr(it.slug);
    const potVal = potMap[slug] ?? it.potUsd ?? it.rewardAmount;
    const fee = it.entryFeeUsd != null ? money(it.entryFeeUsd) : 'Free entry';
    const sponsorName = toStr(toObj(it.sponsor).name ?? it.sponsor);
    const cd = `<span class="cd" data-dl="${esc(toStr(it.deadline))}">${timeLeft(it.deadline)}</span>`;
    return `<article class="card">
      <h3><a href="#/bounty/${esc(slug)}">${esc(toStr(it.title, slug))}</a></h3>
      <p class="pot">${money(potVal)}</p>
      <p class="fee">${fee}</p>
      <p class="category">${esc(toStr(it.category))}</p>
      <p class="entries">${num(it.submissionCount)} entries</p>
      <p class="sponsor">${esc(sponsorName)}</p>
      <p class="deadline">${cd}</p>
    </article>`;
  }).join('');
  return `<section class="board-list">${cards}</section>`;
}

/** Detailed bounty view */
export function bountyHTML(rawItem, rawFee = null) {
  const item = toObj(rawItem);
  const feeInfo = toObj(rawFee);
  const slug = toStr(item.slug);
  const pot = toNum(item.potUsd ?? item.rewardAmount) + toNum(toObj(feeInfo.pot).fees_usd);
  const fee = feeInfo.amount_usd != null ? money(feeInfo.amount_usd) : (item.entryFeeUsd != null ? money(item.entryFeeUsd) : 'Free entry');
  const deadline = `<span class="cd" data-dl="${esc(toStr(item.deadline))}">${timeLeft(item.deadline)}</span>`;
  const submissions = `${num(item.submissionCount)} submissions`;
  const skills = toArr(item.skills).map(s => `<span class="chip">${esc(toStr(s))}</span>`).join('');

  // description: split the raw text first, then escape each part exactly once
  const parts = toStr(item.description).split(/\n\n+/).filter(part => part.trim());
  const descHtml = parts.map(part => {
    const p = part.trim();
    if (p.startsWith('## ')) return `<h2>${esc(p.slice(3).trim())}</h2>`;
    if (p.startsWith('- ')) {
      const items = p.split('\n').map(line => `<li>${esc(line.replace(/^-\s*/, '').trim())}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${esc(p)}</p>`;
  }).join('');

  // rewards breakdown: rewards may be an object, a list of pairs, or a list of values
  let rewardRows = [];
  if (Array.isArray(item.rewards)) {
    rewardRows = item.rewards.map(entry => Array.isArray(entry) ? [entry[0], entry[1]] : [entry?.place ?? '', entry?.amount ?? entry]);
  } else {
    rewardRows = Object.entries(toObj(item.rewards));
  }
  const rewardsHtml = rewardRows.length
    ? `<section class="rewards"><h3>Rewards</h3>${rewardRows.map(([place, amount]) => `<div class="reward-row"><span>${esc(toStr(place))}</span><span>${money(amount)}</span></div>`).join('')}</section>`
    : '';

  return `<article class="bounty-detail">
    <h1>${esc(toStr(item.title, slug))}</h1>
    <p class="meta">
      <span class="pot">${money(pot)}</span>
      <span class="fee">${fee}</span>
    </p>
    <p class="deadline">${deadline}</p>
    <p class="submissions">${submissions}</p>
    <p class="category">${esc(toStr(item.category))}</p>
    <div class="skills">${skills}</div>
    <section class="description">${descHtml}</section>
    ${rewardsHtml}
    <nav class="links">
      <a href="#/bounty/${esc(slug)}/leaderboard">Leaderboard</a>
      <a href="https://make.fun/bounty/${esc(slug)}" target="_blank" rel="noopener">View on make.fun</a>
    </nav>
  </article>`;
}

/** Leaderboard view */
export function leaderboardHTML(rawData, slug) {
  const data = toObj(rawData);
  const note = toObj(data.phase).placements_held ? '<p>Placements held — provisional</p>' : '';
  const entries = toArr(data.entries);
  const paid = toNum(data.paid_places);
  if (!entries.length) return `<h1>Leaderboard</h1>${note}${emptyHTML('No entries yet')}`;
  const rows = entries.map((rawE, i) => {
    const e = toObj(rawE);
    const rank = toNum(e.rank ?? i + 1, i + 1);
    const name = toStr(e.handle ?? e.entrant ?? e.username, '?');
    const entrant = name !== '?' ? `<a href="#/u/${esc(name)}">${esc(name)}</a>` : esc(name);
    const score = e.judge_win_rate_micro != null ? pct(e.judge_win_rate_micro) : esc(toStr(e.score ?? e.win_rate ?? ''));
    const cls = i < paid ? 'paid' : '';
    const badge = cls ? '<span class="badge">paid</span>' : '';
    return `<tr class="${cls}"><td>${rank}</td><td>${entrant}</td><td>${score}</td><td>${esc(toStr(e.stage))}</td><td>${badge}</td></tr>`;
  }).join('');
  const body = `<table><thead><tr><th>Rank</th><th>Entrant</th><th>Score</th><th>Stage</th></tr></thead><tbody>${rows}</tbody></table>`;
  return `<h1>Leaderboard</h1>${note}${body}`;
}

/** Profile view */
export function profileHTML(rawP, rawR, rawHandle) {
  const p = toObj(rawP);
  const r = toObj(rawR);
  const handle = toStr(rawHandle ?? p.handle);
  const avatar = `<img crossorigin="anonymous" src="https://make.fun/api/profiles/${esc(handle)}/picture.png" alt="" onerror="this.style.display='none'">`;
  const fallback = `<div class="letter">${esc(handle.slice(0, 1).toUpperCase())}</div>`;
  const header = `<h1>${esc(toStr(p.displayName ?? p.display_name, handle))}</h1><p>@${esc(handle)}</p>`;
  const bio = toStr(p.bio) ? `<p>${esc(toStr(p.bio))}</p>` : '';
  const stats = [];
  const joined = dateStr(p.created_at ?? p.createdAt);
  if (joined) stats.push(['Joined', joined]);
  if (r.entries != null) stats.push(['Entries', toNum(r.entries)]);
  if (r.wins != null) stats.push(['Wins', toNum(r.wins)]);
  for (const [k, v] of Object.entries(r)) {
    if (typeof v === 'number' && !['entries', 'wins'].includes(k)) stats.push([k, v]);
  }
  const statsHTML = stats.length ? `<ul>${stats.map(([k, v]) => `<li>${esc(toStr(k))}: ${esc(toStr(v))}</li>`).join('')}</ul>` : '';
  const recentList = toArr(p.entries);
  const recent = recentList.length
    ? `<h2>Recent entries</h2>${recentList.map(rawE => { const e = toObj(rawE); return `<a href="#/bounty/${esc(toStr(e.slug))}">${esc(toStr(e.title ?? e.slug))}</a>`; }).join('<br>')}`
    : '';
  return `<div class="profile">${avatar}${fallback}${header}${bio}${statsHTML}${recent}</div>`;
}
