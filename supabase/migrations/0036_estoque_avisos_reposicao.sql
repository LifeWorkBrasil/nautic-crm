-- Status de estoque por produto (disponível / esgotado / oculto) + lista de clientes que
-- pediram para ser avisados quando um produto esgotado voltar ao estoque.

alter table produtos add column status_estoque text not null default 'disponivel'
  check (status_estoque in ('disponivel', 'esgotado', 'oculto'));
alter table produtos add column data_reposicao date;

create table avisos_reposicao (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references produtos(id) on delete cascade,
  empresa_id uuid not null references empresas(id),
  nome text not null,
  telefone text not null,
  criado_em timestamptz not null default now(),
  notificado boolean not null default false,
  notificado_em timestamptz
);
create index idx_avisos_reposicao_produto_id on avisos_reposicao(produto_id);
create index idx_avisos_reposicao_empresa_id on avisos_reposicao(empresa_id);

alter table avisos_reposicao enable row level security;

-- empresa_id sempre derivado do produto, nunca aceito do que o cliente (anon) mandar.
create trigger trg_sync_empresa_id_avisos_reposicao
  before insert or update of produto_id on avisos_reposicao
  for each row execute function sync_empresa_id('produtos', 'produto_id');

create policy "tenant_read_write_avisos_reposicao" on avisos_reposicao
  for all to authenticated
  using (empresa_id = auth_empresa_id())
  with check (empresa_id = auth_empresa_id());

-- Catálogo público: qualquer visitante pode pedir para ser avisado, mas nunca ler os pedidos
-- de outros visitantes (sem policy de select para anon).
create policy "anon_insert_avisos_reposicao" on avisos_reposicao
  for insert to anon
  with check (true);

-- produtos_publicos passa a incluir o status de estoque e não lista produtos ocultos.
create or replace view produtos_publicos as
select
  id, nome, descricao, preco_base, comprimento, subcategoria_id,
  ano, motorizacao_tipo, motorizacao_potencia, motorizacao_marca_modelo,
  combustivel, horas_uso, ultima_revisao, grupo_id, atributos, empresa_id,
  status_estoque, data_reposicao
from produtos
where status_estoque <> 'oculto';
