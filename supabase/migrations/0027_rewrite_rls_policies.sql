-- Multi-tenant: troca as policies "libera tudo pra autenticado" por isolamento real por tenant

-- 1) Tenant raiz: empresas usa a própria id como identificador do tenant
drop policy if exists "authenticated_read_write_empresa_config" on empresas;
create policy "tenant_read_write_empresas" on empresas
  for all to authenticated using (id = auth_empresa_id()) with check (id = auth_empresa_id());

-- 2) Tabelas com policy ALL "using(true)" -> "using(empresa_id = auth_empresa_id())"
--    (par tabela / nome da policy antiga; alguns nomes vêm de antes de renomear a tabela)
do $$
declare
  par text[];
  tabela text;
  policy_antiga text;
begin
  foreach par slice 1 in array array[
    ['produtos', 'authenticated_read_write_modelos_barcos'],
    ['fotos_produto', 'authenticated_read_write_fotos_modelos'],
    ['videos_produto', 'authenticated_read_write_videos_modelos'],
    ['motores', 'authenticated_read_write_motores'],
    ['acessorios', 'authenticated_read_write_acessorios'],
    ['clientes_leads', 'authenticated_read_write_clientes_leads'],
    ['orcamentos', 'authenticated_read_write_orcamentos'],
    ['orcamentos_acessorios', 'authenticated_read_write_orcamentos_acessorios'],
    ['categorias_produto', 'authenticated_read_write_categorias_produto'],
    ['subcategorias_produto', 'authenticated_read_write_subcategorias_produto'],
    ['manuais_produto', 'authenticated_read_write_manuais_produto'],
    ['orcamentos_parcelas', 'authenticated_read_write_orcamentos_parcelas'],
    ['clientes_historico', 'authenticated_read_write_clientes_historico'],
    ['captacoes', 'authenticated_read_write_captacoes'],
    ['captacao_itens', 'authenticated_read_write_captacao_itens'],
    ['captacao_fotos', 'authenticated_read_write_captacao_fotos'],
    ['posts_marketing', 'authenticated_read_write_posts_marketing'],
    ['parceiros', 'authenticated_read_write_parceiros'],
    ['minutas_contrato', 'authenticated_read_write_minutas_contrato'],
    ['contrapropostas', 'authenticated_read_write_contrapropostas'],
    ['contraproposta_veiculos', 'authenticated_read_write_contraproposta_veiculos'],
    ['contraproposta_imoveis', 'authenticated_read_write_contraproposta_imoveis'],
    ['perfis_acesso', 'authenticated_read_write_perfis_acesso'],
    ['perfis_acesso_tabs', 'authenticated_read_write_perfis_acesso_tabs'],
    ['produto_itens_inclusos', 'authenticated_read_write_produto_itens_inclusos'],
    ['acessorios_subcategorias', 'authenticated_read_write_acessorios_subcategorias'],
    ['grupos_produto', 'authenticated_read_write_grupos_produto']
  ]
  loop
    tabela := par[1];
    policy_antiga := par[2];
    execute format('drop policy if exists %I on %I', policy_antiga, tabela);
    execute format(
      'create policy "tenant_read_write_%1$s" on %1$s
       for all to authenticated
       using (empresa_id = auth_empresa_id()) with check (empresa_id = auth_empresa_id())',
      tabela
    );
  end loop;
end $$;

-- 3) usuarios_perfil / permissoes_usuario: só SELECT (escrita continua só via Edge Function
--    com service role); mesma lógica de tenant aplicada à leitura.
drop policy if exists "authenticated_read_usuarios_perfil" on usuarios_perfil;
create policy "tenant_read_usuarios_perfil" on usuarios_perfil
  for select to authenticated using (empresa_id = auth_empresa_id());

drop policy if exists "authenticated_read_permissoes_usuario" on permissoes_usuario;
create policy "tenant_read_permissoes_usuario" on permissoes_usuario
  for select to authenticated using (empresa_id = auth_empresa_id());

-- 4) instagram_config: continua sem policy nenhuma pra authenticated/anon (só a Edge Function,
--    via service role, lê/escreve o access_token) — nada a mudar aqui.

-- 5) Views: produtos_publicos ganha empresa_id (app filtra por .eq('empresa_id', X) nos sites
--    públicos); instagram_status passa a filtrar explicitamente pelo tenant de quem chama, já
--    que instagram_config não tem policy nenhuma pra authenticated (a view é o único acesso
--    seguro). NENHUMA das duas vira security_invoker: produtos_publicos é lida por anon (que não
--    tem identidade de tenant via RLS) e instagram_status é lida por authenticated contra uma
--    tabela sem policy — seria RLS bloqueando 100% das linhas nos dois casos.
create or replace view produtos_publicos as
select
  id, nome, descricao, preco_base, comprimento, subcategoria_id,
  ano, motorizacao_tipo, motorizacao_potencia, motorizacao_marca_modelo,
  combustivel, horas_uso, ultima_revisao, grupo_id, empresa_id
from produtos;

create or replace view instagram_status as
  select
    (instagram_user_id is not null) as conectado,
    instagram_username,
    token_expira_em
  from instagram_config
  where empresa_id = auth_empresa_id();

-- 6) Storage: escrita passa a exigir prefixo de pasta = empresa_id do usuário logado.
--    Leitura pública continua igual (conteúdo de catálogo é público por natureza).
drop policy if exists "authenticated_write_produtos_fotos" on storage.objects;
create policy "tenant_write_produtos_fotos" on storage.objects
  for all to authenticated
  using (bucket_id = 'produtos' and (storage.foldername(name))[1] = auth_empresa_id()::text)
  with check (bucket_id = 'produtos' and (storage.foldername(name))[1] = auth_empresa_id()::text);

drop policy if exists "authenticated_write_manuais" on storage.objects;
create policy "tenant_write_manuais" on storage.objects
  for all to authenticated
  using (bucket_id = 'manuais' and (storage.foldername(name))[1] = auth_empresa_id()::text)
  with check (bucket_id = 'manuais' and (storage.foldername(name))[1] = auth_empresa_id()::text);

drop policy if exists "authenticated_write_branding" on storage.objects;
create policy "tenant_write_branding" on storage.objects
  for all to authenticated
  using (bucket_id = 'branding' and (storage.foldername(name))[1] = auth_empresa_id()::text)
  with check (bucket_id = 'branding' and (storage.foldername(name))[1] = auth_empresa_id()::text);
