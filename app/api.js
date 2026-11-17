// API client for make.fun front‑end
// In‑memory cache to deduplicate concurrent requests and handle ETag caching.
const cache = new Map(); // key → { etag, data, promise }

/**
 * Fetch JSON from the Make.fun backend with ETag support.
 * @param {string} path – API path starting with '/'.
 * @returns {Promise<any>} Parsed JSON response.
 */
export async function getJSON(path) {
  const url = `https://make.fun${path}`;
  const entry = cache.get(path) || {};
  // If a request for this path is already in flight, reuse its promise.
  if (entry.promise) return entry.promise;

  const headers = {};
  if (entry.etag) headers['If-None-Match'] = entry.etag;

  const fetchPromise = fetch(url, { headers })
    .then(async (res) => {
      if (res.status === 304) {
        // Not modified – return cached data.
        return entry.data;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const data = await res.json();
      const etag = res.headers.get('ETag');
      cache.set(path, { etag, data });
      return data;
    })
    .finally(() => {
      // Clean up promise reference after resolution/rejection.
      const cur = cache.get(path);
      if (cur) delete cur.promise;
    });

  // Store promise to deduplicate concurrent calls.
  cache.set(path, { ...entry, promise: fetchPromise });
  return fetchPromise;
}

export async function getBoard() {
  const json = await getJSON('/api/competitions?status=open');
  return (json && json.items) || [];
}

export function getBounty(slug) {
  return getJSON(`/api/competitions/${slug}`);
}

export async function getFee(slug) {
  try {
    return await getJSON(`/api/competitions/${slug}/entry-fee`);
  } catch (_) {
    return null;
  }
}

export function getLeaderboard(slug) {
  return getJSON(`/api/competitions/${slug}/leaderboard`);
}

export function getProfile(handle) {
  return getJSON(`/api/profiles/${encodeURIComponent(handle)}`);
}

export async function getRankings(handle) {
  try {
    return await getJSON(`/api/rankings/${encodeURIComponent(handle)}`);
  } catch (_) {
    return null;
  }
}

