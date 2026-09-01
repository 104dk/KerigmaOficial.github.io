/**
 * Smoke tests for Kerigma site
 * Run: node tests/smoke-test.js
 */
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const FILES = {
  index: 'index.html',
  config: 'configuracoes.html',
  data: 'data/carousel-config.json',
  configV1001: 'versoes/v1.0001/configuracoes.html',
  v1002Html: 'versoes/v1.0002/configuracoes.html',
  v1002Css: 'versoes/v1.0002/css/admin.css',
  v1002Admin: 'versoes/v1.0002/js/admin.js'
};

let passed = 0;
let failed = 0;

function test(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log('  ✅ ' + name + (detail ? ' (' + detail + ')' : ''));
  } else {
    failed++;
    console.log('  ❌ ' + name + (detail ? ' (' + detail + ')' : ''));
  }
}

function hasContent(filePath, pattern) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  if (pattern instanceof RegExp) return pattern.test(content);
  return content.includes(pattern);
}

function hasLineCount(filePath, minLines) {
  if (!fs.existsSync(filePath)) return false;
  return fs.readFileSync(filePath, 'utf-8').split('\n').length >= minLines;
}

console.log('\n📋 Kerigma Site — Smoke Tests\n');

/* ── File existence ── */
console.log('📁 Files:');
for (const [key, filePath] of Object.entries(FILES)) {
  test(key + ' exists', fs.existsSync(path.join(BASE, filePath)));
}

/* ── index.html ── */
console.log('\n🏬 index.html (vitrine de vendas):');
const idxPath = path.join(BASE, FILES.index);
test('DOCTYPE', hasContent(idxPath, '<!DOCTYPE html>'));
test('lang pt-BR', hasContent(idxPath, 'lang="pt-BR"'));
test('Charset UTF-8', hasContent(idxPath, 'charset='));
test('Viewport meta', hasContent(idxPath, 'name="viewport"'));
test('Title tag', hasContent(idxPath, '<title>'));
test('OG title', hasContent(idxPath, 'og:title'));
test('OG description', hasContent(idxPath, 'og:description'));
test('OG locale', hasContent(idxPath, 'og:locale'));
test('Favicon', hasContent(idxPath, 'rel="icon"'));
test('Catalog grid', hasContent(idxPath, 'id="grid"'));
test('Category filters', hasContent(idxPath, 'id="filters"') && hasContent(idxPath, 'renderFilters'));
test('Hero section', hasContent(idxPath, 'class="hero"'));
test('Comprar by WhatsApp', hasContent(idxPath, 'wa.me') && hasContent(idxPath, 'Comprar'));
test('WhatsApp top CTA', hasContent(idxPath, 'topWhatsApp'));
test('Products fetch (REST)', hasContent(idxPath, '/rest/v1/products'));
test('Settings fetch (REST)', hasContent(idxPath, '/rest/v1/site_settings'));
test('Render product cards', hasContent(idxPath, 'renderGrid'));
test('Safe image func', hasContent(idxPath, 'safeImg'));
test('Safe escape func', hasContent(idxPath, 'esc'));
test('Currency format BR', hasContent(idxPath, 'style: \'currency\''));
test('Footer with door link', hasContent(idxPath, 'versoes/v1.0002/configuracoes.html'));
test('WhatsApp mobile FAB', hasContent(idxPath, 'fab fa-whatsapp'));
test('Privacy / motion', hasContent(idxPath, 'prefers-reduced-motion'));
test('CSS variables defined', hasContent(idxPath, '--navy'));
test('</html> closing tag', hasContent(idxPath, '</html>'));

/* ── configuracoes.html ── */
console.log('\n⚙️  configuracoes.html:');
const cfgPath = path.join(BASE, FILES.config);
test('DOCTYPE', hasContent(cfgPath, '<!DOCTYPE html>'));
test('Title', hasContent(cfgPath, 'Configura'));
test('Noindex', hasContent(cfgPath, 'noindex'));
test('Supabase connection', hasContent(cfgPath, 'supabase'));
test('Auth login form', hasContent(cfgPath, 'Entrar'));
test('Notification toast system', hasContent(cfgPath, 'toastContainer'));
test('Confirm dialog', hasContent(cfgPath, 'confirm-overlay'));
test('Service form', hasContent(cfgPath, 'id="serviceForm"'));
test('Gallery form', hasContent(cfgPath, 'id="galleryForm"'));
test('Drop zone', hasContent(cfgPath, 'drop-zone'));
test('Card preview', hasContent(cfgPath, 'card-preview'));
test('Photo preview', hasContent(cfgPath, 'photo-preview'));
test('Nav sections (data-view)', hasContent(cfgPath, 'data-view'));
test('Clear all button', hasContent(cfgPath, 'clearAllBtn'));
test('Supabase CRUD (sbInsert)', hasContent(cfgPath, 'function sbInsert'));
test('Edit/reorder/remove buttons', hasContent(cfgPath, 'data-action'));

/* ── v1.0001 configuracoes.html ── */
console.log('\n🚀 v1.0001 configuracoes.html:');
const v1Path = path.join(BASE, FILES.configV1001);
test('File exists', fs.existsSync(v1Path));
test('DOCTYPE', hasContent(v1Path, '<!DOCTYPE html>'));
test('Sidebar layout', hasContent(v1Path, 'class="sidebar"'));
test('Dashboard section', hasContent(v1Path, 'id="view-dashboard"'));
test('Materiais section', hasContent(v1Path, 'id="view-materiais"'));
test('Gallery section', hasContent(v1Path, 'id="view-galeria"'));
test('Settings section (site_settings)', hasContent(v1Path, 'id="view-settings"'));
test('Hash navigation', hasContent(v1Path, 'location.hash'));
test('Mobile menu toggle', hasContent(v1Path, 'menuToggle'));
test('Sidebar overlay (mobile)', hasContent(v1Path, 'sidebarOverlay'));
test('Responsive media (900px)', hasContent(v1Path, 'max-width: 900px'));
test('Login does not persist password', hasContent(v1Path, 'JSON.stringify(toStore)') && !/JSON.stringify\(toStore\)[\s\S]{0,160}password/s.test(fs.readFileSync(v1Path, 'utf-8')));
test('Legacy session cleanup', hasContent(v1Path, 'parsed.password'));
test('Settings save function', hasContent(v1Path, 'saveSettings'));
test('Supabase CRUD preserved', hasContent(v1Path, 'function sbInsert'));

/* ── v1.0002 e-commerce panel (modular) ── */
console.log('\n🛒 v1.0002 E-commerce panel (modular):');
const v2Path = path.join(BASE, FILES.v1002Html);
const v2Css = path.join(BASE, FILES.v1002Css);
const v2js = (name) => path.join(BASE, 'versoes/v1.0002/js', name);
const V2MODULES = ['config.js', 'supabase.js', 'ui.js', 'router.js', 'dashboard.js', 'venda.js', 'produtos.js', 'relatorio.js', 'configuracoes.js', 'admin.js'];

// Shell
test('v1.0002 exists', fs.existsSync(v2Path));
test('Shell DOCTYPE', hasContent(v2Path, '<!DOCTYPE html>'));
test('Shell charset UTF-8', hasContent(v2Path, 'charset='));
test('Shell viewport', hasContent(v2Path, 'name="viewport"'));
test('Shell links css/admin.css', hasContent(v2Path, 'css/admin.css'));
test('Shell loads config.js', hasContent(v2Path, 'js/config.js'));
test('Shell loads supabase.js', hasContent(v2Path, 'js/supabase.js'));
test('Shell loads ui.js', hasContent(v2Path, 'js/ui.js'));
test('Shell loads router.js', hasContent(v2Path, 'js/router.js'));
test('Shell noinline module scripts', !/[ \t]*<script[^>]*src="js\/(dashboard|venda|produtos|relatorio|configuracoes|admin)\.js"/.test(fs.readFileSync(v2Path, 'utf-8')));
test('Shell topbar tabs (5 + admin)', (fs.readFileSync(v2Path, 'utf-8').match(/data-tab="[^"]+"/g) || []).length >= 6);
test('Shell has dashboard tab', hasContent(v2Path, 'data-tab="dashboard"'));
test('Shell has venda tab', hasContent(v2Path, 'data-tab="venda"'));
test('Shell has admin tab', hasContent(v2Path, 'data-tab="admin"'));
test('Shell bottom-nav (mobile)', hasContent(v2Path, 'class="bottom-nav"'));
test('Shell confirm modal', hasContent(v2Path, 'confirmOverlay'));
test('Shell toast container', hasContent(v2Path, 'toastContainer'));
test('Shell noindex', hasContent(v2Path, 'noindex'));

// CSS
test('CSS exists', fs.existsSync(v2Css));
test('CSS topbar layout', hasContent(v2Css, '.topbar'));
test('CSS stat grid (dashboard)', hasContent(v2Css, 'stat-grid'));
test('CSS cart/layout (venda)', hasContent(v2Css, 'sell-layout'));
test('CSS product card preview', hasContent(v2Css, 'product-card-preview'));
test('CSS bottom-nav (mobile)', hasContent(v2Css, '.bottom-nav'));
test('CSS admin panels', hasContent(v2Css, '.adm-panel'));
test('CSS responsive mobile (600px)', hasContent(v2Css, 'max-width: 600px'));

// JS modules
for (const mod of V2MODULES) {
  test('js/' + mod + ' exists', fs.existsSync(v2js(mod)));
}
const routerSrc = fs.existsSync(v2js('router.js')) ? fs.readFileSync(v2js('router.js'), 'utf-8') : '';
test('router.js: routes all modules (tabs)', V2MODULES.slice(4).every(m => routerSrc.includes(m.replace('.js', ''))));
test('router.js: tab navigation (data-tab)', hasContent(v2js('router.js'), 'data-tab'));
test('router.js: login modal', hasContent(v2js('router.js'), 'loginOverlay'));
test('supabase.js: loginWithPassword', hasContent(v2js('supabase.js'), 'grant_type=password'));
test('supabase.js: refresh_token flow', hasContent(v2js('supabase.js'), 'grant_type=refresh_token'));
test('supabase.js: no password persistence', !/localStorage.setItem\([\s\S]{0,60}password/s.test(fs.readFileSync(v2js('supabase.js'), 'utf-8')));
test('supabase.js: CRUD helpers', hasContent(v2js('supabase.js'), 'function sbInsert') && hasContent(v2js('supabase.js'), 'function sbDelete'));

// Module mounts + business rules
test('produtos.js: KerigmaModule mount', hasContent(v2js('produtos.js'), 'KerigmaModule_produtos'));
test('produtos.js: hard-delete param', hasContent(v2js('produtos.js'), 'allow_hard_delete'));
test('produtos.js: safe delete (desativar)', hasContent(v2js('produtos.js'), 'Desativar produto'));
test('venda.js: KerigmaModule mount', hasContent(v2js('venda.js'), 'KerigmaModule_venda'));
test('venda.js: cart + recibo', hasContent(v2js('venda.js'), 'cart') && hasContent(v2js('venda.js'), 'recibo'));
test('venda.js: whatsapp send', hasContent(v2js('venda.js'), 'wa.me'));
test('dashboard.js: KerigmaModule mount', hasContent(v2js('dashboard.js'), 'KerigmaModule_dashboard'));
test('dashboard.js: KPIs', hasContent(v2js('dashboard.js'), 'stat-card') || hasContent(v2js('dashboard.js'), 'Receita do mês'));
test('relatorio.js: KerigmaModule mount', hasContent(v2js('relatorio.js'), 'KerigmaModule_relatorio'));
test('relatorio.js: CSV export', hasContent(v2js('relatorio.js'), 'createObjectURL') && hasContent(v2js('relatorio.js'), '.csv'));
test('configuracoes.js: KerigmaModule mount', hasContent(v2js('configuracoes.js'), 'KerigmaModule_configuracoes'));
test('configuracoes.js: allow_hard_delete toggle', hasContent(v2js('configuracoes.js'), 'c_hard_delete'));
test('admin.js: KerigmaModule mount', hasContent(v2js('admin.js'), 'KerigmaModule_admin'));
test('admin.js: login gate', hasContent(v2js('admin.js'), 'openLoginModal') && hasContent(v2js('admin.js'), 'Conectar'));
test('admin.js: export CSV', hasContent(v2js('admin.js'), '.csv'));
test('admin.js: export JSON backup', hasContent(v2js('admin.js'), 'kerigma_backup.json'));
test('admin.js: import JSON', hasContent(v2js('admin.js'), 'admImportFile'));
test('admin.js: categories management', hasContent(v2js('admin.js'), 'PRODUCT_CATEGORIES'));

/* ── data/carousel-config.json ── */
console.log('\n📊 data/carousel-config.json:');
const dataPath = path.join(BASE, FILES.data);
let jsonValid = false;
try {
  const d = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  jsonValid = Array.isArray(d.services) && Array.isArray(d.gallery) && d.updatedAt;
} catch { jsonValid = false; }
test('Valid JSON', jsonValid);

/* ── README ── */
console.log('\n📖 README.md:');
const readmePath = path.join(BASE, 'README.md');
test('README exists', fs.existsSync(readmePath));
test('README has content', hasContent(readmePath, 'Kerigma'));

/* ── Summary ── */
console.log('\n' + '─'.repeat(40));
console.log(`\n📊 Resultado: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
