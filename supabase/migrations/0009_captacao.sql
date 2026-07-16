-- Fase 5.3: checklist de captação (itens flexíveis por categoria)
create table captacoes (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid not null references categorias_produto(id) on delete restrict,
  subcategoria_id uuid references subcategorias_produto(id) on delete set null,
  nome text not null,
  cliente_nome text,
  cliente_telefone text,
  local text,
  ano int,
  fabricante text,
  modelo text,
  identificador text,
  responsavel text,
  cor text,
  motorizacao_tipo text,
  motorizacao_potencia text,
  motorizacao_marca_modelo text,
  combustivel text,
  horas_uso text,
  ultima_revisao text,
  bateria_motor text,
  bateria_servico text,
  estado_geral text,
  observacoes text,
  status text not null default 'Em captação'
    check (status in ('Em captação', 'Aprovado', 'Publicado', 'Descartado')),
  produto_id uuid references produtos(id) on delete set null,
  criado_em timestamptz not null default now()
);

create table captacao_itens (
  id uuid primary key default uuid_generate_v4(),
  captacao_id uuid not null references captacoes(id) on delete cascade,
  nome text not null,
  descricao text,
  quantidade int,
  estado text,
  marca text
);
create index idx_captacao_itens_captacao_id on captacao_itens(captacao_id);

create table captacao_fotos (
  id uuid primary key default uuid_generate_v4(),
  captacao_id uuid not null references captacoes(id) on delete cascade,
  url_imagem text not null,
  principal boolean not null default false
);
create index idx_captacao_fotos_captacao_id on captacao_fotos(captacao_id);

alter table captacoes enable row level security;
alter table captacao_itens enable row level security;
alter table captacao_fotos enable row level security;
create policy "authenticated_read_write_captacoes" on captacoes
  for all to authenticated using (true) with check (true);
create policy "authenticated_read_write_captacao_itens" on captacao_itens
  for all to authenticated using (true) with check (true);
create policy "authenticated_read_write_captacao_fotos" on captacao_fotos
  for all to authenticated using (true) with check (true);
