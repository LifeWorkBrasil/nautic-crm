create table perfis_acesso (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  criado_em timestamptz not null default now()
);

create table perfis_acesso_tabs (
  perfil_id uuid not null references perfis_acesso(id) on delete cascade,
  tab_key text not null,
  primary key (perfil_id, tab_key)
);

alter table perfis_acesso enable row level security;
alter table perfis_acesso_tabs enable row level security;

create policy "authenticated_read_write_perfis_acesso" on perfis_acesso
  for all to authenticated using (true) with check (true);
create policy "authenticated_read_write_perfis_acesso_tabs" on perfis_acesso_tabs
  for all to authenticated using (true) with check (true);
