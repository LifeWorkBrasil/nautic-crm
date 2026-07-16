-- Fase 3: manuais em PDF anexados ao produto
create table manuais_produto (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references produtos(id) on delete cascade,
  url_arquivo text not null,
  nome_arquivo text not null,
  criado_em timestamptz not null default now()
);
create index idx_manuais_produto_produto_id on manuais_produto(produto_id);

alter table manuais_produto enable row level security;
create policy "authenticated_read_write_manuais_produto" on manuais_produto
  for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('manuais', 'manuais', true)
on conflict (id) do nothing;

create policy "public_read_manuais" on storage.objects
  for select to public using (bucket_id = 'manuais');
create policy "authenticated_write_manuais" on storage.objects
  for all to authenticated using (bucket_id = 'manuais') with check (bucket_id = 'manuais');
