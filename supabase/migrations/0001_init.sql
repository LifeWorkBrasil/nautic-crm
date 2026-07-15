-- Estaleiro CRM · schema inicial
-- Rode isso no SQL editor do Supabase, ou via `supabase db push`.

create extension if not exists "uuid-ossp";

create table if not exists modelos_barcos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  preco_base numeric(12,2) not null default 0,
  comprimento numeric(5,2),
  criado_em timestamptz not null default now()
);

create table if not exists fotos_modelos (
  id uuid primary key default uuid_generate_v4(),
  modelo_id uuid not null references modelos_barcos(id) on delete cascade,
  url_imagem text not null,
  principal boolean not null default false
);
create index if not exists idx_fotos_modelos_modelo_id on fotos_modelos(modelo_id);

create table if not exists videos_modelos (
  id uuid primary key default uuid_generate_v4(),
  modelo_id uuid not null references modelos_barcos(id) on delete cascade,
  url_youtube text not null,
  titulo text
);
create index if not exists idx_videos_modelos_modelo_id on videos_modelos(modelo_id);

create table if not exists motores (
  id uuid primary key default uuid_generate_v4(),
  marca text not null,
  modelo text not null,
  potencia integer not null,
  preco numeric(12,2) not null default 0,
  combustivel text not null check (combustivel in ('Gasolina', 'Diesel')),
  ativo boolean not null default true
);

create table if not exists acessorios (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  preco numeric(12,2) not null default 0,
  categoria text,
  modelo_id uuid references modelos_barcos(id) on delete cascade
);
create index if not exists idx_acessorios_modelo_id on acessorios(modelo_id);

create table if not exists clientes_leads (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text,
  telefone text,
  status_crm text not null default 'Lead'
    check (status_crm in ('Lead', 'Proposta Enviada', 'Negociação', 'Venda Concluída', 'Perdido')),
  origem text,
  observacoes text,
  criado_em timestamptz not null default now()
);

create table if not exists orcamentos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references clientes_leads(id) on delete cascade,
  modelo_id uuid not null references modelos_barcos(id) on delete restrict,
  motor_id uuid references motores(id) on delete restrict,
  valor_total numeric(12,2) not null default 0,
  status text not null default 'Rascunho' check (status in ('Rascunho', 'Enviado', 'Aprovado')),
  criado_em timestamptz not null default now(),
  validade timestamptz
);
create index if not exists idx_orcamentos_cliente_id on orcamentos(cliente_id);

create table if not exists orcamentos_acessorios (
  orcamento_id uuid not null references orcamentos(id) on delete cascade,
  acessorio_id uuid not null references acessorios(id) on delete restrict,
  primary key (orcamento_id, acessorio_id)
);

-- Row Level Security: liberado para qualquer usuário autenticado (equipe de vendas).
-- Ajuste as policies antes de ir para produção se precisar de granularidade por vendedor.
alter table modelos_barcos enable row level security;
alter table fotos_modelos enable row level security;
alter table videos_modelos enable row level security;
alter table motores enable row level security;
alter table acessorios enable row level security;
alter table clientes_leads enable row level security;
alter table orcamentos enable row level security;
alter table orcamentos_acessorios enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'modelos_barcos', 'fotos_modelos', 'videos_modelos', 'motores',
    'acessorios', 'clientes_leads', 'orcamentos', 'orcamentos_acessorios'
  ])
  loop
    execute format(
      'create policy "authenticated_read_write_%1$s" on %1$s
       for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
