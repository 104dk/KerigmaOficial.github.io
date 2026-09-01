/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — dashboard.js
   Módulo #/dashboard — KPIs: produtos, vendas do dia,
   receita do mês, pedidos pendentes, ticket médio,
   últimos vendas, top produtos, atalhos.
   ════════════════════════════════════════════════ */

let u = null;
const S = window.KerigmaSupabase;

function mount(content, h) {
  u = h;
  content.innerHTML = '';
  load(content);
}

async function load(content) {
  content.innerHTML = '<div class="loading"><span class="gh-spinner"></span> Carregando dashboard...</div>';

  let products = [], sales = [], settings = null;
  const isAdmin = S.session && S.session.data ? true : false;

  const pProd = S.sbList('products', { order: 'sort_order.asc' }).then(r => Array.isArray(r) ? r : []).catch(() => []);
  const pSales = S.sbList('sales', { order: 'created_at.desc', limit: '200' }).then(r => Array.isArray(r) ? r : []).catch(() => []);
  const pSettings = S.sbList('site_settings', {}).then(r => Array.isArray(r) && r[0] ? r[0] : {}).catch(() => ({}));

  [products, sales, settings] = await Promise.all([pProd, pSales, pSettings]);

  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const paid = sales.filter(s => s.status === 'pago');
  const salesToday = paid.filter(s => new Date(s.created_at) >= startDay);
  const revenueToday = sum(salesToday.map(s => Number(s.total)));
  const salesMonth = paid.filter(s => new Date(s.created_at) >= startMonth);
  const revenueMonth = sum(salesMonth.map(s => Number(s.total)));
  const ordersMonth = sales.filter(s => new Date(s.created_at) >= startMonth).length;
  const pending = sales.filter(s => s.status === 'pendente').length;
  const avgTicket = salesMonth.length ? revenueMonth / salesMonth.length : 0;

  // top produtos (por itens vendidos)
  const items = await S.sbList('sale_items', {}).then(r => Array.isArray(r) ? r : []).catch(() => []);
  const byProd = {};
  items.forEach(it => { byProd[it.title || it.product_id] = (byProd[it.title || it.product_id] || 0) + it.quantity; });
  const top = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const activeProds = products.filter(p => p.is_active !== false).length;

  content.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon prim"><i class="fas fa-box"></i></div>
        <div><div class="stat-num">${activeProds}</div><div class="stat-label">Produtos ativos</div><div class="stat-sub">${products.length} no total</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon ok"><i class="fas fa-dollar-sign"></i></div>
        <div><div class="stat-num">${u.formatMoney(revenueToday)}</div><div class="stat-label">Vendas hoje</div><div class="stat-sub">${salesToday.length} venda(s)</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info"><i class="fas fa-chart-bar"></i></div>
        <div><div class="stat-num">${u.formatMoney(revenueMonth)}</div><div class="stat-label">Receita do mês</div><div class="stat-sub">${salesMonth.length} vendas · Ticket ${u.formatMoney(avgTicket)}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warn"><i class="fas fa-clock"></i></div>
        <div><div class="stat-num">${pending}</div><div class="stat-label">Pedidos pendentes</div><div class="stat-sub">${ordersMonth} pedidos no mês</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" id="dashTwoCol">
      <div class="card">
        <h2><i class="fas fa-history"></i> Últimas vendas</h2>
        <div class="sub">${isAdmin ? 'Sessão autenticada.' : 'Faça login para gerenciar.'}</div>
        <div id="dashRecentVendas"></div>
      </div>
      <div class="card">
        <h2><i class="fas fa-trophy"></i> Produtos mais vendidos</h2>
        <div class="sub">Ranking por itens vendidos.</div>
        <div id="dashTopProd"></div>
      </div>
    </div>

    <div class="card">
      <h2><i class="fas fa-bolt"></i> Ações rápidas</h2>
      <div class="sub">Atalhos para o dia a dia.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary" data-goto="venda"><i class="fas fa-cash-register"></i> Nova venda</button>
        <button class="btn btn-outline" data-goto="produtos"><i class="fas fa-plus"></i> Cadastrar produto</button>
        <button class="btn btn-outline" data-goto="relatorio"><i class="fas fa-chart-line"></i> Ver relatório</button>
        <button class="btn btn-outline" data-goto="configuracoes"><i class="fas fa-cog"></i> Configurações</button>
      </div>
    </div>
  `;

  content.querySelectorAll('[data-goto]').forEach(btn =>
    btn.addEventListener('click', () => window.location.hash = '#/' + btn.dataset.goto));

  renderRecentVendas(sales);
  renderTop(top);
}

function sum(arr) { return arr.reduce((a, b) => a + Number(b || 0), 0); }

function renderRecentVendas(sales) {
  const box = u.$('#dashRecentVendas');
  if (!sales.length) {
    box.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>Nenhuma venda registrada ainda.</p></div>';
    return;
  }
  box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Data</th></tr></thead><tbody>' +
    sales.slice(0, 6).map(s => `
      <tr>
        <td>${u.escapeHtml(s.customer_name || '—')}</td>
        <td><strong>${u.formatMoney(s.total)}</strong></td>
        <td>${u.paymentBadge(s.payment_method)}</td>
        <td>${u.statusBadge(s.status)}</td>
        <td>${u.formatDate(s.created_at)}</td>
      </tr>`).join('') +
    '</tbody></table></div>';
}

function renderTop(top) {
  const box = u.$('#dashTopProd');
  if (!top.length) {
    box.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Sem dados de itens vendidos.</p></div>';
    return;
  }
  box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>#</th><th>Produto</th><th>Qtd</th></tr></thead><tbody>' +
    top.map(([name, qtd], i) => `<tr><td>${i+1}</td><td>${u.escapeHtml(name)}</td><td>${qtd}</td></tr>`).join('') +
    '</tbody></table></div>';
}

window.KerigmaModule_dashboard = { mount };
