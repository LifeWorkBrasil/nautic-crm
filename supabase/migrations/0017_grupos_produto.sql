-- Terceiro nível de organização: "Grupo" dentro da subcategoria

create table grupos_produto (
  id uuid primary key default uuid_generate_v4(),
  subcategoria_id uuid not null references subcategorias_produto(id) on delete cascade,
  nome text not null,
  ordem int not null default 0
);
create index idx_grupos_produto_subcategoria_id on grupos_produto(subcategoria_id);
alter table grupos_produto enable row level security;
create policy "authenticated_read_write_grupos_produto" on grupos_produto
  for all to authenticated using (true) with check (true);
create policy "public_read_grupos_produto" on grupos_produto
  for select to anon using (true);

alter table produtos add column grupo_id uuid references grupos_produto(id) on delete set null;

create or replace view produtos_publicos as
select
  id, nome, descricao, preco_base, comprimento, subcategoria_id,
  ano, motorizacao_tipo, motorizacao_potencia, motorizacao_marca_modelo,
  combustivel, horas_uso, ultima_revisao, grupo_id
from produtos;
