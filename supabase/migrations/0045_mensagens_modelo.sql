insert into tabs_sistema (chave, label, ordem)
  values ('parametrizacao:mensagens', 'Parametrização › Mensagens', 14);

create table mensagens_modelo (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid not null references empresas(id) default auth_empresa_id(),
  nome text not null,
  atalho text not null,
  texto text not null,
  imagem_url text,
  criado_em timestamptz not null default now()
);
create index idx_mensagens_modelo_empresa_id on mensagens_modelo(empresa_id);

alter table mensagens_modelo enable row level security;
create policy "tenant_read_write_mensagens_modelo" on mensagens_modelo
  for all to authenticated
  using (empresa_id = auth_empresa_id())
  with check (empresa_id = auth_empresa_id());
