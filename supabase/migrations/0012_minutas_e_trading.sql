create table minutas_contrato (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  corpo text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table minutas_contrato enable row level security;
create policy "authenticated_read_write_minutas_contrato" on minutas_contrato
  for all to authenticated using (true) with check (true);

-- Schema de trading adiantado da Fase 8 (sem a UI completa de negociação no CRM ainda)
create table contrapropostas (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references clientes_leads(id) on delete cascade,
  orcamento_id uuid references orcamentos(id) on delete set null,
  valor_proposto numeric(12,2),
  tipo_parcelamento text,
  numero_parcelas int,
  observacoes text,
  criado_em timestamptz not null default now()
);
create index idx_contrapropostas_cliente_id on contrapropostas(cliente_id);

create table contraproposta_veiculos (
  id uuid primary key default uuid_generate_v4(),
  contraproposta_id uuid not null references contrapropostas(id) on delete cascade,
  tipo_veiculo text not null,
  marca_modelo text,
  ano int,
  valor_estimado numeric(12,2)
);

create table contraproposta_imoveis (
  id uuid primary key default uuid_generate_v4(),
  contraproposta_id uuid not null references contrapropostas(id) on delete cascade,
  descricao text,
  valor_estimado numeric(12,2)
);

alter table contrapropostas enable row level security;
alter table contraproposta_veiculos enable row level security;
alter table contraproposta_imoveis enable row level security;
create policy "authenticated_read_write_contrapropostas" on contrapropostas
  for all to authenticated using (true) with check (true);
create policy "authenticated_read_write_contraproposta_veiculos" on contraproposta_veiculos
  for all to authenticated using (true) with check (true);
create policy "authenticated_read_write_contraproposta_imoveis" on contraproposta_imoveis
  for all to authenticated using (true) with check (true);
