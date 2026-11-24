// Ye script har 10 minute GitHub Actions par chalti hai (ya local: node src/run.js)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Local testing ke liye simple .env loader (GitHub par secrets env mein pehle se hote hain)
(function loadDotEnv() {
  const f = path.join(ROOT, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
})();

const { publishers, configuredMap } = require('./publishers');
const { fetchRss } = require('./rss');
const { render } = require('./template');
const { clip, sleep } = require('./util');

const CONFIG_FILE = path.join(ROOT, 'config', 'automations.json');
const STATE_FILE = path.join(ROOT, 'data', 'state.json');
const DRY = process.env.DRY_RUN === '1';
const MAX_NEW_PER_RUN = 5;
const MAX_ATTEMPTS = 3;
const MAX_LOG = 200;
const MAX_SEEN = 1000;

// Parent automation types. Naya type (jaise "youtube") yahan add karein.
const SOURCES = { rss: fetchRss };

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

// Log public repo mein jata hai, is liye secrets kabhi nahi likhne
function redact(s) {
  let out = String(s);
  for (const [k, v] of Object.entries(process.env)) {
    if (/TOKEN|SECRET/i.test(k) && v && v.length >= 8) out = out.split(v).join('***');
  }
  return out.slice(0, 300);
}

function addLog(state, entry) {
  state.log.unshift({ time: new Date().toISOString(), ...entry });
  if (state.log.length > MAX_LOG) state.log.length = MAX_LOG;
}

async function publishOne(auto, child, item) {
  const pub = publishers[child.platform];
  if (!pub) throw new Error('Unknown platform: ' + child.platform);
  if (!pub.configured()) throw new Error(`${child.platform} ke secrets set nahi hain`);
  const text = clip(render(child.template || pub.defaultTemplate, item, auto), pub.maxLen);
  if (DRY) { console.log(`[dry-run] ${child.platform}: ${text.replace(/\n/g, ' | ')}`); return 'dry-run'; }
  return pub.publish({ item, text });
}

async function processPending(auto, st, state) {
  for (const p of st.pending) {
    for (const cid of [...p.remaining]) {
      const child = (auto.children || []).find((c) => c.id === cid && c.enabled);
      if (!child) { p.remaining = p.remaining.filter((x) => x !== cid); continue; }
      const base = { automation: auto.name, platform: child.platform, title: p.item.title, link: p.item.link };
      try {
        const id = await publishOne(auto, child, p.item);
        addLog(state, { ...base, status: 'posted', detail: String(id) });
        p.remaining = p.remaining.filter((x) => x !== cid);
        console.log(`posted: ${child.platform} <- ${p.item.title}`);
        if (!DRY) await sleep(1500);
      } catch (e) {
        p.attempts[cid] = (p.attempts[cid] || 0) + 1;
        const final = p.attempts[cid] >= MAX_ATTEMPTS;
        addLog(state, { ...base, status: final ? 'failed' : 'retrying', detail: redact(e.message) });
        console.log(`${final ? 'FAILED' : 'retry'}: ${child.platform} - ${redact(e.message)}`);
        if (final) p.remaining = p.remaining.filter((x) => x !== cid);
      }
    }
  }
  st.pending = st.pending.filter((p) => p.remaining.length > 0);
}

async function runAutomation(auto, st, state) {
  const source = SOURCES[auto.type || 'rss'];
  if (!source) throw new Error('Unknown parent type: ' + auto.type);
  const items = await source(auto); // newest first

  if (!st.initialized) {
    // Pehli dafa: purane articles sirf "seen" mark honge, post nahi
    st.seen = items.map((i) => i.guid);
    st.initialized = true;
    console.log(`[${auto.name}] initialized with ${items.length} existing items`);
  } else {
    const seen = new Set(st.seen);
    const fresh = items.filter((i) => !seen.has(i.guid)).reverse(); // oldest first
    for (const it of fresh) st.seen.push(it.guid);
    st.seen = st.seen.slice(-MAX_SEEN);
    const childIds = (auto.children || []).filter((c) => c.enabled).map((c) => c.id);
    if (childIds.length) {
      for (const it of fresh.slice(-MAX_NEW_PER_RUN)) {
        st.pending.push({
          guid: it.guid,
          item: { title: it.title, link: it.link, image: it.image, summary: it.summary },
          remaining: [...childIds],
          attempts: {}
        });
      }
    }
    if (fresh.length) console.log(`[${auto.name}] ${fresh.length} new item(s)`);
  }
  st.lastError = null;
}

async function main() {
  const config = readJson(CONFIG_FILE, { automations: [] });
  const state = readJson(STATE_FILE, {});
  state.automations = state.automations || {};
  state.log = state.log || [];
  state.configured = configuredMap();

  const ids = new Set();
  for (const auto of config.automations || []) {
    ids.add(auto.id);
    if (!auto.enabled) continue;
    const st = (state.automations[auto.id] = state.automations[auto.id] || { initialized: false, seen: [], pending: [] });
    try {
      await runAutomation(auto, st, state);
    } catch (e) {
      st.lastError = redact(e.message);
      console.log(`[${auto.name}] error: ${st.lastError}`);
    }
    try {
      await processPending(auto, st, state);
    } catch (e) {
      console.log(`[${auto.name}] publish error: ${redact(e.message)}`);
    }
  }
  for (const id of Object.keys(state.automations)) if (!ids.has(id)) delete state.automations[id];

  const out = JSON.stringify(state, null, 2) + '\n';
  const prev = fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, 'utf8') : '';
  if (out !== prev) fs.writeFileSync(STATE_FILE, out);
}

main().catch((e) => { console.error('Fatal:', redact(e.stack || e.message)); process.exit(1); });
