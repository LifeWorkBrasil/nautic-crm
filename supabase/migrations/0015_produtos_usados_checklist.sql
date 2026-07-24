-- Fase 5.3/9: checklist de barcos usados vendidos "como estão" + itens inclusos por produto

alter table produtos add column ano int;
alter table produtos add column motorizacao_tipo text;
alter table produtos add column motorizacao_potencia text;
alter table produtos add column motorizacao_marca_modelo text;
alter table produtos add column combustivel text;
alter table produtos add column horas_uso text;
alter table produtos add column ultima_revisao text;

alter table subcategorias_produto add column vendido_como_esta boolean not null default false;

create table produto_itens_inclusos (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references produtos(id) on delete cascade,
  nome text not null,
  descricao text,
  quantidade int,
  estado text,
  marca text
);
create index idx_produto_itens_inclusos_produto_id on produto_itens_inclusos(produto_id);

alter table produto_itens_inclusos enable row level security;
create policy "authenticated_read_write_produto_itens_inclusos" on produto_itens_inclusos
  for all to authenticated using (true) with check (true);
