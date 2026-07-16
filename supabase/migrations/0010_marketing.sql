create table posts_marketing (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid references produtos(id) on delete set null,
  captacao_id uuid references captacoes(id) on delete set null,
  prompt_usuario text,
  tom text,
  legenda_gerada text not null,
  foto_urls text[],
  criado_em timestamptz not null default now()
);

alter table posts_marketing enable row level security;

create policy "authenticated_read_write_posts_marketing" on posts_marketing
  for all to authenticated using (true) with check (true);
