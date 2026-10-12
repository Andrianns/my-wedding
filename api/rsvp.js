// RSVP & ucapan tamu untuk Kebun Restu.
//
// Disimpan di Upstash Redis lewat REST API (tanpa dependency npm).
// Env var dipasang otomatis waktu database Upstash disambungkan ke project
// di Vercel: KV_REST_API_URL + KV_REST_API_TOKEN, atau
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
//
//   GET  /api/rsvp                       ringkasan + 50 tamu "Hadir" terbaru (untuk kursi)
//   GET  /api/rsvp?view=list&offset=0    semua yang sudah RSVP, terbaru dulu
//   GET  /api/rsvp?view=wishes&offset=0  ucapan, terbaru dulu
//   POST /api/rsvp  {id, name, att, count, msg}
//        id = id acak per perangkat; kirim ulang dengan id sama = update, bukan dobel.

const REDIS_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '');
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const PREFIX = (process.env.RSVP_PREFIX || 'wedding-three') + ':';

const K = {
  entries: PREFIX + 'rsvp:entries', // hash   id -> JSON entri
  order:   PREFIX + 'rsvp:order',   // zset   semua entri, skor = waktu
  hadir:   PREFIX + 'rsvp:hadir',   // zset   entri yang "Hadir"
  wishes:  PREFIX + 'rsvp:wishes',  // zset   entri yang ada ucapannya
  stats:   PREFIX + 'rsvp:stats'    // hash   hadir, hadirOrang, ragu, tidak
};
const ATT = ['Hadir', 'Belum pasti', 'Tidak bisa hadir'];
const SEATS = 50;
const PAGE_MAX = 50;
const RATE_LIMIT = 8;          // kiriman per IP
const RATE_WINDOW_SEC = 600;   // per 10 menit

async function redis(commands) {
  const res = await fetch(REDIS_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands)
  });
  if (!res.ok) throw new Error('Upstash HTTP ' + res.status);
  const out = await res.json();
  return out.map(r => {
    if (r && r.error) throw new Error('Upstash: ' + r.error);
    return r ? r.result : null;
  });
}

const clean = (s, max) => String(s == null ? '' : s)
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/\s+\n/g, '\n')
  .trim()
  .slice(0, max);

function pub(json) {
  try {
    const e = JSON.parse(json);
    return { name: e.name, att: e.att, count: e.count, msg: e.msg || '', t: e.t };
  } catch (err) {
    return null;
  }
}

function hashToObj(flat) {
  const o = {};
  if (Array.isArray(flat)) for (let i = 0; i < flat.length; i += 2) o[flat[i]] = Number(flat[i + 1]) || 0;
  else if (flat && typeof flat === 'object') for (const k in flat) o[k] = Number(flat[k]) || 0;
  return o;
}

async function entriesFor(ids) {
  if (!ids || !ids.length) return [];
  const [rows] = await redis([['HMGET', K.entries, ...ids]]);
  return (rows || []).map(pub).filter(Boolean);
}

async function summary() {
  const [stats, total, wishes, hadirIds] = await redis([
    ['HGETALL', K.stats],
    ['ZCARD', K.order],
    ['ZCARD', K.wishes],
    ['ZREVRANGE', K.hadir, 0, SEATS - 1]
  ]);
  const s = hashToObj(stats);
  return {
    stats: {
      total: Number(total) || 0,
      wishes: Number(wishes) || 0,
      hadir: s.hadir || 0,
      hadirOrang: s.hadirOrang || 0,
      ragu: s.ragu || 0,
      tidak: s.tidak || 0
    },
    seats: SEATS,
    seated: await entriesFor(hadirIds)
  };
}

async function page(key, offset, limit) {
  const [total, ids] = await redis([['ZCARD', key], ['ZREVRANGE', key, offset, offset + limit - 1]]);
  return { total: Number(total) || 0, offset, items: await entriesFor(ids) };
}

const statDelta = (e, sign) => {
  if (!e) return {};
  if (e.att === 'Hadir') return { hadir: sign, hadirOrang: sign * (Number(e.count) || 1) };
  if (e.att === 'Belum pasti') return { ragu: sign };
  return { tidak: sign };
};

async function submit(req, body) {
  const id = String(body.id || '');
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return [400, { error: 'invalid_id' }];
  const name = clean(body.name, 40).replace(/\n/g, ' ');
  if (!name) return [400, { error: 'name_required' }];
  const att = ATT.includes(body.att) ? body.att : null;
  if (!att) return [400, { error: 'invalid_att' }];
  const count = att === 'Hadir' ? Math.min(4, Math.max(1, parseInt(body.count, 10) || 1)) : 0;
  const msg = clean(body.msg, 300);

  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  const rlKey = PREFIX + 'rl:' + ip;
  const [hits] = await redis([['INCR', rlKey]]);
  if (Number(hits) === 1) await redis([['EXPIRE', rlKey, RATE_WINDOW_SEC]]);
  if (Number(hits) > RATE_LIMIT) return [429, { error: 'rate_limited' }];

  const [oldJson] = await redis([['HGET', K.entries, id]]);
  let old = null;
  try { old = oldJson ? JSON.parse(oldJson) : null; } catch (err) { old = null; }

  const now = Date.now();
  const entry = { name, att, count, msg, t: now };
  const delta = {};
  for (const [k, v] of Object.entries(statDelta(old, -1))) delta[k] = (delta[k] || 0) + v;
  for (const [k, v] of Object.entries(statDelta(entry, 1))) delta[k] = (delta[k] || 0) + v;

  const cmds = [
    ['HSET', K.entries, id, JSON.stringify(entry)],
    ['ZADD', K.order, now, id],
    att === 'Hadir' ? ['ZADD', K.hadir, now, id] : ['ZREM', K.hadir, id],
    msg ? ['ZADD', K.wishes, now, id] : ['ZREM', K.wishes, id]
  ];
  for (const [k, v] of Object.entries(delta)) if (v) cmds.push(['HINCRBY', K.stats, k, v]);
  await redis(cmds);
  return [200, { ok: true, updated: !!old, entry: { name, att, count, msg, t: now } }];
}

module.exports = async function handler(req, res) {
  const send = (status, data, cache) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', cache || 'no-store');
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };

  if (!REDIS_URL || !REDIS_TOKEN) return send(503, { error: 'not_configured' });

  try {
    if (req.method === 'GET') {
      const q = req.query || {};
      const view = String(q.view || 'summary');
      const offset = Math.max(0, parseInt(q.offset, 10) || 0);
      const limit = Math.min(PAGE_MAX, Math.max(1, parseInt(q.limit, 10) || 30));
      const cache = 'public, s-maxage=10, stale-while-revalidate=30';
      if (view === 'list') return send(200, await page(K.order, offset, limit), cache);
      if (view === 'wishes') return send(200, await page(K.wishes, offset, limit), cache);
      return send(200, await summary(), cache);
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (err) { body = null; } }
      if (!body || typeof body !== 'object') return send(400, { error: 'invalid_body' });
      const [status, data] = await submit(req, body);
      return send(status, data);
    }
    res.setHeader('Allow', 'GET, POST');
    return send(405, { error: 'method_not_allowed' });
  } catch (err) {
    console.error('[rsvp]', err);
    return send(500, { error: 'server_error' });
  }
};
