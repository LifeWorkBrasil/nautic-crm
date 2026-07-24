-- Multi-tenant: tabelas raiz preenchem empresa_id sozinhas no insert (baseado em quem loga)
-- usuarios_perfil e instagram_config ficam de fora: sempre recebem valor explícito da
-- Edge Function (service role não tem auth.uid(), o default não dispararia ali).

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'produtos','clientes_leads','captacoes','parceiros','minutas_contrato',
    'posts_marketing','categorias_produto','subcategorias_produto','grupos_produto',
    'motores','acessorios','perfis_acesso'
  ])
  loop
    execute format('alter table %I alter column empresa_id set default auth_empresa_id()', t);
  end loop;
end $$;
