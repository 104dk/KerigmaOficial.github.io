/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — supabase.js
   Cliente REST Supabase + sessão segura (sem senha).
   ════════════════════════════════════════════════ */

const session = { data: null };

function sbHeaders(token) {
  return {
    apikey: APP_CONFIG.SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + (token || APP_CONFIG.SUPABASE_ANON_KEY),
    'Content-Type': 'application/json'
  };
}

async function sbFetch(path, opts) {
  const res = await fetch(APP_CONFIG.SUPABASE_URL + path, opts);
  if (!res.ok) {
    let msg = 'Erro na requisição';
    try {
      const e = await res.json();
      msg = e.message || e.msg || (Array.isArray(e) && e[0]?.message) || msg;
    } catch {}
    throw new Error(msg);
  }
  return res;
}

function persistSession(data, email) {
  const toStore = {
    email: email || (data.user && data.user.email) || '',
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || (Date.now() + (data.expires_in || 3600) * 1000)
  };
  localStorage.setItem(APP_CONFIG.AUTH_KEY, JSON.stringify(toStore));
  session.data = data;
}

function clearSession() {
  session.data = null;
  localStorage.removeItem(APP_CONFIG.AUTH_KEY);
}

function loginWithPassword(email, password) {
  return sbFetch('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({ email, password })
  }).then(r => r.json());
}

async function restoreWithRefreshToken(refreshToken) {
  const res = await sbFetch('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const data = await res.json();
  persistSession(data, data.user?.email);
  return data.user;
}

/* ═══════ Helpers CRUD ═══════ */
async function sbList(table, opts = {}) {
  // opts: order, filters (array de "col=eq.val"), limit, select
  const params = [];
  if (opts.order) params.push('order=' + opts.order);
  if (opts.filters) params.push(opts.filters.join('&'));
  if (opts.limit) params.push('limit=' + opts.limit);
  if (opts.select) params.push('select=' + opts.select);
  const q = params.length ? '?' + params.join('&') : '';
  const res = await sbFetch('/rest/v1/' + table + q, {
    headers: sbHeaders(session.data?.access_token)
  });
  return res.json();
}

async function sbGet(table, id) {
  const res = await sbFetch('/rest/v1/' + table + '?id=eq.' + id + '&limit=1', {
    headers: sbHeaders(session.data?.access_token)
  });
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function sbInsert(table, row) {
  const res = await sbFetch('/rest/v1/' + table, {
    method: 'POST',
    headers: { ...sbHeaders(session.data?.access_token), Prefer: 'return=representation' },
    body: JSON.stringify(row)
  });
  return res.json();
}

async function sbUpdate(table, id, row) {
  await sbFetch('/rest/v1/' + table + '?id=eq.' + id, {
    method: 'PATCH',
    headers: sbHeaders(session.data?.access_token),
    body: JSON.stringify(row)
  });
}

async function sbDelete(table, id) {
  await sbFetch('/rest/v1/' + table + '?id=eq.' + id, {
    method: 'DELETE',
    headers: sbHeaders(session.data?.access_token)
  });
}

/* Exportar no namespace global */
window.KerigmaSupabase = {
  session, sbHeaders, sbFetch, persistSession, clearSession,
  loginWithPassword, restoreWithRefreshToken,
  sbList, sbGet, sbInsert, sbUpdate, sbDelete
};

async function login(email, password) {
  const data = await loginWithPassword(email, password);
  persistSession(data, data.user?.email);
  return data.user;
}
window.KerigmaSupabase.login = login;
