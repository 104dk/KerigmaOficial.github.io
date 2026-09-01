-- KERIGMA — seed inicial de produtos (v1.0002, modelo Jilo)
-- Insere ~10 produtos placeholders (editáveis no painel) quando o catálogo
-- estiver vazio. IDEMPOTENTE: só popula a primeira vez; NÃO toca produtos
-- já cadastrados/editados pelo admin.
-- Preços: e-books/apostilas 49.49 | cursos/combo 199.

do $$
begin
  if not exists (select 1 from public.products limit 1) then

    insert into public.products (
      title, slug, short_description, description, category, price,
      promo_price, cover_image, delivery_url, whatsapp_message,
      is_active, is_featured, sort_order
    ) values
      -- E-books / apostilas (49.49)
      ('E-book 01 — Placeholder', 'ebook-01-placeholder', 'E-book teológico. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa do e-book. Editável pelo painel (aba Produtos).', 'E-book', 49.49, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 1),
      ('E-book 02 — Placeholder', 'ebook-02-placeholder', 'E-book teológico. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa do e-book. Editável pelo painel (aba Produtos).', 'E-book', 49.49, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 2),
      ('E-book 03 — Placeholder', 'ebook-03-placeholder', 'E-book teológico. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa do e-book. Editável pelo painel (aba Produtos).', 'E-book', 49.49, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 3),
      ('Apostila 01 — Placeholder', 'apostila-01-placeholder', 'Apostila de estudo. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa da apostila. Editável pelo painel (aba Produtos).', 'Apostila', 49.49, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 4),
      ('Devocional — Placeholder', 'devocional-placeholder', 'Devocional teológico. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa do devocional. Editável pelo painel (aba Produtos).', 'Devocional', 49.49, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 5),

      -- Cursos (199)
      ('Curso 01 — Placeholder', 'curso-01-placeholder', 'Curso online com certificado. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa do curso. Editável pelo painel (aba Produtos).', 'Curso', 199.00, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 6),
      ('Curso 02 — Placeholder', 'curso-02-placeholder', 'Curso online com certificado. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa do curso. Editável pelo painel (aba Produtos).', 'Curso', 199.00, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 7),
      ('Curso 03 — Placeholder', 'curso-03-placeholder', 'Curso online com certificado. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa do curso. Editável pelo painel (aba Produtos).', 'Curso', 199.00, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 8),
      ('Curso 04 — Placeholder', 'curso-04-placeholder', 'Curso online com certificado. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa do curso. Editável pelo painel (aba Produtos).', 'Curso', 199.00, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 9),
      ('Combo Teológico — Placeholder', 'combo-teologico-placeholder', 'Combo de e-books + curso. Configure título, descrição e capa no painel de Produtos.', 'Descrição completa do combo. Editável pelo painel (aba Produtos).', 'Combo', 199.00, null, null, null, 'Olá! Tenho interesse no produto: {{title}}', true, false, 10);

    raise notice 'Seed 004: % produtos placeholder inseridos.', (select count(*) from public.products);
  else
    raise notice 'Seed 004: catalogo ja possui produtos; nenhum insert realizado.';
  end if;
end
$$;