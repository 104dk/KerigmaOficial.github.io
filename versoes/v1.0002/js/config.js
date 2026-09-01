/* ════════════════════════════════════════════════
   KERIGMA v1.0002 — config.js
   Constantes globais do painel admin.
   ════════════════════════════════════════════════ */
const APP_CONFIG = {
  SUPABASE_URL: 'https://vkrtogskkhumqphiftcz.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_EIF67owpIvHaeJgd5_Tfxw_3PrDj35c',
  AUTH_KEY: 'kerigma:sb-auth',
  PRODUCT_CATEGORIES: [
    'Teologia Básica',
    'Doutrina',
    'E-book',
    'Apostila',
    'Curso',
    'Pregação',
    'Família Cristã',
    'Infantil',
    'Devocional',
    'Liderança'
  ],
  PAYMENT_METHODS: {
    pix: 'Pix',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão (taxa p/ cliente)',
    link: 'Link externo',
    whatsapp: 'WhatsApp'
  },
  SALE_STATUS: {
    pendente: 'Pendente',
    pago: 'Pago',
    cancelado: 'Cancelado',
    reembolsado: 'Reembolsado'
  },
  CURRENCY: 'BRL'
};

window.APP_CONFIG = APP_CONFIG;