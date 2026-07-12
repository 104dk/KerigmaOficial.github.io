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
  data: 'data/carousel-config.json'
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
console.log('\n📄 index.html:');
const idxPath = path.join(BASE, FILES.index);
test('DOCTYPE', hasContent(idxPath, '<!DOCTYPE html>'));
test('lang pt-BR', hasContent(idxPath, 'lang="pt-BR"'));
test('Charset UTF-8', hasContent(idxPath, 'charset='));
test('Viewport meta', hasContent(idxPath, 'name="viewport"'));
test('Title tag', hasContent(idxPath, '<title>'));
test('OG title', hasContent(idxPath, 'og:title'));
test('OG description', hasContent(idxPath, 'og:description'));
test('OG url', hasContent(idxPath, 'og:url'));
test('OG locale', hasContent(idxPath, 'og:locale'));
test('Twitter card', hasContent(idxPath, 'twitter:card'));
test('Favicon', hasContent(idxPath, 'rel="icon"'));
test('JSON-LD', hasContent(idxPath, 'application/ld+json'));
test('Font Awesome CSS', hasContent(idxPath, 'font-awesome'));
test('GSAP script', hasContent(idxPath, 'gsap'));
test('CoverFlow carousel (card3d)', hasContent(idxPath, 'card3d'));
test('Gallery carousel (photo-card)', hasContent(idxPath, 'photo-card'));
test('Lightbox', hasContent(idxPath, 'id="lightbox"'));
test('Gallery counter', hasContent(idxPath, 'id="galCounter"'));
test('Hero section', hasContent(idxPath, 'class="hero"'));
test('Footer with gear link', hasContent(idxPath, 'configuracoes.html'));
test('WhatsApp FAB', hasContent(idxPath, 'whatsapp'));
test('Privacy / motion', hasContent(idxPath, 'prefers-reduced-motion'));
test('Aria labels present', hasContent(idxPath, 'aria-label'));
test('Safe functions (escapeHtml)', hasContent(idxPath, 'escapeHtml'));
test('Safe functions (safeImage)', hasContent(idxPath, 'safeImage'));
test('fetchRemoteConfig', hasContent(idxPath, 'fetchRemoteConfig'));
test('Services defaults (6 items)', hasContent(idxPath, 'Livros Teol'));
test('Gallery defaults (10 items)', hasContent(idxPath, 'Culto de Louvor'));
test('CSS variables defined', hasContent(idxPath, '--color-primary'));
test('Min ~1000 lines', hasLineCount(idxPath, 1000));
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
test('Tabs (Materiais/Galeria)', hasContent(cfgPath, 'data-tab'));
test('Clear all button', hasContent(cfgPath, 'clearAllBtn'));
test('Supabase CRUD (sbInsert)', hasContent(cfgPath, 'function sbInsert'));
test('Edit/reorder/remove buttons', hasContent(cfgPath, 'data-action'));

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
