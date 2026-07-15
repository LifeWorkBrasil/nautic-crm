-- Configuração da empresa (logo, dados usados nas propostas) — tabela singleton
create table if not exists empresa_config (
  id uuid primary key default uuid_generate_v4(),
  nome_empresa text not null default 'Meu Estaleiro',
  cnpj text,
  logo_url text,
  endereco text,
  telefone text,
  email text,
  site text,
  validade_orcamento_dias integer not null default 15,
  termos_condicoes text,
  atualizado_em timestamptz not null default now()
);

alter table empresa_config enable row level security;

create policy "authenticated_read_write_empresa_config" on empresa_config
  for all to authenticated using (true) with check (true);

-- leitura pública liberada, pois o logo/dados aparecem em propostas enviadas a clientes (link público)
create policy "public_read_empresa_config" on empresa_config
  for select to anon using (true);

insert into empresa_config (nome_empresa) values ('Meu Estaleiro')
on conflict do nothing;

-- Buckets de storage para logo da empresa e fotos dos modelos
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('modelos', 'modelos', true)
on conflict (id) do nothing;

create policy "public_read_branding" on storage.objects
  for select to public using (bucket_id = 'branding');

create policy "authenticated_write_branding" on storage.objects
  for all to authenticated using (bucket_id = 'branding') with check (bucket_id = 'branding');

create policy "public_read_modelos_fotos" on storage.objects
  for select to public using (bucket_id = 'modelos');

create policy "authenticated_write_modelos_fotos" on storage.objects
  for all to authenticated using (bucket_id = 'modelos') with check (bucket_id = 'modelos');
