-- KERIGMA — Tabela site_settings (v1.0001)
-- Guarda os textos/configurações exibidos no site público.
-- Linha única: cada campo é uma coluna. Uso previsto pelo painel admin.

create table if not exists public.site_settings (
  id            uuid primary key default gen_random_uuid(),
  hero_title    text not null default 'Escola de Teologia Kerigma',
  hero_subtitle text not null default 'Transformando vidas através do conhecimento bíblico. Livros, e-books e cursos teológicos.',
  whatsapp      text not null default '5561981897079',
  email         text,
  cta_title     text not null default 'Comece sua jornada teológica hoje',
  cta_text      text not null default 'Entre em contato e descubra como podemos ajudar no seu crescimento espiritual e académico.',
  address       text not null default 'Rua 2, Quadra 34, Lote 30 — Jardim Europa — Luziânia, GO — CEP 72855-852',
  whatsapp_text text not null default 'Olá! Gostaria de saber mais sobre la Escola de Teologia Kerigma.',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Insert da linha inicial (valores por defecto)
insert into public.site_settings (hero_title, hero_subtitle, whatsapp, email, cta_title, cta_text, address, whatsapp_text)
values (
  'Escola de Teologia Kerigma',
  'Transformando vidas através do conhecimento bíblico. Livros, e-books e cursos teológicos.',
  '5561981897079',
  'contato@kerigma.com',
  'Comece sua jornada teológica hoje',
  'Entre em contato e descubra como podemos ajudar no seu crescimento espiritual e académico.',
  'Rua 2, Quadra 34, Lote 30 — Jardim Europa — Luziânia, GO — CEP 72855-852',
  'Olá! Gostaria de saber más sobre la Escola de Teologia Kerigma.'
)
on conflict (id) do nothing;

-- RLS: lectura pública; escritura solo admin
alter table public.site_settings enable row level security;

drop policy if exists "site_settings_select" on public.site_settings;
create policy "site_settings_select"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "site_settings_insert" on public.site_settings;
create policy "site_settings_insert"
  on public.site_settings for insert
  to authenticated
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "site_settings_update" on public.site_settings;
create policy "site_settings_update"
  on public.site_settings for update
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "site_settings_delete" on public.site_settings;
create policy "site_settings_delete"
  on public.site_settings for delete
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
