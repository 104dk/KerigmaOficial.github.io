/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — configuracoes.js
   Módulo #/configuracoes — configurações do site (público)
   + comerciais (moeda, pagamento padrão, allow_hard_delete).
   ════════════════════════════════════════════════ */

let u = null;
const S = window.KerigmaSupabase;

function mount(content, h) {
  u = h;
  content.innerHTML = '<div class="loading"><span class="gh-spinner"></span> Carregando configurações...</div>';
  load(content);
}

async function load(content) {
  try {
    const rows = await S.sbList('site_settings', {});
    const s = Array.isArray(rows) && rows[0] ? rows[0] : {};

    content.innerHTML = `
      <div class="card">
        <h2><i class="fas fa-globe"></i> Configurações do site</h2>
        <div class="sub">Texto e identidade exibidos na loja pública.</div>
        <form id="cfgSiteForm">
          <div class="form-grid">
            <label>Nome da instituição <input id="c_hero_title" value="${u.escapeHtml(s.hero_title||'')}"></label>
            <label>Subtítulo (hero) <input id="c_hero_subtitle" value="${u.escapeHtml(s.hero_subtitle||'')}"></label>
          </div>
          <div class="form-grid-3">
            <label>WhatsApp (com DDI) <input id="c_whatsapp" value="${u.escapeHtml(s.whatsapp||'')}"></label>
            <label>Email <input id="c_email" value="${u.escapeHtml(s.email||'')}"></label>
            <label>CTA (título) <input id="c_cta_title" value="${u.escapeHtml(s.cta_title||'')}"></label>
          </div>
          <label>Texto da CTA <textarea id="c_cta_text">${u.escapeHtml(s.cta_text||'')}</textarea></label>
          <label>Mensagem padrão WhatsApp <textarea id="c_wa_text">${u.escapeHtml(s.whatsapp_text||'')}</textarea></label>
          <label>Endereço <input id="c_address" value="${u.escapeHtml(s.address||'')}"></label>
          <div class="actions"><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar site</button></div>
        </form>
      </div>

      <div class="card">
        <h2><i class="fas fa-store"></i> Configurações comerciais</h2>
        <div class="sub">Regras de venda e manutenção de dados.</div>
        <form id="cfgCommForm">
          <div class="form-grid">
            <label>Moeda
              <select id="c_currency">
                <option value="BRL" ${(s.currency||'BRL')==='BRL'?'selected':''}>Real (R$)</option>
                <option value="USD" ${s.currency==='USD'?'selected':''}>Dólar (US$)</option>
              </select>
            </label>
            <label>Forma de pagamento padrão
              <select id="c_default_pay">
                ${Object.entries(window.APP_CONFIG.PAYMENT_METHODS).map(([k,v])=>'<option value="'+k+'" '+((s.default_payment_method||'pix')===k?'selected':'')+'>'+v+'</option>').join('')}
              </select>
            </label>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid var(--color-border);border-radius:8px;margin-top:6px;">
            <div>
              <div style="font-weight:700;">Permitir exclusão definitiva de produtos com vendas</div>
              <div class="help" style="max-width:520px;">
                Quando <strong>desativado</strong>, produtos com vendas vinculadas não podem ser excluídos — são apenas
                ocultados (desativados), preservando o histórico do relatório. Quando <strong>ativado</strong>, produtos
                com vendas podem ser excluídos em cascata (itens de venda vinculados serão removidos, afetando o relatório).
              </div>
            </div>
            <input type="checkbox" id="c_hard_delete" ${s.allow_hard_delete?'checked':''} style="width:22px;min-height:22px;margin-top:4px;flex-shrink:0;">
          </div>
          <div class="actions" style="margin-top:14px;">
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar comerciais</button>
          </div>
        </form>
      </div>`;

    u.$('#cfgSiteForm').addEventListener('submit', onSaveSite);
    u.$('#cfgCommForm').addEventListener('submit', onSaveComm);
  } catch (e) {
    content.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>' + u.escapeHtml(e.message) + '</p></div>';
  }
}

async function onSaveSite(e) {
  e.preventDefault();
  const id = await firstSettingId();
  const data = {
    hero_title: u.$('#c_hero_title').value.trim(),
    hero_subtitle: u.$('#c_hero_subtitle').value.trim(),
    whatsapp: u.$('#c_whatsapp').value.trim(),
    email: u.$('#c_email').value.trim(),
    cta_title: u.$('#c_cta_title').value.trim(),
    cta_text: u.$('#c_cta_text').value.trim(),
    whatsapp_text: u.$('#c_wa_text').value.trim(),
    address: u.$('#c_address').value.trim()
  };
  try {
    if (id) await S.sbUpdate('site_settings', id, data);
    else { data.hero_title = data.hero_title || 'Kerigma'; await S.sbInsert('site_settings', data); }
    u.toast('Configurações do site salvas.', 'success');
  } catch (err) { u.toast('Erro: ' + err.message, 'error'); }
}

async function onSaveComm(e) {
  e.preventDefault();
  const id = await firstSettingId();
  const data = {
    currency: u.$('#c_currency').value,
    default_payment_method: u.$('#c_default_pay').value,
    allow_hard_delete: u.$('#c_hard_delete').checked
  };
  try {
    if (id) await S.sbUpdate('site_settings', id, data);
    else { data.hero_title = 'Kerigma'; await S.sbInsert('site_settings', data); }
    u.toast('Configurações comerciais salvas.', 'success');
    window.APP_CONFIG.CURRENCY = data.currency;
  } catch (err) { u.toast('Erro: ' + err.message, 'error'); }
}

async function firstSettingId() {
  const rows = await S.sbList('site_settings', {}).catch(() => []);
  return Array.isArray(rows) && rows[0] ? rows[0].id : null;
}

window.KerigmaModule_configuracoes = { mount };