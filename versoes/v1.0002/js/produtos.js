/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — produtos.js
   Módulo #/produtos — CRUD de produtos + preview + exclusão parametrizada.
   ════════════════════════════════════════════════ */

let u = null;          // helpers injetados pelo router
let productsCache = [];
let editId = null;

const S = window.KerigmaSupabase;

async function ensureAuth() {
  if (!S.session.data) return true; // painel ainda desconectado; leitura pública cobre ativos
  return true;
}

function mount(content, h) {
  u = h;
  content.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div>
        <h2><i class="fas fa-box"></i> Produtos</h2>
        <div class="sub">Cadastre e-commerce-books, apostilas e cursos. Gerencie preço, destaque e exibição.</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div class="filters" style="margin:0;">
          <div class="field"><input type="search" id="prodSearch" placeholder="Buscar..." style="width:200px;"></div>
          <div class="field">
            <select id="prodFilterCat" style="width:130px;">
              <option value="">Todas categorias</option>
              ${(window.APP_CONFIG.PRODUCT_CATEGORIES||[]).map(c=>'<option>'+u.escapeHtml(c)+'</option>').join('')}
            </select>
          </div>
          <div class="field">
            <select id="prodFilterStatus" style="width:120px;">
              <option value="">Todos status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" id="btnNewProduct"><i class="fas fa-plus"></i> Novo produto</button>
      </div>
    </div>
    <div class="counter" id="prodCounter">Carregando...</div>
    <div class="table-wrap" id="prodTableWrap">
      <div class="loading"><span class="gh-spinner"></span> Carregando produtos...</div>
    </div>
  `;
  content.appendChild(card);

  $prodActions(card);
  renderProducts();
}

function $prodActions(card) {
  card.querySelector('#btnNewProduct').addEventListener('click', () => openForm(null));
  card.querySelector('#prodSearch').addEventListener('input', () => renderProducts());
  card.querySelector('#prodFilterCat').addEventListener('change', () => renderProducts());
  card.querySelector('#prodFilterStatus').addEventListener('change', () => renderProducts());
}

const currentFilter = () => {
  const q = (u.$('#prodSearch').value || '').toLowerCase();
  const cat = u.$('#prodFilterCat').value;
  const status = u.$('#prodFilterStatus').value;
  return { q, cat, status };
};

async function fetchProducts() {
  const opts = { order: 'sort_order.asc' };
  const rows = await S.sbList('products', opts);
  productsCache = Array.isArray(rows) ? rows : [];
  return productsCache;
}

function productPriceHtml(p) {
  if (p.promo_price && Number(p.promo_price) > 0 && Number(p.promo_price) < Number(p.price)) {
    return '<span class="badge ok" style="text-decoration:line-through;">' + u.formatMoney(p.price) + '</span> <span class="stat-num" style="font-size:1rem;">' + u.formatMoney(p.promo_price) + '</span>';
  }
  return '<span class="stat-num" style="font-size:1rem;">' + u.formatMoney(p.price) + '</span>';
}

function coverThumb(p) {
  return p.cover_image
    ? '<img src="' + u.escapeHtml(p.cover_image) + '" alt="" style="width:42px;height:57px;object-fit:cover;border-radius:6px;">'
    : '<div style="width:42px;height:57px;border-radius:6px;background:#eef2f7;display:flex;align-items:center;justify-content:center;color:#9ca3af;"><i class="fas fa-book"></i></div>';
}

async function renderProducts() {
  const wrap = u.$('#prodTableWrap');
  const counter = u.$('#prodCounter');
  const { q, cat, status } = currentFilter();
  try {
    const list = await fetchProducts();
    const filtered = list.filter(p => {
      if (q && !(p.title||'').toLowerCase().includes(q) && !(p.category||'').toLowerCase().includes(q)) return false;
      if (cat && p.category !== cat) return false;
      if (status === 'active' && p.is_active !== true) return false;
      if (status === 'inactive' && p.is_active !== false) return false;
      return true;
    });
    counter.textContent = filtered.length + ' produto(s) de ' + list.length;
    if (!filtered.length) {
      wrap.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Nenhum produto encontrado.</p></div>';
      return;
    }
    const rows = filtered.map(p => `
      <tr>
        <td>${coverThumb(p)}</td>
        <td><strong>${u.escapeHtml(p.title)}</strong><br><span class="badge neutral">${u.escapeHtml(p.category||'')}</span></td>
        <td>${productPriceHtml(p)}</td>
        <td>${p.is_active !== false ? '<span class="badge ok">Ativo</span>' : '<span class="badge err">Inativo</span>'}
            ${p.is_featured ? '<span class="badge info">Destaque</span>' : ''}</td>
        <td class="actions">
          <button class="btn btn-outline btn-sm" data-act="edit" data-id="${p.id}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-outline btn-sm" data-act="duplicate" data-id="${p.id}"><i class="fas fa-copy"></i></button>
          <button class="btn btn-outline btn-sm" data-act="feature" data-id="${p.id}"><i class="fas fa-star"></i></button>
          <button class="btn btn-danger btn-sm" data-act="delete" data-id="${p.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
    wrap.innerHTML = '<table><thead><tr><th>Produto</th><th>Nome</th><th>Preço</th><th>Status</th><th style="text-align:right;">Ações</th></tr></thead><tbody>' + rows + '</tbody></table>';
    wrap.querySelectorAll('button[data-act]').forEach(b =>
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        const p = productsCache.find(x => x.id === id);
        if (!p) return;
        if (b.dataset.act === 'edit') openForm(p);
        else if (b.dataset.act === 'duplicate') duplicateProduct(p);
        else if (b.dataset.act === 'feature') toggleFeatured(p);
        else if (b.dataset.act === 'delete') handleDelete(p);
      }));
  } catch (e) {
    wrap.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>' + u.escapeHtml(e.message) + '</p></div>';
    counter.textContent = 'Erro ao carregar.';
  }
}

/* ═══════ FORM ═══════ */
async function anySalesFor(productId) {
  if (!productId) return false;
  try {
    const rows = await S.sbList('sale_items', { limit: 1, filters: ['product_id=eq.' + productId] });
    return Array.isArray(rows) && rows.length > 0;
  } catch { return false; }
}

async function fetchSettings() {
  try {
    const rows = await S.sbList('site_settings', { params: [] });
    const row = Array.isArray(rows) && rows[0] ? rows[0] : {};
    return { allow_hard_delete: row.allow_hard_delete === true };
  } catch { return { allow_hard_delete: false }; }
}

function openForm(p) {
  editId = p ? p.id : null;
  const isEdit = !!p;
  const title = isEdit ? 'Editar produto' : 'Novo produto';
  u.$('#content').insertAdjacentHTML('beforeend', `
    <div class="confirm-overlay open" id="prodFormOverlay" style="display:flex;">
      <div style="background:#fff;border-radius:12px;max-width:760px;width:100%;max-height:92vh;overflow-y:auto;padding:26px;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <h3 style="color:var(--color-primary);margin-bottom:4px;">${title}</h3>
        <div class="sub" style="margin-bottom:16px;">Preencha os dados abaixo.</div>
        <form id="prodForm" style="display:grid;gap:14px;">
          <div class="form-grid">
            <label>Nome do produto *
              <input id="f_title" required value="${u.escapeHtml(p?.title||'')}">
            </label>
            <label>Categoria
              <select id="f_category">
                ${(window.APP_CONFIG.PRODUCT_CATEGORIES||[]).map(c=>'<option '+(p?.category===c?'selected':'')+'>'+u.escapeHtml(c)+'</option>').join('')}
              </select>
            </label>
          </div>
          <label>Descrição curta (cartão)
            <textarea id="f_short" maxlength="160">${u.escapeHtml(p?.short_description||'')}</textarea>
          </label>
          <label>Descrição completa
            <textarea id="f_description" style="min-height:110px;">${u.escapeHtml(p?.description||'')}</textarea>
          </label>
          <div class="form-grid-3">
            <label>Preço (R$)
              <input id="f_price" type="number" step="0.01" min="0" value="${p?.price!=null?p.price:''}" required>
            </label>
            <label>Preço promocional (R$)
              <input id="f_promo" type="number" step="0.01" min="0" value="${p?.promo_price!=null?p.promo_price:''}" placeholder="Opcional">
            </label>
            <label>Ordem de exibição
              <input id="f_sort" type="number" value="${p?.sort_order!=null?p.sort_order:0}">
            </label>
          </div>
          <div class="form-grid-3">
            <label>Link da capa (URL)
              <input id="f_cover" value="${u.escapeHtml(p?.cover_image||'')}" placeholder="https://...">
            </label>
            <label>Link de entrega (URL)
              <input id="f_delivery" value="${u.escapeHtml(p?.delivery_url||'')}" placeholder="Opcional">
            </label>
            <label>Status
              <select id="f_active">
                <option value="true" ${p?.is_active!==false?'selected':''}>Ativo (visível)</option>
                <option value="false" ${p?.is_active===false?'selected':''}>Inativo (oculto)</option>
              </select>
            </label>
          </div>
          <label>Mensagem de WhatsApp p/ este produto
            <input id="f_wa" value="${u.escapeHtml(p?.whatsapp_message||'Olá! Tenho interesse no produto: {{title}}')}">
          </label>
          <div class="preview-area">
            <div class="preview-col" style="flex:1;">
              <h3>Preview do card</h3>
              <div class="product-card-preview" id="previewCard">
                <img class="pc-thumb" id="pvImg" src="${p?.cover_image?u.escapeHtml(p.cover_image):'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjI5MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVmMmY3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TZW0gY2FwYTwvdGV4dD48L3N2Zz4='}">
                <div class="pc-body">
                  <div class="pc-cat" id="pvCat">CATEGORIA</div>
                  <div class="pc-title" id="pvTitle">Nome do produto</div>
                  <div class="pc-desc" id="pvDesc">Descrição curta...</div>
                  <div class="pc-price"><span class="now" id="pvPrice">R$ 0,00</span> <span class="was" id="pvWas"></span></div>
                  <div class="pc-cta">Comprar</div>
                </div>
              </div>
            </div>
          </div>
          <div class="actions" style="margin-top:6px;">
            <button type="button" class="btn btn-outline" id="btnCancelForm">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btnSaveForm"><i class="fas fa-save"></i> Salvar produto</button>
          </div>
        </form>
      </div>
    </div>`);

  const ov = u.$('#prodFormOverlay');
  ov.addEventListener('click', e => { if (e.target === ov) closeForm(); });
  u.$('#btnCancelForm').addEventListener('click', closeForm);

  // Live preview
  const pv = {
    img: () => u.$('#pvImg'),
    cat: () => u.$('#pvCat'),
    title: () => u.$('#pvTitle'),
    desc: () => u.$('#pvDesc'),
    price: () => u.$('#pvPrice'),
    was: () => u.$('#pvWas')
  };
  const updatePreview = () => {
    const title = u.$('#f_title').value || 'Nome do produto';
    const cat = u.$('#f_category').value || 'CATEGORIA';
    const short = u.$('#f_short').value || 'Descrição curta...';
    const price = Number(u.$('#f_price').value || 0);
    const promo = Number(u.$('#f_promo').value || 0);
    const hasPromo = promo > 0 && promo < price;
    pv.title().textContent = title;
    pv.cat().textContent = cat.toUpperCase();
    pv.desc().textContent = short;
    pv.price().textContent = u.formatMoney(hasPromo ? promo : price);
    pv.was().textContent = hasPromo ? u.formatMoney(price) : '';
    const url = u.$('#f_cover').value;
    if (url) pv.img().src = url; else pv.img().src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjI5MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVmMmY3Ii8+PC9zdmc+';
  };
  ['#f_title','#f_category','#f_short','#f_price','#f_promo','#f_cover'].forEach(sel =>
    u.$(sel).addEventListener('input', updatePreview));
  updatePreview();

  u.$('#prodForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      title: u.$('#f_title').value.trim(),
      category: u.$('#f_category').value,
      short_description: u.$('#f_short').value.trim(),
      description: u.$('#f_description').value.trim(),
      price: Number(u.$('#f_price').value || 0),
      promo_price: u.$('#f_promo').value ? Number(u.$('#f_promo').value) : null,
      sort_order: Number(u.$('#f_sort').value || 0),
      cover_image: u.$('#f_cover').value.trim() || null,
      delivery_url: u.$('#f_delivery').value.trim() || null,
      is_active: u.$('#f_active').value === 'true',
      whatsapp_message: u.$('#f_wa').value.trim(),
      slug: u.slugify(u.$('#f_title').value.trim())
    };
    try {
      if (editId) {
        await S.sbUpdate('products', editId, data);
        u.toast('Produto atualizado.', 'success');
      } else {
        if (!data.title) { u.toast('Informe o nome do produto.', 'error'); return; }
        await S.sbInsert('products', data);
        u.toast('Produto criado.', 'success');
      }
      closeForm();
      renderProducts();
    } catch (err) {
      u.toast('Erro ao salvar: ' + err.message, 'error');
    }
  });
}

function closeForm() {
  const el = u.$('#prodFormOverlay');
  if (el) el.remove();
  editId = null;
}

async function duplicateProduct(p) {
  try {
    const copy = {
      title: p.title + ' (cópia)',
      category: p.category, short_description: p.short_description,
      description: p.description, price: p.price, promo_price: p.promo_price,
      cover_image: p.cover_image, delivery_url: p.delivery_url,
      is_active: false, is_featured: false,
      whatsapp_message: p.whatsapp_message, slug: u.slugify(p.title) + '-copia',
      sort_order: p.sort_order + 100
    };
    await S.sbInsert('products', copy);
    u.toast('Produto duplicado (inativo). Edite para publicar.', 'success');
    renderProducts();
  } catch (e) { u.toast('Erro: ' + e.message, 'error'); }
}

async function toggleFeatured(p) {
  try {
    await S.sbUpdate('products', p.id, { is_featured: !(p.is_featured === true) });
    u.toast(p.is_featured ? 'Removido dos destaques.' : 'Marcado como destaque.', 'success');
    renderProducts();
  } catch (e) { u.toast('Erro: ' + e.message, 'error'); }
}

/* Exclusão parametrizada */
async function handleDelete(p) {
  try {
    const hasSales = await anySalesFor(p.id);
    const { allow_hard_delete } = await fetchSettings();
    if (hasSales && !allow_hard_delete) {
      // Não pode excluir de fato → desativa
      const ok = await u.confirmBox(
        'Desativar produto',
        'Este produto possui vendas vinculadas e, com a configuração atual, não pode ser excluído definitivamente. Deseja desativá-lo (ocultá-lo da loja)?',
        'Desativar', false
      );
      if (!ok) return;
      await S.sbUpdate('products', p.id, { is_active: false });
      u.toast('Produto desativado.', 'success');
      renderProducts();
      return;
    }
    // Sem vendas: excluir normalmente. Com vendas + allow_hard_delete: excluir o produto,
    // mantendo os itens historicos sem vinculo direto por causa do on delete set null.
    const msg = hasSales
      ? 'A exclusão definitiva removerá o cadastro do produto. Os itens de venda já registrados serão mantidos para preservar o histórico, mas ficarão sem vínculo direto com o produto. Continuar?'
      : 'Excluir "' + p.title + '" definitivamente?';
    const ok = await u.confirmBox('Excluir produto', msg, 'Excluir', true);
    if (!ok) return;
    await S.sbDelete('products', p.id);
    u.toast('Produto excluído.', 'success');
    renderProducts();
  } catch (e) { u.toast('Erro: ' + e.message, 'error'); }
}

window.KerigmaModule_produtos = { mount };    
window.KerigmaModule_produtos.destroy = undefined;
