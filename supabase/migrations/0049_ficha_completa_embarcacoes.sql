-- Ficha completa de embarcações: fornecedores, itens/equipamentos instalados
-- (motor/gerador/ar-condicionado/acessórios), estado geral do casco e histórico
-- de manutenção com anexos — baseado no checklist real de captação da equipe.

-- Passo 0: reconciliar correções aplicadas ao vivo mais cedo hoje (idempotente)
-- — o arquivo local 0047 ficou desatualizado em relação ao que já está em
-- produção (default de empresa_id em marinas/embarcacoes + trigger
-- sync_empresa_id nas 5 tabelas-filha do módulo).
alter table marinas alter column empresa_id set default auth_empresa_id();
alter table embarcacoes alter column empresa_id set default auth_empresa_id();

do $$
declare
  t record;
begin
  for t in select unnest(array['embarcacoes_tags','embarcacoes_manutencoes','embarcacoes_limpezas','embarcacoes_movimentacoes','embarcacoes_acessorios']) as tabela
  loop
    if not exists (
      select 1 from pg_trigger
      where tgname = 'trg_sync_empresa_id' and tgrelid = t.tabela::regclass
    ) then
      execute format(
        'create trigger trg_sync_empresa_id before insert or update of embarcacao_id on %I for each row execute function sync_empresa_id(''embarcacoes'', ''embarcacao_id'')',
        t.tabela
      );
    end if;
  end loop;
end $$;

-- Fornecedores
create table fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  servicos jsonb not null default '[]'::jsonb,
  marcas jsonb not null default '[]'::jsonb,
  observacoes text,
  empresa_id uuid not null references empresas(id) default auth_empresa_id(),
  criado_em timestamptz not null default now()
);
alter table fornecedores enable row level security;
create policy tenant_read_write_fornecedores on fornecedores for all using (empresa_id = auth_empresa_id());
revoke all on fornecedores from anon;
create index idx_fornecedores_empresa on fornecedores(empresa_id);

-- Embarcações: cabeçalho completo + estado geral (checklist de vistoria do casco)
alter table embarcacoes
  add column fabricante text,
  add column modelo text,
  add column cor_costado text,
  add column ano integer,
  add column estado_geral jsonb not null default '{}'::jsonb;

-- Itens/equipamentos instalados (motor, gerador, ar-condicionado, acessórios) —
-- generalizados numa tabela só, discriminados por categoria, pra dar um único
-- mecanismo de histórico de revisão (embarcacoes_manutencoes.item_id) pra
-- qualquer equipamento, inclusive suportando 2+ motores por embarcação.
alter table embarcacoes_acessorios
  add column categoria text not null default 'ACESSORIO' check (categoria in ('MOTOR','GERADOR','AR_CONDICIONADO','ACESSORIO')),
  add column marca text,
  add column modelo text,
  add column quantidade integer not null default 1,
  add column possui boolean not null default true,
  add column estado text,
  add column caracteristicas text,
  add column potencia text,
  add column tipo text,
  add column combustivel text,
  add column ano integer,
  add column joystick boolean,
  add column horas_uso numeric,
  add column ultima_revisao_em date,
  add column fornecedor_id uuid references fornecedores(id) on delete set null,
  add column observacoes text;
create index idx_acessorios_categoria on embarcacoes_acessorios(embarcacao_id, categoria);

-- Histórico de manutenção: link a item, horímetro no momento, fornecedor,
-- anexos (NF de serviço / relatório de manutenção em PDF). Coluna `fotos`
-- existente continua só para fotos.
alter table embarcacoes_manutencoes
  add column item_id uuid references embarcacoes_acessorios(id) on delete set null,
  add column horas_uso_registrada numeric,
  add column fornecedor_id uuid references fornecedores(id) on delete set null,
  add column anexos jsonb not null default '[]'::jsonb;
create index idx_manutencoes_item on embarcacoes_manutencoes(item_id);
