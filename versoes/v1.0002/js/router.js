/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — router.js (modelo Jilo)
   Navegação por ABAS data-tab (topbar + bottom-nav).
   Cada aba carrega seu módulo JS (um arquivo por módulo).
   ════════════════════════════════════════════════ */

const VIEWS = {
  dashboard: { title: 'Dashboard', script: 'js/dashboard.js' },
  venda: { title: 'Venda', script: 'js/venda.js' },
  produtos: { title: 'Produtos', script: 'js/produtos.js' },
  relatorio: { title: 'Relatório', script: 'js/relatorio.js' },
  configuracoes: { title: 'Configurações', script: 'js/configuracoes.js' },
  admin: { title: 'Administração', script: 'js/admin.js' }
};

let loadedScripts = new Set();

function setActiveTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.bn-item').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
}

function loadModule(name) {
  return new Promise((resolve, reject) => {
    const path = VIEWS[name].script;
    if (loadedScripts.has(path)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = path;
    s.onload = () => { loadedScripts.add(path); resolve(); };
    s.onerror = () => reject(new Error('Falha ao carregar módulo ' + path));
    document.body.appendChild(s);
  });
}

async function gotoView(name) {
  if (!VIEWS[name]) name = 'dashboard';
  const content = document.getElementById('content');
  window.scrollTo(0, 0);
  setActiveTab(name);
  if (window.KerigmaDestroyModule) { window.KerigmaDestroyModule(); delete window.KerigmaDestroyModule; }
  content.innerHTML = '<div class="loading"><span class="gh-spinner"></span> Carregando...</div>';
  try {
    await loadModule(name);
    const hook = window['KerigmaModule_' + name];
    if (hook && typeof hook.mount === 'function') {
      hook.mount(content, window.KerigmaUI);
    } else {
      content.innerHTML = '<div class="empty-state"><i class="fas fa-tools"></i><p>Módulo "' + name + '" em construção.</p></div>';
    }
  } catch (e) {
    content.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>' + escapeHtml(e.message) + '</p></div>';
  }
}

function bindTabNav() {
  document.querySelectorAll('.tab-btn, .bn-item').forEach(btn => {
    btn.addEventListener('click', () => gotoView(btn.dataset.tab));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindTabNav();
  gotoView('dashboard');
  initAuthUI();
});

/* ═══════════ AUTH UI (estado de conexão) ═══════════ */
function initAuthUI() {
  const bar = document.getElementById('sbStatusBar');
  const text = document.getElementById('sbStatusText');
  const connected = () => {
    bar.classList.add('connected');
    text.textContent = 'Online';
  };
  const disconnected = () => {
    bar.classList.remove('connected');
    text.textContent = 'Offline';
  };

  const saved = localStorage.getItem(window.APP_CONFIG.AUTH_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.password || !parsed.refresh_token) {
        localStorage.removeItem(window.APP_CONFIG.AUTH_KEY);
      } else {
        window.KerigmaSupabase.restoreWithRefreshToken(parsed.refresh_token)
          .then(connected)
          .catch(() => { localStorage.removeItem(window.APP_CONFIG.AUTH_KEY); });
      }
    } catch {}
  }

  window.KerigmaAuthUI = { connected, disconnected };
}

/* ═══════════ LOGIN MODAL ═══════════ */
function openLoginModal() {
  const SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzYwIiBoZWlnaHQ9IjQyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTIyMTNmIi8+PHBvbHlsaW5lIHBvaW50cz0iMjYsODAgMTI2LDgwIDc2LDEzMCAyNiw4MCIgc3R5bGU9ImZpbGw6IzE1MjU0NiIvPjwvc3ZnPg==';
  const content = document.getElementById('content');
  content.insertAdjacentHTML('beforeend', `
    <div class="confirm-overlay open" id="loginOverlay" style="display:flex;">
      <div class="login-dialog">
        <img src="${SVG}" alt="">
        <h3>Conectar ao painel</h3>
        <p class="sub">Use as credenciais de administrador do Kerigma.</p>
        <form id="loginForm" class="login-form">
          <label>Email <input type="email" id="loginEmail" placeholder="email@dominio.com" autocomplete="email" required></label>
          <label>Senha <input type="password" id="loginPass" placeholder="••••••••" autocomplete="current-password" required></label>
          <button type="submit" class="btn btn-primary"><i class="fas fa-sign-in-alt"></i> Conectar</button>
        </form>
      </div>
    </div>`);

  const ov = document.getElementById('loginOverlay');
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;
    const btn = document.querySelector('#loginForm button[type=submit]');
    btn.disabled = true;
    try {
      await window.KerigmaSupabase.login(email, password);
      ov.remove();
      window.KerigmaAuthUI.connected();
      window.toast('Conectado como ' + email, 'success');
    } catch (err) {
      btn.disabled = false;
      window.toast('Falha no login: ' + err.message, 'error');
    }
  });
}

window.KerigmaRouter = { gotoView, openLoginModal };