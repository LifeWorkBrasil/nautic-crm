-- Fase 5.2: próximo contato + histórico de conversas
alter table clientes_leads add column proximo_contato date;

create table clientes_historico (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references clientes_leads(id) on delete cascade,
  texto text not null,
  criado_em timestamptz not null default now()
);
create index idx_clientes_historico_cliente_id on clientes_historico(cliente_id);

alter table clientes_historico enable row level security;
create policy "authenticated_read_write_clientes_historico" on clientes_historico
  for all to authenticated using (true) with check (true);
