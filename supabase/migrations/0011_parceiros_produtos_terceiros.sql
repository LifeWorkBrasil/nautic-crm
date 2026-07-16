create table parceiros (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  contato text,
  telefone text,
  observacoes text,
  criado_em timestamptz not null default now()
);
alter table parceiros enable row level security;
create policy "authenticated_read_write_parceiros" on parceiros
  for all to authenticated using (true) with check (true);

alter table produtos
  add column origem_captacao text not null default 'Próprio'
    check (origem_captacao in ('Próprio', 'Terceiro')),
  add column captador_nome text,
  add column parceiro_id uuid references parceiros(id) on delete set null;
