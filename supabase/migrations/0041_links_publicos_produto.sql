-- Link público e temporário para um produto: em vez de mandar um bloco de texto cru (specs +
-- URLs de fotos soltas) pelo WhatsApp, o vendedor gera um link tipo /p/<id> que abre uma página
-- pública com o produto formatado (fotos, checklist, vídeo, preço) e expira numa data escolhida
-- por ele.

create table links_publicos_produto (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references produtos(id) on delete cascade,
  empresa_id uuid not null references empresas(id),
  criado_por uuid references usuarios_perfil(id),
  cliente_nome text,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null
);
create index idx_links_publicos_produto_produto_id on links_publicos_produto(produto_id);
create index idx_links_publicos_produto_empresa_id on links_publicos_produto(empresa_id);

alter table links_publicos_produto enable row level security;

create trigger trg_sync_empresa_id_links_publicos_produto
  before insert or update of produto_id on links_publicos_produto
  for each row execute function sync_empresa_id('produtos', 'produto_id');

create policy "tenant_read_write_links_publicos_produto" on links_publicos_produto
  for all to authenticated
  using (empresa_id = auth_empresa_id())
  with check (empresa_id = auth_empresa_id());

-- Visitante (anon) só enxerga o link enquanto ele não tiver expirado — depois disso a página
-- pública para de conseguir carregar o produto, mesmo que alguém ainda tenha a URL salva.
create policy "anon_read_links_publicos_produto" on links_publicos_produto
  for select to anon
  using (expira_em > now());
