import { getBoard, getBounty, getFee, getLeaderboard, getProfile, getRankings } from './api.js';
import { loadingHTML, errorHTML, boardHTML, boardListHTML, bountyHTML, leaderboardHTML, profileHTML } from './views.js';
import { timeLeft, toStr, toArr, toNum, toObj } from './format.js';

const app = document.getElementById('app');
const setHTML = (h) => { app.innerHTML = h; };
const feeMap = {};

async function loadBoard() {
  setHTML(loadingHTML());
  try {
    const board = toArr(await getBoard()).map(x => toObj(x));
    await Promise.all(board.map(async (i) => {
      const f = toObj(await getFee(i.slug));
      i._fee = f;
      feeMap[toStr(i.slug)] = toNum(i.potUsd ?? i.rewardAmount) + toNum(toObj(f.pot).fees_usd);
    }));
    const cats = [...new Set(board.flatMap(i => toArr(i.category)).map(c => toStr(c)).filter(Boolean))];
    setHTML(boardHTML(cats));
    const qEl = document.getElementById('q');
    const sortEl = document.getElementById('sort');
    const apply = () => {
      const q = (qEl?.value || '').toLowerCase();
      const active = document.querySelector('.chips button.active');
      const cat = active?.dataset?.cat || 'All';
      const filtered = board.filter(i =>
        (toStr(i.title) + ' ' + toStr(i.category) + ' ' + toArr(i.skills).map(s => toStr(s)).join(' ')).toLowerCase().includes(q)
        && (cat === 'All' || toArr(i.category).map(c => toStr(c)).includes(cat)));
      const sorted = [...filtered].sort((a, b) => {
        const key = sortEl?.value || 'ending';
        if (key === 'ending') return new Date(toStr(a.deadline) || '9999') - new Date(toStr(b.deadline) || '9999');
        if (key === 'pot') return feeMap[toStr(b.slug)] - feeMap[toStr(a.slug)];
        if (key === 'entries') return toNum(b.submissionCount) - toNum(a.submissionCount);
        return 0;
      });
      document.getElementById('list').innerHTML = boardListHTML(sorted, feeMap);
    };
    if (qEl) qEl.oninput = apply;
    if (sortEl) sortEl.onchange = apply;
    document.querySelectorAll('.chips button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chips button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        apply();
      });
    });
    apply();
  } catch (e) { setHTML(errorHTML(e.message)); }
}

async function loadBounty(slug) {
  setHTML(loadingHTML());
  try { setHTML(bountyHTML(await getBounty(slug), await getFee(slug))); }
  catch (e) { setHTML(errorHTML(e.message)); }
}

async function loadLeaderboard(slug) {
  setHTML(loadingHTML());
  try { setHTML(leaderboardHTML(await getLeaderboard(slug), slug)); }
  catch (e) { setHTML(errorHTML(e.message)); }
}

async function loadProfile(handle) {
  setHTML(loadingHTML());
  try {
    const p = await getProfile(handle);
    const r = await getRankings(handle);
    setHTML(profileHTML(p, r, handle));
  } catch (e) { setHTML(errorHTML(e.message)); }
}

document.addEventListener('click', (e) => { if (e.target?.dataset?.retry) route(); });

function route() {
  const hash = location.hash.slice(1).replace(/^\//, '');
  if (hash === '') { loadBoard(); return; }
  const parts = hash.split('/');
  if (parts[0] === 'bounty') {
    if (parts[2] === 'leaderboard') loadLeaderboard(parts[1]);
    else loadBounty(parts[1]);
  } else if (parts[0] === 'u') {
    loadProfile(parts[1]);
  } else {
    setHTML(errorHTML('Route not found'));
  }
}

window.addEventListener('load', () => {
  route();
  window.addEventListener('hashchange', route);
  setInterval(() => {
    document.querySelectorAll('[data-dl]').forEach(el => { el.textContent = timeLeft(el.dataset.dl); });
  }, 30000);
});
