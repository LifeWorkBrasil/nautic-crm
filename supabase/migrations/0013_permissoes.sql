create table usuarios_perfil (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  is_admin boolean not null default false,
  ativo boolean not null default true,
  comissao_percentual numeric(5,2) not null default 0,
  criado_em timestamptz not null default now()
);

create table tabs_sistema (
  chave text primary key,
  label text not null,
  ordem int not null default 0
);

create table permissoes_usuario (
  usuario_id uuid not null references usuarios_perfil(id) on delete cascade,
  tab_key text not null,
  primary key (usuario_id, tab_key)
);

alter table usuarios_perfil enable row level security;
alter table tabs_sistema enable row level security;
alter table permissoes_usuario enable row level security;

create policy "authenticated_read_usuarios_perfil" on usuarios_perfil
  for select to authenticated using (true);
create policy "authenticated_read_tabs_sistema" on tabs_sistema
  for select to authenticated using (true);
create policy "authenticated_read_permissoes_usuario" on permissoes_usuario
  for select to authenticated using (true);
-- sem policy de insert/update/delete para authenticated = bloqueado por padrão com RLS ligado;
-- só a Edge Function (service role, que ignora RLS) escreve nessas 3 tabelas.

insert into tabs_sistema (chave, label, ordem) values
  ('crm', 'CRM & Funil', 1),
  ('captacao', 'Captação', 2),
  ('produtos_terceiros', 'Produtos de Terceiros', 3),
  ('parametrizacao:motores', 'Parametrização › Motores', 4),
  ('parametrizacao:acessorios', 'Parametrização › Acessórios', 5),
  ('parametrizacao:categorias', 'Parametrização › Categorias', 6),
  ('parametrizacao:parceiros', 'Parametrização › Parceiros', 7),
  ('parametrizacao:minutas', 'Parametrização › Minutas de Contrato', 8),
  ('orcamentos', 'Gerador de Orçamentos', 9),
  ('marketing', 'Marketing', 10),
  ('empresa', 'Empresa & Marca', 11);

alter table clientes_leads add column vendedor_id uuid references usuarios_perfil(id) on delete set null;
