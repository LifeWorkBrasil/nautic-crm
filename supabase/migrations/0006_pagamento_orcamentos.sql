-- Fase 4: data de entrega + condições de pagamento (entrada + parcelas)
alter table orcamentos
  add column data_prevista_entrega date,
  add column entrada_percentual numeric(5,2) not null default 0,
  add column entrada_valor numeric(12,2) not null default 0;

create table orcamentos_parcelas (
  id uuid primary key default uuid_generate_v4(),
  orcamento_id uuid not null references orcamentos(id) on delete cascade,
  numero int not null,
  percentual numeric(5,2) not null,
  valor numeric(12,2) not null,
  unique (orcamento_id, numero)
);
create index idx_orcamentos_parcelas_orcamento_id on orcamentos_parcelas(orcamento_id);

alter table orcamentos_parcelas enable row level security;
create policy "authenticated_read_write_orcamentos_parcelas" on orcamentos_parcelas
  for all to authenticated using (true) with check (true);
