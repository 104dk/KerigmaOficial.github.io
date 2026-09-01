/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — admin.js
   Módulo #admin — aba dedicada de administração.
   Login Supabase, export/import de dados, categorias,
   sessão e manutenção.
   ════════════════════════════════════════════════ */

let u = null;
const S = window.KerigmaSupabase;

function mount(content, h) {
  u = h;
  content.innerHTML = '';
  render(content);
}

function isAuth() {
  return !!(S.session && S.session.data);
}

async function render(content) {
  if (!isAuth()) {
    content.innerHTML = `
      <div class="card login-banner" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:linear-gradient(135deg,var(--navy),var(--navy-deep));color:#fff;">
        <div>
          <h2 style="color:#fff;"><i class="fas fa-user-shield"></i> Área restrita</h2>
          <div class="sub" style="color:rgba(255,255,255,0.85);">Conecte-se para gerenciar dados, categorias e preferências.</div>
        </div>
        <button class="btn btn-primary" id="admConnect" style="background:var(--gold);color:var(--navy);"><i class="fas fa-sign-in-alt"></i> Conectar</button>
      </div>
      <div class="empty-state"><i class="fas fa-lock"></i><p>Faça login para acessar a administração.</p></div>`;
    content.querySelector('#admConnect').addEventListener('click', () => { if (window.KerigmaRouter) window.KerigmaRouter.openLoginModal(); else openLoginModal(); });
    return;
  }

  const email = S.session.data.user ? S.session.data.user.email : (S.session.data.email || '');
  const isAdmin = S.session.data.user && S.session.data.user.role === 'admin';

  content.innerHTML = `
    <div class="card" style="border-left:5px solid var(--gold);">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <h2><i class="fas fa-user-shield"></i> Administração</h2>
          <div class="sub">Conectado como <strong>${u.escapeHtml(email)}</strong>${isAdmin ? ' · <span class="badge ok">admin</span>' : ''}</div>
        </div>
        <button class="btn btn-outline" id="admLogout"><i class="fas fa-sign-out-alt"></i> Sair</button>
      </div>
    </div>

    <div class="adm-grid">
      <div class="adm-panel">
        <h3><i class="fas fa-archive"></i> Exportar dados</h3>
        <div class="sub">Baixe um backup dos dados em CSV ou JSON.</div>
        <div class="actions">
          <button class="btn btn-outline btn-sm" id="admExportProdutos"><i class="fas fa-file-csv"></i> Produtos CSV</button>
          <button class="btn btn-outline btn-sm" id="admExportVendas"><i class="fas fa-file-csv"></i> Vendas CSV</button>
          <button class="btn btn-outline btn-sm" id="admExportJSON"><i class="fas fa-file-code"></i> Backup JSON</button>
        </div>
      </div>

      <div class="adm-panel">
        <h3><i class="fas fa-upload"></i> Importar dados</h3>
        <div class="sub">Importe um backup JSON para restaurar produtos.</div>
        <label class="drop-zone" style="padding:18px;cursor:pointer;">
          <span class="dz-hint"><i class="fas fa-file-import"></i> Selecionar arquivo JSON</span>
          <input type="file" id="admImportFile" accept=".json">
        </label>
        <div id="admImportMsg"></div>
      </div>

      <div class="adm-panel">
        <h3><i class="fas fa-tags"></i> Categorias de produto</h3>
        <div class="sub">Adicione ou remova categorias usadas nos produtos.</div>
        <div class="gh-row">
          <input type="text" id="admNewCat" placeholder="Nova categoria">
          <button class="btn btn-primary btn-sm" id="admAddCat"><i class="fas fa-plus"></i> Add</button>
        </div>
        <div id="admCatList" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;"></div>
      </div>

      <div class="adm-panel">
        <h3><i class="fas fa-database"></i> Sessão e manutenção</h3>
        <div class="sub">Recarregue o painel ou limpe os dados locais temporários.</div>
        <div class="actions">
          <button class="btn btn-outline btn-sm" id="admReload"><i class="fas fa-sync"></i> Recarregar</button>
          <button class="btn btn-danger btn-sm" id="admClearLocal"><i class="fas fa-broom"></i> Limpar localStorage</button>
        </div>
      </div>
    </div>`;

  content.querySelector('#admLogout').addEventListener('click', () => {
    S.clearSession();
    u.toast('Desconectado.', 'info');
    render(content);
  });
  content.querySelector('#admReload').addEventListener('click', () => window.location.reload());
  content.querySelector('#admClearLocal').addEventListener('click', async () => {
    const ok = await u.confirmBox('Limpar localStorage', 'Isso remove sessão e preferências locais (não afeta o banco). Continuar?', 'Limpar', true);
    if (!ok) return;
    localStorage.clear();
    u.toast('Local limpo. Recarregando...', 'success');
    setTimeout(() => window.location.reload(), 600);
  });
  content.querySelector('#admExportProdutos').addEventListener('click', () => exportTableCsv('products'));
  content.querySelector('#admExportVendas').addEventListener('click', () => exportTableCsv('sales'));
  content.querySelector('#admExportJSON').addEventListener('click', exportJson);
  content.querySelector('#admImportFile').addEventListener('change', importJson);
  content.querySelector('#admAddCat').addEventListener('click', addCategory);

  renderCategories(content);
}

function renderCategories(content) {
  const box = content.querySelector('#admCatList');
  if (!box) return;
  const cats = window.APP_CONFIG.PRODUCT_CATEGORIES || [];
  box.innerHTML = cats.map((c, i) => `
    <span class="badge neutral" style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;">
      ${u.escapeHtml(c)}
      <button data-cat="${i}" style="background:none;border:0;color:var(--red);cursor:pointer;font-size:0.7rem;padding:0 2px;"><i class="fas fa-times"></i></button>
    </span>`).join('');
  box.querySelectorAll('button[data-cat]').forEach(b => {
    b.addEventListener('click', async () => {
      const i = Number(b.dataset.cat);
      const cat = window.APP_CONFIG.PRODUCT_CATEGORIES[i];
      const ok = await u.confirmBox('Remover categoria', 'Remover "' + cat + '" das categorias de produto?', 'Remover', true);
      if (!ok) return;
      window.APP_CONFIG.PRODUCT_CATEGORIES.splice(i, 1);
      renderCategories(content);
      u.toast('Categoria removida.', 'success');
    });
  });
}

function addCategory() {
  const box = u.$('#admNewCat');
  const val = box.value.trim();
  if (!val) { u.toast('Digite um nome de categoria.', 'warning'); return; }
  if ((window.APP_CONFIG.PRODUCT_CATEGORIES || []).includes(val)) { u.toast('Categoria já existe.', 'warning'); return; }
  window.APP_CONFIG.PRODUCT_CATEGORIES.push(val);
  box.value = '';
  renderCategories(document.getElementById('content'));
  u.toast('Categoria adicionada.', 'success');
}

async function exportTableCsv(table) {
  try {
    const rows = await S.sbList(table, {});
    if (!Array.isArray(rows) || !rows.length) { u.toast('Nada para exportar em ' + table + '.', 'warning'); return; }
    const cols = Object.keys(rows[0]);
    const lines = [
      cols.join(';'),
      ...rows.map(r => cols.map(c => {
        let v = r[c];
        if (v == null) v = '';
        v = String(v).replace(/"/g, '""');
        return '"' + v + '"';
      }).join(';'))
    ];
    downloadFile(table + '_kerigma.csv', '\uFEFF' + lines.join('\n'), 'text/csv;charset=utf-8');
    u.toast('CSV exportado.', 'success');
  } catch (e) { u.toast('Erro: ' + e.message, 'error'); }
}

async function exportJson() {
  try {
    const [products, sales, items, settings] = await Promise.all([
      S.sbList('products', {}).catch(() => []),
      S.sbList('sales', {}).catch(() => []),
      S.sbList('sale_items', {}).catch(() => []),
      S.sbList('site_settings', {}).catch(() => [])
    ]);
    const payload = { products, sales, sale_items: items, site_settings: settings, exportedAt: new Date().toISOString() };
    downloadFile('kerigma_backup.json', JSON.stringify(payload, null, 2), 'application/json');
    u.toast('Backup JSON exportado.', 'success');
  } catch (e) { u.toast('Erro: ' + e.message, 'error'); }
}

async function importJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const msg = u.$('#admImportMsg');
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const prods = data.products || data;
    if (!Array.isArray(prods)) throw new Error('Formato não reconhecido');
    let count = 0;
    for (const p of prods) {
      if (!p.title) continue;
      const row = {
        title: p.title, category: p.category || 'E-book', short_description: p.short_description || '',
        description: p.description || '', price: Number(p.price || 0), promo_price: p.promo_price != null ? Number(p.promo_price) : null,
        cover_image: p.cover_image || null, delivery_url: p.delivery_url || null,
        is_active: p.is_active !== false, is_featured: !!p.is_featured,
        sort_order: Number(p.sort_order || 0), whatsapp_message: p.whatsapp_message || 'Olá! Tenho interesse no produto: {{title}}',
        slug: window.KerigmaUI.slugify(p.title)
      };
      await S.sbInsert('products', row);
      count++;
    }
    msg.textContent = count + ' produto(s) importado(s).';
    u.toast(count + ' produto(s) importados.', 'success');
  } catch (err) {
    msg.textContent = 'Falha: ' + err.message;
    u.toast('Falha na importação.', 'error');
  }
  e.target.value = '';
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

window.KerigmaModule_admin = { mount };