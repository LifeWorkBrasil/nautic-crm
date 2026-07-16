-- Fase 1: catálogo multi-categoria (Náutica / Adventure / Projetos Especiais)
-- Generaliza modelos_barcos (barcos) em produtos (barcos, UTVs, piers, etc.)
-- Preserva as 10 linhas existentes — tudo via ALTER TABLE, sem drop/recreate.

alter table modelos_barcos rename to produtos;

create table categorias_produto (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique,
  ordem int not null default 0
);

create table subcategorias_produto (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid not null references categorias_produto(id) on delete restrict,
  nome text not null,
  ordem int not null default 0,
  unique (categoria_id, nome)
);

insert into categorias_produto (nome, ordem) values
  ('Náutica', 1), ('Adventure', 2), ('Projetos Especiais', 3);

insert into subcategorias_produto (categoria_id, nome, ordem)
select c.id, s.nome, s.ordem
from categorias_produto c
join (values
  ('Náutica', 'Lanchas Zero Milhas', 1),
  ('Náutica', 'Lanchas Usadas', 2),
  ('Náutica', 'JetSki', 3),
  ('Adventure', 'UTV', 1),
  ('Adventure', 'Quadriciclo', 2),
  ('Adventure', 'Carretas rodoviárias', 3),
  ('Projetos Especiais', 'Módulos Expansíveis', 1),
  ('Projetos Especiais', 'Piers Flutuantes', 2),
  ('Projetos Especiais', 'Estruturas Flutuantes', 3)
) as s(categoria_nome, nome, ordem) on s.categoria_nome = c.nome;

alter table produtos add column subcategoria_id uuid references subcategorias_produto(id) on delete restrict;

-- Backfill: os 10 produtos existentes (todos barcos) vão por padrão para "Lanchas Zero
-- Milhas" — recategorizável manualmente pela UI depois (ex: os que já são usados).
update produtos set subcategoria_id = (
  select id from subcategorias_produto where nome = 'Lanchas Zero Milhas'
) where subcategoria_id is null;

alter table produtos alter column subcategoria_id set not null;

-- Renomeia tabelas/colunas relacionadas para refletir "produto" em vez de "modelo"
alter table fotos_modelos rename to fotos_produto;
alter table fotos_produto rename column modelo_id to produto_id;

alter table videos_modelos rename to videos_produto;
alter table videos_produto rename column modelo_id to produto_id;

alter table acessorios rename column modelo_id to produto_id;
alter table orcamentos rename column modelo_id to produto_id;

-- Bucket de storage: renomeia 'modelos' -> 'produtos' (0 arquivos hoje, sem custo de migração)
update storage.buckets set id = 'produtos', name = 'produtos' where id = 'modelos';

drop policy if exists "public_read_modelos_fotos" on storage.objects;
drop policy if exists "authenticated_write_modelos_fotos" on storage.objects;

create policy "public_read_produtos_fotos" on storage.objects
  for select to public using (bucket_id = 'produtos');
create policy "authenticated_write_produtos_fotos" on storage.objects
  for all to authenticated using (bucket_id = 'produtos') with check (bucket_id = 'produtos');

-- RLS das tabelas novas, mesmo padrão do restante do schema
alter table categorias_produto enable row level security;
alter table subcategorias_produto enable row level security;

create policy "authenticated_read_write_categorias_produto" on categorias_produto
  for all to authenticated using (true) with check (true);
create policy "authenticated_read_write_subcategorias_produto" on subcategorias_produto
  for all to authenticated using (true) with check (true);
