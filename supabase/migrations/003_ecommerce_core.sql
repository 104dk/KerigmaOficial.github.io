-- KERIGMA — e-commerce core (v1.0002)
-- Tabelas: products, sales, sale_items + ajuste em site_settings (allow_hard_delete).
-- RLS: products leitura pública (só ativos) + escrita admin; sales/sale_items só admin.

-- Admin check:
-- Usuários admin devem ter app_metadata.role = 'admin' no Supabase Auth.
-- Ex.: auth.jwt() -> 'app_metadata' ->> 'role'

-- ═══════════════ PRODUCTS ═══════════════
create table if not exists public.products (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  slug                text unique,
  short_description   text not null default '',
  description         text not null default '',
  category            text not null default 'E-book',
  price               numeric(12,2) not null default 0,
  promo_price         numeric(12,2),
  cover_image         text,
  delivery_url        text,
  whatsapp_message    text not null default 'Olá! Tenho interesse no produto: {{title}}',
  is_active           boolean not null default true,
  is_featured         boolean not null default false,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (is_active);
create index if not exists products_category_idx on public.products (category);

-- Função trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ═══════════════ SALES ═══════════════
create table if not exists public.sales (
  id                uuid primary key default gen_random_uuid(),
  customer_name     text not null default '',
  customer_phone    text not null default '',
  customer_email    text,
  subtotal          numeric(12,2) not null default 0,
  discount          numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  payment_method    text not null default 'pix',
  card_fee          numeric(12,2) not null default 0,
  status            text not null default 'pendente',
  notes             text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint sales_payment_method_check check (payment_method in ('pix','dinheiro','cartao','link','whatsapp')),
  constraint sales_status_check check (status in ('pendente','pago','cancelado','reembolsado'))
);

create index if not exists sales_status_idx on public.sales (status);
create index if not exists sales_created_idx on public.sales (created_at desc);

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

-- ═══════════════ SALE ITEMS ═══════════════
create table if not exists public.sale_items (
  id              uuid primary key default gen_random_uuid(),
  sale_id         uuid not null references public.sales(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  title           text not null,
  unit_price      numeric(12,2) not null default 0,
  quantity        integer not null default 1 check (quantity > 0),
  total           numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists sale_items_sale_idx on public.sale_items (sale_id);
create index if not exists sale_items_product_idx on public.sale_items (product_id);

-- ═══════════════ SITE SETTINGS ═══════════════
create table if not exists public.site_settings (
  id            uuid primary key default gen_random_uuid(),
  hero_title    text not null default 'Escola de Teologia Kerigma',
  hero_subtitle text not null default 'Transformando vidas atraves do conhecimento biblico. Livros, e-books e cursos teologicos.',
  whatsapp      text not null default '5561981897079',
  email         text,
  cta_title     text not null default 'Comece sua jornada teologica hoje',
  cta_text      text not null default 'Entre em contato e descubra como podemos ajudar no seu crescimento espiritual e academico.',
  address       text not null default 'Rua 2, Quadra 34, Lote 30 - Jardim Europa - Luziania, GO - CEP 72855-852',
  whatsapp_text text not null default 'Ola! Gostaria de saber mais sobre a Escola de Teologia Kerigma.',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.site_settings add column if not exists allow_hard_delete boolean not null default false;
alter table public.site_settings add column if not exists currency text not null default 'BRL';
alter table public.site_settings add column if not exists default_payment_method text not null default 'pix';
alter table public.site_settings add column if not exists default_sale_status text not null default 'pendente';

insert into public.site_settings (
  hero_title,
  hero_subtitle,
  whatsapp,
  email,
  cta_title,
  cta_text,
  address,
  whatsapp_text,
  allow_hard_delete,
  currency,
  default_payment_method,
  default_sale_status
)
select
  'Escola de Teologia Kerigma',
  'Transformando vidas atraves do conhecimento biblico. Livros, e-books e cursos teologicos.',
  '5561981897079',
  'contato@kerigma.com',
  'Comece sua jornada teologica hoje',
  'Entre em contato e descubra como podemos ajudar no seu crescimento espiritual e academico.',
  'Rua 2, Quadra 34, Lote 30 - Jardim Europa - Luziania, GO - CEP 72855-852',
  'Ola! Gostaria de saber mais sobre a Escola de Teologia Kerigma.',
  false,
  'BRL',
  'pix',
  'pendente'
where not exists (select 1 from public.site_settings);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ═══════════════ RLS ═══════════════
-- products: leitura pública (só ativos p/ anon), escrita admin
alter table public.products enable row level security;

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "products_select_admin" on public.products;
create policy "products_select_admin"
  on public.products for select
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "products_insert_admin" on public.products;
create policy "products_insert_admin"
  on public.products for insert
  to authenticated
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "products_update_admin" on public.products;
create policy "products_update_admin"
  on public.products for update
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin"
  on public.products for delete
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- sales: só admin
alter table public.sales enable row level security;

drop policy if exists "sales_select_admin" on public.sales;
create policy "sales_select_admin"
  on public.sales for select
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "sales_insert_admin" on public.sales;
create policy "sales_insert_admin"
  on public.sales for insert
  to authenticated
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "sales_update_admin" on public.sales;
create policy "sales_update_admin"
  on public.sales for update
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "sales_delete_admin" on public.sales;
create policy "sales_delete_admin"
  on public.sales for delete
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- sale_items: só admin (ler junto com a venda); inserts via transaction
alter table public.sale_items enable row level security;

drop policy if exists "sale_items_select_admin" on public.sale_items;
create policy "sale_items_select_admin"
  on public.sale_items for select
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "sale_items_insert_admin" on public.sale_items;
create policy "sale_items_insert_admin"
  on public.sale_items for insert
  to authenticated
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "sale_items_delete_admin" on public.sale_items;
create policy "sale_items_delete_admin"
  on public.sale_items for delete
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_select" on public.site_settings;
create policy "site_settings_select"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "site_settings_insert" on public.site_settings;
drop policy if exists "site_settings_update" on public.site_settings;
drop policy if exists "site_settings_delete" on public.site_settings;

drop policy if exists "site_settings_insert_admin" on public.site_settings;
create policy "site_settings_insert_admin"
  on public.site_settings for insert
  to authenticated
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "site_settings_update_admin" on public.site_settings;
create policy "site_settings_update_admin"
  on public.site_settings for update
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "site_settings_delete_admin" on public.site_settings;
create policy "site_settings_delete_admin"
  on public.site_settings for delete
  to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
