const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ek line mein compress karke chhota karta hai (titles ke liye)
function truncate(str, max) {
  str = String(str || '').replace(/\s+/g, ' ').trim();
  return str.length <= max ? str : str.slice(0, max - 1).trimEnd() + '…';
}

// newlines barqarar rakhta hai (posts ke text ke liye)
function clip(str, max) {
  str = String(str || '').trim();
  return str.length <= max ? str : str.slice(0, max - 1).trimEnd() + '…';
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

async function ogImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 SocialAutoposter' }, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m ? m[1].replace(/&amp;/g, '&') : null;
  } catch { return null; }
}

async function http(url, opts = {}) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(30000) });
  const raw = await res.text();
  let data = {};
  try { data = JSON.parse(raw); } catch { /* not json */ }
  if (!res.ok) {
    const msg = (data && data.error && (data.error.message || data.error)) || (data && data.message) || raw.slice(0, 200) || res.statusText;
    throw new Error(`HTTP ${res.status}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
  }
  return data;
}

const FORM = { 'Content-Type': 'application/x-www-form-urlencoded' };
const form = (obj) => new URLSearchParams(obj);

module.exports = { sleep, truncate, clip, stripHtml, ogImage, http, FORM, form };
