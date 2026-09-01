/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — relatorio.js
   Módulo #/relatorio — vendas por período, receita,
   ranking, clientes, forma de pagamento, filtros, CSV.
   ════════════════════════════════════════════════ */

let u = null;
const S = window.KerigmaSupabase;
let loadedSales = [];
let loadedItems = [];

function mount(content, h) {
  u = h;
  content.innerHTML = `
    <div class="card">
      <h2><i class="fas fa-chart-line"></i> Relatório de vendas</h2>
      <div class="sub">Filtre por período e forma de pagamento. Exporte em CSV.</div>
      <div class="filters">
        <div class="field"><label>De</label><input type="date" id="relFrom"></div>
        <div class="field"><label>Até</label><input type="date" id="relTo"></div>
        <div class="field"><label>Pagamento</label>
          <select id="relMethod">
            <option value="">Todos</option>
            ${Object.entries(window.APP_CONFIG.PAYMENT_METHODS).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')}
          </select>
        </div>
        <div class="field"><label>Status</label>
          <select id="relStatus">
            <option value="">Todos</option>
            ${Object.entries(window.APP_CONFIG.SALE_STATUS).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="relApply" style="height:40px;"><i class="fas fa-filter"></i> Aplicar</button>
        <button class="btn btn-outline" id="relExport" style="height:40px;"><i class="fas fa-file-csv"></i> Exportar CSV</button>
      </div>
      <div class="stat-grid" id="relStats"></div>
      <div id="relTableBox"><div class="loading"><span class="gh-spinner"></span> Carregando...</div></div>
    </div>`;

  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  u.$('#relFrom').value = fmt(first);
  u.$('#relTo').value = fmt(today);
  u.$('#relFrom').max = fmt(today);
  u.$('#relTo').max = fmt(today);

  u.$('#relApply').addEventListener('click', () => apply());
  u.$('#relExport').addEventListener('click', () => exportCsv());
  u.$('#relMethod').addEventListener('change', () => apply());
  u.$('#relStatus').addEventListener('change', () => apply());

  apply();
}

function fmt(d) { return d.toISOString().slice(0, 10); }

function endOfDay(dateStr) { return new Date(dateStr + 'T23:59:59'); }

async function fetchAll() {
  const [sales, items] = await Promise.all([
    S.sbList('sales', { order: 'created_at.desc' }).then(r => Array.isArray(r) ? r : []).catch(() => []),
    S.sbList('sale_items', {}).then(r => Array.isArray(r) ? r : []).catch(() => [])
  ]);
  loadedSales = sales; loadedItems = items;
}

function filtered() {
  const fromStr = u.$('#relFrom').value;
  const toStr = u.$('#relTo').value;
  const method = u.$('#relMethod').value;
  const status = u.$('#relStatus').value;
  const from = fromStr ? new Date(fromStr + 'T00:00:00') : new Date(0);
  const to = toStr ? endOfDay(toStr) : new Date(8640000000000000);
  return loadedSales.filter(s => {
    const d = new Date(s.created_at);
    if (d < from || d > to) return false;
    if (method && s.payment_method !== method) return false;
    if (status && s.status !== status) return false;
    return true;
  });
}

async function apply() {
  const stats = u.$('#relStats');
  const box = u.$('#relTableBox');
  try {
    await fetchAll();
    const list = filtered();
    const paid = list.filter(s => s.status === 'pago');
    const revenue = sum(paid.map(s => Number(s.total)));
    const orders = list.length;
    const avg = paid.length ? revenue / paid.length : 0;
    const countMethod = {};
    list.forEach(s => countMethod[s.payment_method] = (countMethod[s.payment_method]||0)+1);

    stats.innerHTML = `
      <div class="stat-card"><div class="stat-icon info"><i class="fas fa-box"></i></div><div><div class="stat-num">${orders}</div><div class="stat-label">Pedidos</div></div></div>
      <div class="stat-card"><div class="stat-icon ok"><i class="fas fa-dollar-sign"></i></div><div><div class="stat-num">${u.formatMoney(revenue)}</div><div class="stat-label">Receita (pagos)</div></div></div>
      <div class="stat-card"><div class="stat-icon prim"><i class="fas fa-tag"></i></div><div><div class="stat-num">${u.formatMoney(avg)}</div><div class="stat-label">Ticket médio</div></div></div>
      <div class="stat-card"><div class="stat-icon warn"><i class="fas fa-credit-card"></i></div><div><div class="stat-num">${Object.entries(countMethod).map(([k,v])=>'<span style="font-size:.8rem;">'+u.escapeHtml(window.APP_CONFIG.PAYMENT_METHODS[k]||k)+':</span> '+v).join('<br>')}</div><div class="stat-label">Por pagamento</div></div></div>`;

    if (!list.length) {
      box.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>Nenhuma venda no período.</p></div>';
      return;
    }
    box.innerHTML = '<div class="counter" style="margin-bottom:10px;">' + list.length + ' venda(s)</div><div class="table-wrap"><table><thead><tr><th>Data</th><th>Cliente</th><th>Forma</th><th>Status</th><th>Itens</th><th style="text-align:right;">Total</th></tr></thead><tbody>' +
      list.map(s => `<tr>
        <td>${u.formatDate(s.created_at)}</td>
        <td>${u.escapeHtml(s.customer_name||'—')}</td>
        <td>${u.paymentBadge(s.payment_method)}</td>
        <td>${u.statusBadge(s.status)}</td>
        <td>${itemsFor(s.id)}</td>
        <td style="text-align:right;font-weight:700;">${u.formatMoney(s.total)}</td>
      </tr>`).join('') + '</tbody></table></div>';
  } catch (e) {
    box.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>' + u.escapeHtml(e.message) + '</p></div>';
  }
}

function itemsFor(saleId) {
  const its = loadedItems.filter(i => i.sale_id === saleId);
  return its.slice(0, 3).map(i => (i.quantity>1?i.quantity+'x ':'') + i.title).join(', ') + (its.length>3 ? ' …' : '');
}

function sum(arr) { return arr.reduce((a,b)=>a+Number(b||0),0); }

function exportCsv() {
  const list = filtered();
  if (!list.length) { u.toast('Nada para exportar.', 'warning'); return; }
  const header = ['Data','Cliente','Forma','Status','Total','Desconto','Taxa','Itens'];
  const rows = list.map(s => [
    new Date(s.created_at).toLocaleString('pt-BR'),
    (s.customer_name||'').replace(/"/g,'""'),
    window.APP_CONFIG.PAYMENT_METHODS[s.payment_method]||s.payment_method,
    window.APP_CONFIG.SALE_STATUS[s.status]||s.status,
    s.total, s.discount, s.card_fee || 0,
    itemsFor(s.id).replace(/"/g,'""')
  ]);
  const csv = [header, ...rows].map(r => r.map(v => typeof v === 'string' ? '"' + v + '"' : v).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'relatorio_kerigma.csv'; a.click();
  URL.revokeObjectURL(url);
  u.toast('CSV exportado.', 'success');
}

window.KerigmaModule_relatorio = { mount };