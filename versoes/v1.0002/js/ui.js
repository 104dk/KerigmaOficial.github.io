/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — ui.js
   Helpers de UI: toast, modal de confirmação, escape,
   formatação de moeda, utilitários.
   ════════════════════════════════════════════════ */

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

/* Toast */
function toast(message, type = 'success') {
  const container = $('#toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  el.innerHTML = '<i class="fas ' + (icons[type] || icons.success) + '"></i> ' + escapeHtml(message);
  container.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, 4000);
}

/* Modal de confirmação */
function confirmBox(title, msg, okLabel = 'Confirmar', danger = true) {
  return new Promise(resolve => {
    $('#confirmTitle').textContent = title;
    $('#confirmMsg').textContent = msg;
    const okBtn = $('#confirmOk');
    okBtn.textContent = okLabel;
    okBtn.classList.toggle('danger', danger);
    $('#confirmOverlay').classList.add('open');
    okBtn.onclick = () => { $('#confirmOverlay').classList.remove('open'); resolve(true); };
    $('#confirmCancel').onclick = () => { $('#confirmOverlay').classList.remove('open'); resolve(false); };
    $('#confirmOverlay').onclick = e => {
      if (e.target === $('#confirmOverlay')) { $('#confirmOverlay').classList.remove('open'); resolve(false); }
    };
  });
}

/* Formatação */
function formatMoney(value) {
  const num = Number(value || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: APP_CONFIG.CURRENCY || 'BRL' });
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* Status badges */
function statusBadge(status) {
  const colors = { pendente: 'warn', pago: 'ok', cancelado: 'err', reembolsado: 'info' };
  return '<span class="badge ' + (colors[status] || '') + '">' + escapeHtml((window.APP_CONFIG.SALE_STATUS[status] || status)) + '</span>';
}

function paymentBadge(method) {
  const label = (window.APP_CONFIG.PAYMENT_METHODS[method || ''] || method || '—');
  return '<span class="badge neutral">' + escapeHtml(label) + '</span>';
}

/* Exportar */
window.KerigmaUI = { $, $$, escapeHtml, toast, confirmBox, formatMoney, formatDate, slugify, statusBadge, paymentBadge };