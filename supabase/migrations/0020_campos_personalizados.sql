-- Campos personalizados por categoria ou por grupo de produtos

create table campos_personalizados (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid references categorias_produto(id) on delete cascade,
  grupo_id uuid references grupos_produto(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('texto', 'numero', 'booleano', 'selecao')),
  opcoes text[],
  ordem int not null default 0,
  check ((categoria_id is not null) <> (grupo_id is not null))
);
create index idx_campos_personalizados_categoria_id on campos_personalizados(categoria_id);
create index idx_campos_personalizados_grupo_id on campos_personalizados(grupo_id);
alter table campos_personalizados enable row level security;
create policy "authenticated_read_write_campos_personalizados" on campos_personalizados
  for all to authenticated using (true) with check (true);
create policy "public_read_campos_personalizados" on campos_personalizados
  for select to anon using (true);

alter table produtos add column atributos jsonb not null default '{}'::jsonb;

create or replace view produtos_publicos as
select
  id, nome, descricao, preco_base, comprimento, subcategoria_id,
  ano, motorizacao_tipo, motorizacao_potencia, motorizacao_marca_modelo,
  combustivel, horas_uso, ultima_revisao, grupo_id, atributos
from produtos;
