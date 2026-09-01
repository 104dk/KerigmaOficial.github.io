/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — venda.js
   Módulo #/venda — mini-PDV: busca produto, carrinho,
   cliente, pagamento, desconto, finalizar, recibo + WhatsApp.
   ════════════════════════════════════════════════ */

let u = null;
const S = window.KerigmaSupabase;
const cart = []; // { id, title, price, promo, qty }
let shopWhatsapp = '';

function mount(content, h) {
  u = h;
  S.sbList('site_settings', {}).then(rows => {
    const r = Array.isArray(rows) && rows[0] ? rows[0] : {};
    if (r.whatsapp) shopWhatsapp = r.whatsapp;
    if (r.currency) window.APP_CONFIG.CURRENCY = r.currency;
  }).catch(() => {});
  content.innerHTML = `
    <div class="sell-layout">
      <div>
        <div class="card">
          <h2><i class="fas fa-search"></i> Selecionar produtos</h2>
          <div class="sub">Clique em um produto para adicionar ao carrinho.</div>
          <div class="filters" style="margin-bottom:14px;">
            <div class="field" style="flex:1;min-width:200px;">
              <input type="search" id="vendaSearch" placeholder="Buscar produto..." style="height:44px;">
            </div>
            <div class="field">
              <select id="vendaCat" style="height:44px;">
                <option value="">Todas categorias</option>
                ${(window.APP_CONFIG.PRODUCT_CATEGORIES||[]).map(c=>'<option>'+u.escapeHtml(c)+'</option>').join('')}
              </select>
            </div>
          </div>
          <div id="vendaProducts"><div class="loading"><span class="gh-spinner"></span> Carregando...</div></div>
        </div>
      </div>
      <div class="cart-panel">
        <h3><i class="fas fa-shopping-cart"></i> Carrinho <span class="counter" id="cartCount" style="margin:0;color:var(--color-muted);font-size:0.8rem;"></span></h3>
        <div id="cartItems" style="min-height:60px;"><div class="empty-state" style="padding:16px;"><i class="fas fa-shopping-cart"></i><p style="font-size:0.8rem;">Carrinho vazio</p></div></div>
        <div class="cart-totals">
          <div class="row"><span>Subtotal</span><span id="totSub">R$ 0,00</span></div>
          <div class="row"><span>Desconto (R$)</span>
            <input type="number" id="discount" min="0" step="0.01" value="0" style="min-height:34px;width:110px;text-align:right;">
          </div>
          <div class="row"><span>Taxa cartão (R$)</span><span id="totFee">R$ 0,00</span></div>
          <div class="row total"><span>Total</span><span id="totTotal">R$ 0,00</span></div>
        </div>
        <div style="display:grid;gap:10px;margin-top:14px;">
          <input type="text" id="custName" placeholder="Nome do cliente *" style="min-height:42px;">
          <input type="tel" id="custPhone" placeholder="WhatsApp (11 99999-9999)" style="min-height:42px;">
          <input type="email" id="custEmail" placeholder="Email (opcional)" style="min-height:42px;">
          <select id="payMethod" style="min-height:42px;">
            ${Object.entries(window.APP_CONFIG.PAYMENT_METHODS).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')}
          </select>
          <button class="btn btn-primary" id="btnFinish" style="width:100%;"><i class="fas fa-check"></i> Finalizar venda</button>
        </div>
      </div>
    </div>`;

  bind(content);
  loadProducts();
}

function bind(root) {
  u.$('#vendaSearch').addEventListener('input', () => loadProducts());
  u.$('#vendaCat').addEventListener('change', () => loadProducts());
  u.$('#discount').addEventListener('input', calcTotals);
  u.$('#payMethod').addEventListener('change', calcTotals);
  u.$('#btnFinish').addEventListener('click', () => finishSale());
}

async function loadProducts() {
  const box = u.$('#vendaProducts');
  const q = (u.$('#vendaSearch').value || '').toLowerCase();
  const cat = u.$('#vendaCat').value;
  try {
    const rows = await S.sbList('products', { order: 'sort_order.asc' });
    const list = rows.filter(p => {
      if (p.is_active === false) return false;
      if (q && !(p.title||'').toLowerCase().includes(q) && !(p.category||'').toLowerCase().includes(q)) return false;
      if (cat && p.category !== cat) return false;
      return true;
    });
    if (!list.length) {
      box.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Nenhum produto ativo encontrado.</p></div>';
      return;
    }
    box.innerHTML = '<div class="product-picker">' + list.map(p => `
      <div class="pick-item" data-id="${p.id}">
        ${p.cover_image ? '<img src="'+u.escapeHtml(p.cover_image)+'" alt="">' : '<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDYiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZjJmNyIvPjwvc3ZnPg==" alt="">'}
        <div class="pi-info">
          <div class="pi-name">${u.escapeHtml(p.title)}</div>
          <div class="pi-price">
            ${(p.promo_price && Number(p.promo_price)<Number(p.price)) ? '<span class="promo">'+u.formatMoney(p.promo_price)+'</span> <s style="opacity:.6;">'+u.formatMoney(p.price)+'</s>' : u.formatMoney(p.price)}
          </div>
        </div>
        <i class="fas fa-plus-circle" style="color:var(--color-primary);"></i>
      </div>`).join('') + '</div>';
    box.querySelectorAll('.pick-item').forEach(item =>
      item.addEventListener('click', () => addToCart(rows.find(p => p.id === item.dataset.id))));
  } catch (e) {
    box.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>' + u.escapeHtml(e.message) + '</p></div>';
  }
}

function addToCart(p) {
  const existing = cart.find(i => i.id === p.id);
  if (existing) existing.qty++;
  else cart.push({ id: p.id, title: p.title, price: Number(p.price||0), promo: Number(p.promo_price||0), hasPromo: !!(p.promo_price && Number(p.promo_price)<Number(p.price)), qty: 1 });
  renderCart();
  calcTotals();
  u.toast('Adicionado: ' + p.title, 'success');
}

function unitPrice(it) { return it.hasPromo ? it.promo : it.price; }

function renderCart() {
  const box = u.$('#cartItems');
  u.$('#cartCount').textContent = cart.length ? '(' + cart.length + ' itens)' : '';
  if (!cart.length) {
    box.innerHTML = '<div class="empty-state" style="padding:16px;"><i class="fas fa-shopping-cart"></i><p style="font-size:0.8rem;">Carrinho vazio</p></div>';
    return;
  }
  box.innerHTML = cart.map((it, idx) => `
    <div class="cart-item">
      <div class="ci-name">${u.escapeHtml(it.title)}</div>
      <div class="ci-qty">
        <button data-act="minus" data-i="${idx}">−</button>
        <span style="min-width:22px;text-align:center;font-size:0.8rem;">${it.qty}</span>
        <button data-act="plus" data-i="${idx}">+</button>
      </div>
      <div class="ci-price">${u.formatMoney(unitPrice(it) * it.qty)}</div>
      <button data-act="del" data-i="${idx}" style="background:none;border:0;color:var(--color-err);cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>`).join('');
  box.querySelectorAll('button[data-act]').forEach(b =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      if (b.dataset.act === 'plus') cart[i].qty++;
      else if (b.dataset.act === 'minus') { cart[i].qty--; if (cart[i].qty<=0) cart.splice(i,1); }
      else cart.splice(i,1);
      renderCart(); calcTotals();
    }));
}

function calcTotals() {
  const subtotal = cart.reduce((s, it) => s + unitPrice(it) * it.qty, 0);
  const disc = Number(u.$('#discount').value || 0);
  const method = u.$('#payMethod').value;
  const isCard = method === 'cartao';
  const fee = isCard ? subtotal * 0.0349 : 0; // 3,49% padrão (ajustável)
  const total = Math.max(0, subtotal - disc + fee);
  u.$('#totSub').textContent = u.formatMoney(subtotal);
  u.$('#totFee').textContent = isCard ? u.formatMoney(fee) + ' <span style="font-size:0.7rem;color:var(--color-muted);">(taxa p/ cliente)</span>' : 'R$ 0,00';
  u.$('#totTotal').textContent = u.formatMoney(total);
  return { subtotal, disc, fee, total, method };
}

async function finishSale() {
  if (!cart.length) { u.toast('Carrinho vazio.', 'error'); return; }
  const name = u.$('#custName').value.trim();
  const phone = u.$('#custPhone').value.trim();
  if (!name) { u.toast('Informe o nome do cliente.', 'error'); return; }

  const c = calcTotals();
  const payload = {
    customer_name: name,
    customer_phone: phone,
    customer_email: u.$('#custEmail').value.trim() || null,
    subtotal: c.subtotal,
    discount: c.disc,
    total: c.total,
    payment_method: c.method,
    card_fee: c.fee,
    status: 'pago', // padrão; admin pode reverter depois
    notes: ''
  };

  try {
    const sale = await S.sbInsert('sales', payload);
    const saleId = Array.isArray(sale) ? sale[0].id : sale.id;
    for (const it of cart) {
      await S.sbInsert('sale_items', {
        sale_id: saleId,
        product_id: it.id,
        title: it.title,
        unit_price: unitPrice(it),
        quantity: it.qty,
        total: unitPrice(it) * it.qty
      });
    }
    u.toast('Venda registrada!', 'success');
    showRecibo(payload, cart);
    cart.length = 0;
    renderCart(); calcTotals();
    u.$('#custName').value = ''; u.$('#custPhone').value = ''; u.$('#custEmail').value = ''; u.$('#discount').value = '0';
    loadProducts();
  } catch (e) {
    u.toast('Erro ao finalizar: ' + e.message, 'error');
  }
}

function showRecibo(sale, items) {
  const num = '' + Math.round(Math.random() * 9999);
  let line = '*KERIGMA — RECIBO DE VENDA*\n';
  line += '─────────────────────\n';
  items.forEach(it => {
    line += (it.qty>1 ? it.qty + 'x ' : '') + it.title + '\n';
    line += '   ' + u.formatMoney(unitPrice(it) * it.qty) + '\n';
  });
  if (sale.discount > 0) line += 'Desconto: -' + u.formatMoney(sale.discount) + '\n';
  if (sale.card_fee > 0) line += 'Taxa cartão: +' + u.formatMoney(sale.card_fee) + '\n';
  line += '─────────────────────\n';
  line += '*Total: ' + u.formatMoney(sale.total) + '*\n';
  line += 'Cliente: ' + sale.customer_name + '\n';
  line += 'Nº: ' + num + '\n';
  line += (window.APP_CONFIG.PAYMENT_METHODS[sale.payment_method] || sale.payment_method);

  const wa = shopWhatsapp;

  u.$('#content').insertAdjacentHTML('beforeend', `
    <div class="confirm-overlay open" id="reciboOverlay" style="display:flex;">
      <div style="background:#fff;border-radius:12px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <h3 style="color:var(--color-primary);margin-bottom:8px;"><i class="fas fa-receipt"></i> Venda concluída</h3>
        <div class="recibo" id="reciboText" style="white-space:pre-wrap;">${''}</div>
        <div class="actions" style="margin-top:16px;">
          <button class="btn btn-outline" id="reciboClose">Fechar</button>
          <button class="btn btn-whatsapp" id="reciboCopy"><i class="fas fa-copy"></i> Copiar recibo</button>
          ${wa ? '<a class="btn btn-success" href="https://wa.me/'+wa+'?text='+encodeURIComponent(line)+'" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Enviar</a>' : ''}
        </div>
      </div>
    </div>`);
  u.$('#reciboText').textContent = line;
  u.$('#reciboClose').addEventListener('click', () => u.$('#reciboOverlay').remove());
  u.$('#reciboOverlay').addEventListener('click', e => { if (e.target === u.$('#reciboOverlay')) u.$('#reciboOverlay').remove(); });
  u.$('#reciboCopy').addEventListener('click', () => {
    navigator.clipboard.writeText(line).then(() => u.toast('Recibo copiado!', 'success'));
  });
}

window.KerigmaModule_venda = { mount };