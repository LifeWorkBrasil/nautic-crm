-- =========================================================================
-- Módulo de Controle de Embarcações (NFC) — nautic-crm
--
-- Já aplicado em produção diretamente via MCP (fora do histórico local de
-- migrations) em vários passos, incluindo duas rodadas de correção de
-- segurança. Este arquivo consolida o estado final correto, pra manter o
-- histórico local replayável (ex.: staging) e documentado.
--
-- Segue o mesmo padrão do resto do sistema: empresa_id uuid, RLS via
-- auth_empresa_id(), nomenclatura em português sem acento nos identificadores.
-- =========================================================================

create table marinas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  localizacao   text,
  contato       text,
  pin_acesso    text,
  empresa_id    uuid not null references empresas(id),
  criado_em     timestamptz not null default now()
);

create table embarcacoes (
  id                  uuid primary key default gen_random_uuid(),
  nome                text not null,
  numero_registro     text,
  tipo                text,
  comprimento         numeric,
  marina_id           uuid references marinas(id),
  proprietario_id     uuid references clientes_leads(id),
  broker_id           uuid references parceiros(id),
  produto_id          uuid references produtos(id),
  marinheiro_nome     text,
  marinheiro_contato  text,
  status              text not null default 'ATIVA'
                      check (status in ('ATIVA','EM_MANUTENCAO','VENDIDA','INATIVA')),
  foto_url            text,
  empresa_id          uuid not null references empresas(id),
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

create table embarcacoes_tags (
  id                  uuid primary key default gen_random_uuid(),
  embarcacao_id       uuid not null references embarcacoes(id) on delete cascade,
  tag_id              text not null,
  modelo_nfc          text not null default 'NTAG213'
                      check (modelo_nfc in ('NTAG213','NTAG215','NTAG216','CUSTOM')),
  modo_gravacao       text not null default 'HUB' check (modo_gravacao in ('HUB','DIRECT')),
  ativo               boolean not null default true,
  contagem_leituras   integer not null default 0,
  empresa_id          uuid not null references empresas(id),
  criado_em           timestamptz not null default now(),
  unique(empresa_id, tag_id)
);

create table embarcacoes_manutencoes (
  id            uuid primary key default gen_random_uuid(),
  embarcacao_id uuid not null references embarcacoes(id) on delete cascade,
  tipo          text,
  descricao     text,
  realizado_em  date,
  realizado_por text,
  custo         numeric,
  proxima_data  date,
  fotos         jsonb not null default '[]'::jsonb,
  criado_por    uuid references usuarios_perfil(id),
  empresa_id    uuid not null references empresas(id),
  criado_em     timestamptz not null default now()
);

create table embarcacoes_limpezas (
  id            uuid primary key default gen_random_uuid(),
  embarcacao_id uuid not null references embarcacoes(id) on delete cascade,
  limpo_em      date,
  limpo_por     text,
  observacoes   text,
  fotos         jsonb not null default '[]'::jsonb,
  empresa_id    uuid not null references empresas(id),
  criado_em     timestamptz not null default now()
);

create table embarcacoes_movimentacoes (
  id                uuid primary key default gen_random_uuid(),
  embarcacao_id     uuid not null references embarcacoes(id) on delete cascade,
  tipo_movimentacao text not null check (tipo_movimentacao in ('SUBIDA','DESCIDA')),
  movimentado_em    timestamptz not null default now(),
  responsavel       text,
  observacoes       text,
  empresa_id        uuid not null references empresas(id),
  criado_em         timestamptz not null default now()
);

create table embarcacoes_acessorios (
  id                  uuid primary key default gen_random_uuid(),
  embarcacao_id       uuid not null references embarcacoes(id) on delete cascade,
  nome                text not null,
  numero_serie        text,
  instalado_em        date,
  garantia_vence_em   date,
  fornecedor          text,
  empresa_id          uuid not null references empresas(id),
  criado_em           timestamptz not null default now()
);

create index idx_embarcacoes_empresa on embarcacoes(empresa_id);
create index idx_embarcacoes_marina on embarcacoes(marina_id);
create index idx_embarcacoes_tags_embarcacao on embarcacoes_tags(embarcacao_id);
create index idx_embarcacoes_tags_tagid on embarcacoes_tags(tag_id);
create index idx_manutencoes_embarcacao on embarcacoes_manutencoes(embarcacao_id);
create index idx_limpezas_embarcacao on embarcacoes_limpezas(embarcacao_id);
create index idx_movimentacoes_embarcacao on embarcacoes_movimentacoes(embarcacao_id);
create index idx_acessorios_embarcacao on embarcacoes_acessorios(embarcacao_id);

-- ---------------------------------------------------------------------------
-- RLS — padrão exato já usado no resto do sistema
-- ---------------------------------------------------------------------------
alter table marinas enable row level security;
alter table embarcacoes enable row level security;
alter table embarcacoes_tags enable row level security;
alter table embarcacoes_manutencoes enable row level security;
alter table embarcacoes_limpezas enable row level security;
alter table embarcacoes_movimentacoes enable row level security;
alter table embarcacoes_acessorios enable row level security;

create policy tenant_read_write_marinas on marinas for all using (empresa_id = auth_empresa_id());
create policy tenant_read_write_embarcacoes on embarcacoes for all using (empresa_id = auth_empresa_id());
create policy tenant_read_write_embarcacoes_tags on embarcacoes_tags for all using (empresa_id = auth_empresa_id());
create policy tenant_read_write_manutencoes on embarcacoes_manutencoes for all using (empresa_id = auth_empresa_id());
create policy tenant_read_write_limpezas on embarcacoes_limpezas for all using (empresa_id = auth_empresa_id());
create policy tenant_read_write_movimentacoes on embarcacoes_movimentacoes for all using (empresa_id = auth_empresa_id());
create policy tenant_read_write_acessorios on embarcacoes_acessorios for all using (empresa_id = auth_empresa_id());

-- O Supabase concede acesso amplo (SELECT/INSERT/UPDATE/DELETE) para a role "anon" em toda
-- tabela nova por padrão. "marinas" guarda pin_acesso (credencial), "embarcacoes" guarda
-- proprietario_id/marinheiro_contato (dados pessoais) — nenhuma dessas tabelas deve ser
-- acessível por anon. A única porta pública é a view embarcacoes_publico, abaixo.
revoke all on marinas from anon;
revoke all on embarcacoes from anon;
revoke all on embarcacoes_tags from anon;
revoke all on embarcacoes_manutencoes from anon;
revoke all on embarcacoes_limpezas from anon;
revoke all on embarcacoes_movimentacoes from anon;
revoke all on embarcacoes_acessorios from anon;

-- View pública com apenas colunas seguras, pra página de escaneamento do chaveiro NFC — evita
-- expor dados do proprietário. Definida como security definer DE PROPÓSITO (mesmo padrão de
-- produtos_publicos): anon não tem EXECUTE em auth_empresa_id() (revogado em
-- restringir_execucao_funcoes_helper), então uma view security_invoker=true quebraria a leitura
-- anônima com "permission denied for function auth_empresa_id" (confirmado via teste real de
-- API — só rodar no editor SQL não pega esse tipo de erro). Só SELECT é concedido — nunca mais
-- que isso, já que o Postgres concede automaticamente todos os privilégios a anon/authenticated
-- em toda relação nova criada neste projeto.
create view embarcacoes_publico as
select id, nome, tipo, comprimento, foto_url, marina_id, marinheiro_nome, status, empresa_id
from embarcacoes;

revoke insert, update, delete, truncate, references, trigger on embarcacoes_publico from anon;
revoke insert, update, delete, truncate, references, trigger on embarcacoes_publico from authenticated;
grant select on embarcacoes_publico to anon;
grant select on embarcacoes_publico to authenticated;

-- ---------------------------------------------------------------------------
-- Registro de eventos via PIN (sem login) — usado pela página pública do chaveiro NFC
-- ---------------------------------------------------------------------------
create or replace function registrar_evento_embarcacao(
  p_tag_id text,
  p_pin text,
  p_tipo_evento text, -- 'manutencao' | 'limpeza' | 'movimentacao'
  p_dados jsonb
) returns uuid
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_embarcacao_id uuid;
  v_empresa_id uuid;
  v_marina_pin text;
  v_novo_id uuid;
begin
  select e.id, e.empresa_id, m.pin_acesso
  into v_embarcacao_id, v_empresa_id, v_marina_pin
  from embarcacoes e
  join marinas m on m.id = e.marina_id
  join embarcacoes_tags t on t.embarcacao_id = e.id
  where t.tag_id = p_tag_id and t.ativo = true
  limit 1;

  if v_embarcacao_id is null then
    raise exception 'Chaveiro NFC não encontrado ou inativo.';
  end if;

  if v_marina_pin is null or v_marina_pin != p_pin then
    raise exception 'PIN inválido.';
  end if;

  if p_tipo_evento = 'manutencao' then
    insert into embarcacoes_manutencoes (embarcacao_id, tipo, descricao, realizado_em, realizado_por, custo, empresa_id)
    values (
      v_embarcacao_id, p_dados->>'tipo', p_dados->>'descricao',
      coalesce((p_dados->>'realizado_em')::date, current_date),
      p_dados->>'realizado_por',
      (p_dados->>'custo')::numeric,
      v_empresa_id
    ) returning id into v_novo_id;

  elsif p_tipo_evento = 'limpeza' then
    insert into embarcacoes_limpezas (embarcacao_id, limpo_em, limpo_por, observacoes, empresa_id)
    values (
      v_embarcacao_id, coalesce((p_dados->>'limpo_em')::date, current_date),
      p_dados->>'limpo_por', p_dados->>'observacoes', v_empresa_id
    ) returning id into v_novo_id;

  elsif p_tipo_evento = 'movimentacao' then
    if p_dados->>'tipo_movimentacao' not in ('SUBIDA', 'DESCIDA') then
      raise exception 'tipo_movimentacao deve ser SUBIDA ou DESCIDA.';
    end if;
    insert into embarcacoes_movimentacoes (embarcacao_id, tipo_movimentacao, responsavel, observacoes, empresa_id)
    values (
      v_embarcacao_id, p_dados->>'tipo_movimentacao',
      p_dados->>'responsavel', p_dados->>'observacoes', v_empresa_id
    ) returning id into v_novo_id;

  else
    raise exception 'tipo_evento inválido: deve ser manutencao, limpeza ou movimentacao.';
  end if;

  return v_novo_id;
end;
$$;

-- Visitantes anônimos (equipe de marina, sem login) precisam chamar essa função — a validação
-- de PIN dentro dela é a proteção real, não a ausência de autenticação de sessão.
grant execute on function registrar_evento_embarcacao to anon;

insert into tabs_sistema (chave, label, ordem) values ('embarcacoes', 'Embarcações', 24);
