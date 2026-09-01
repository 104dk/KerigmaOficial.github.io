# 🏛️ Escola de Teologia Kerigma — Site Institucional

Site de página única com dois carrosséis 3D (CoverFlow de materiais + Stage de galeria), lightbox e painel de configuração via Supabase (Auth + REST).

**Live:** https://escoladeteologiakerigma.vercel.app

---

## 📁 Estrutura

```
Kerigma_site/
├── index.html              # Página principal (tudo em um arquivo)
├── configuracoes.html      # Painel de configuração (abas, preview, Supabase)
├── hero_logo.jpeg           # Imagem de fundo do hero
├── card.js                  # (residual)
├── .git/                    # Repositório Git (origin: 104dk/KerigmaOficial.github.io)
├── .vercel/                 # Config de deploy Vercel
├── supabase/                # Migrations SQL (tabelas + RLS)
└── PADRAO.txt               # Convenções do projeto
```

---

## 🚀 Deploy

- **Plataforma:** Vercel
- **Domínio:** https://escoladeteologiakerigma.vercel.app
- **Trigger:** Push na branch `master` → auto-deploy
- **Config:** `.vercel/project.json`

---

## 🎠 Carrosséis

### 1. Materiais (CoverFlow 3D)
- 6 cards padrão + itens do JSON
- Cards em arco com `rotateY`, `translateZ`, `scale`
- Navegação circular infinita, autoplay (4.5s), touch swipe
- Cada card: imagem, título, descrição, até 3 tópicos, CTA WhatsApp
- **Tamanhos:** Desktop 280×400 | 900px 252×360 | 640px 210×306

### 2. Galeria (Stage / CoverFlow de fotos)
- 10 fotos padrão + itens do JSON
- Foto ativa em escala 1.12, laterais 0.78 e 0.55, rotação ±14°
- Posicionamento via `translateX(x) translateZ(-z) rotateY(rot) scale(s)`
- Navegação circular infinita, autoplay (4s), touch swipe
- Contador `1 / N` visível em todos os breakpoints
- **Tamanhos:** Desktop 300×200 | 900px 220×150 | 640px 170×120

### Lightbox
- Ao clicar na foto ativa da galeria → overlay fullscreen
- Setas anterior/próxima, contador, fechar (× ou Escape)
- Teclado: ← → para navegar, Escape para fechar
- Cursor `zoom-in` na foto ativa

---

## ⚙️ Configuração (Supabase Backend)

Os dados dos carrosséis ficam em duas tabelas no Supabase: `services` (materiais) e `gallery` (fotos).

### Como usar o painel de config

1. Abra `configuracoes.html` (ou o link "⚙️" no rodapé do site)
2. Faça login com as credenciais de admin do Supabase (email + senha)
3. Use as abas **Materiais** e **Galeria** para gerenciar os itens (CRUD no Supabase via REST)
4. As mudanças são lidas pelo `index.html` automaticamente (fetch no Supabase REST)

### Funcionalidades do painel

- ✅ Upload drag & drop com preview
- ✅ Preview do card como aparece no carrossel
- ✅ Editar item (corrigir dados)
- ✅ Reordenar (mover para cima/baixo)
- ✅ Remover com confirmação
- ✅ Contador de itens (adicionados + padrão)
- ✅ Toast notifications (sucesso/erro/aviso)
- ✅ Abas separadas para Materiais e Galeria
- ✅ Botão "Limpar todos os itens"
- ✅ Fallback para localStorage se o Supabase falhar

---

## 🔒 Segurança

- `escapeHtml()` em todo dado dinâmico
- `safeImage()` valida URLs de imagem
- `safeIcon()` valida classe do ícone
- `prefers-reduced-motion` desativa animações e autoplay
- `aria-label`, `aria-pressed`, `focus-visible` em todos os controles
- **Login**: a senha não é persistida no `localStorage` — apenas `email`, `access_token`, `refresh_token` e `expires_at`; a sessão é restaurada via `refresh_token`

---

## 🧩 Arquitetura dos Dados

```
                    ┌──────────────────────┐
                    │  Supabase DB         │
                    │  services | gallery  │
                    └──────┬───────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        index.html    configuracoes    localStorage
        (fetch REST)  (Auth + REST)    (fallback)
              │            │
              ▼            ▼
         Defaults      Sessão salva
         hardcoded     (sem senha)
```

**index.html:** Busca via Supabase REST (`/rest/v1/services`, `/rest/v1/gallery`), mescla com defaults. Se falhar, tenta localStorage.

**configuracoes.html:** Autentica com Supabase Auth (REST) e faz CRUD nas tabelas via REST.

---

## 🧪 Testes

O site pode ser testado localmente abrindo `index.html` no navegador.

Para testar o painel de config, abra `configuracoes.html` — faça login com as credenciais de admin do Supabase; a sessão é restaurada automaticamente via `refresh_token`.

---

## 📐 Constantes dos Carrosséis

### Materiais
| Constante | Valor |
|-----------|-------|
| SPREAD | 240 (responsive: 170 / 200) |
| Z_DEPTH | 320 (responsive: 220 / 260) |
| SCALE_MIN | 0.6 |
| OPACITY_MIN | 0.3 |
| rotateY | offset × -9° |
| Autoplay | 4500ms |

### Galeria
| Constante | Valor |
|-----------|-------|
| G_SPREAD | 280 |
| G_Z_DEPTH | 160 |
| G_ROTATION | 14° |
| ACTIVE_SCALE | 1.12 |
| SIDE_SCALE | 0.78 |
| FAR_SCALE | 0.55 |
| G_VISIBLE | 2 |
| Autoplay | 4000ms |

---

## 🖼️ Imagens

- **Serviços:** picsum.photos (520×400) — URL de fallback
- **Galeria:** Unsplash (900×600)
- **Upload:** Compressão para JPEG com 82% qualidade, máx 1400px

---

## 🛣️ Roadmap

- [x] CoverFlow 3D (materiais)
- [x] Stage carousel (galeria)
- [x] Lightbox
- [x] Painel de config com abas
- [x] Migração para Supabase (Auth + REST)
- [x] Correção de segurança no login (não guarda senha)
- [x] Layout responsivo (mobile) dos carrosséis e do painel
- [ ] Aplicar migration `site_settings` (painel de Config do Site → index.html)
- [ ] Upload de imagens para CDN (ao invés de base64 no JSON)
- [ ] Suporte a fotos retrato/paisagem na galeria
