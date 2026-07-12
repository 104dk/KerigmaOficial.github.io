# 🏛️ Escola de Teologia Kerigma — Site Institucional

Site de página única com dois carrosséis 3D (CoverFlow de materiais + Stage de galeria), lightbox e painel de configuração via GitHub API.

**Live:** https://escoladeteologiakerigma.vercel.app

---

## 📁 Estrutura

```
Kerigma_site/
├── index.html              # Página principal (tudo em um arquivo)
├── configuracoes.html      # Painel de configuração (abas, preview, GitHub)
├── data/
│   └── carousel-config.json # Dados dos carrosséis (versionado no GitHub)
├── hero_logo.jpeg           # Imagem de fundo do hero
├── card.js                  # (residual)
├── .git/                    # Repositório Git (origin: 104dk/kerigma-site)
├── .vercel/                 # Config de deploy Vercel
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

## ⚙️ Configuração (GitHub Backend)

Os dados dos carrosséis ficam em `data/carousel-config.json` no próprio repositório.

### Como usar o painel de config

1. Abra `configuracoes.html` (ou o link "⚙️" no rodapé do site)
2. Crie um **Personal Access Token** no GitHub:
   - https://github.com/settings/tokens/new?description=Kerigma+Config&scopes=repo
   - Escopo: `public_repo` (repositório público) ou `repo` (privado)
3. Cole o token no campo "Conexão com GitHub" e clique **Conectar**
4. O token fica salvo no `localStorage` do navegador
5. Use as abas **Materiais** e **Galeria** para gerenciar os itens
6. Cada adição, edição, reordenação ou remoção faz **commit automático** no GitHub
7. O commit dispara **auto-deploy** no Vercel (alguns segundos)

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
- ✅ Fallback para localStorage se GitHub falhar

---

## 🔒 Segurança

- `escapeHtml()` em todo dado dinâmico
- `safeImage()` valida URLs de imagem
- `safeIcon()` valida classe do ícone
- `prefers-reduced-motion` desativa animações e autoplay
- `aria-label`, `aria-pressed`, `focus-visible` em todos os controles
- Token GitHub salvo apenas no `localStorage` (não enviado a servidores)

---

## 🧩 Arquitetura dos Dados

```
                    ┌──────────────────────┐
                    │  data/carousel-config │
                    │  .json (repositório)  │
                    └──────┬───────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        index.html    configuracoes    localStorage
        (fetch())     (GitHub API)     (fallback)
              │            │
              ▼            ▼
         Defaults      Token salvo
         hardcoded     no navegador
```

**index.html:** Busca o JSON via `fetch()`, mescla com defaults. Se falhar, tenta localStorage.

**configuracoes.html:** Lê via GitHub Contents API (GET) e escreve com PUT + commit.

---

## 🧪 Testes

O site pode ser testado localmente abrindo `index.html` no navegador.

Para testar o painel de config, abra `configuracoes.html` — o token fica salvo no navegador, então só precisa conectar uma vez.

---

## 📐 Constantes dos Carrosséis

### Materiais
| Constante | Valor |
|-----------|-------|
| SPREAD | 240 |
| Z_DEPTH | 320 |
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
- [x] GitHub API backend
- [ ] Autenticação no painel de config
- [ ] Upload de imagens para CDN (ao invés de base64 no JSON)
- [ ] Suporte a fotos retrato/paisagem na galeria
