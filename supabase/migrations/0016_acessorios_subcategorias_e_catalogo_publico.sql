-- Vincular acessórios a subcategorias + expor catálogo público (view + leitura anônima)

create table acessorios_subcategorias (
  id uuid primary key default uuid_generate_v4(),
  acessorio_id uuid not null references acessorios(id) on delete cascade,
  subcategoria_id uuid not null references subcategorias_produto(id) on delete cascade
);
create index idx_acessorios_subcategorias_acessorio_id on acessorios_subcategorias(acessorio_id);
create index idx_acessorios_subcategorias_subcategoria_id on acessorios_subcategorias(subcategoria_id);

alter table acessorios_subcategorias enable row level security;
create policy "authenticated_read_write_acessorios_subcategorias" on acessorios_subcategorias
  for all to authenticated using (true) with check (true);

-- View segura para o catálogo público (nautic-catalogo-publico): expõe só colunas não sensíveis
create view produtos_publicos as
select
  id, nome, descricao, preco_base, comprimento, subcategoria_id,
  ano, motorizacao_tipo, motorizacao_potencia, motorizacao_marca_modelo,
  combustivel, horas_uso, ultima_revisao
from produtos;

grant select on produtos_publicos to anon;

create policy "public_read_categorias_produto" on categorias_produto
  for select to anon using (true);
create policy "public_read_subcategorias_produto" on subcategorias_produto
  for select to anon using (true);
create policy "public_read_fotos_produto" on fotos_produto
  for select to anon using (true);
create policy "public_read_produto_itens_inclusos" on produto_itens_inclusos
  for select to anon using (true);
create policy "public_read_videos_produto" on videos_produto
  for select to anon using (true);
