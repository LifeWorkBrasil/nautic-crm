-- Multi-tenant: backfill do tenant único existente em todas as linhas atuais

do $$
declare
  t text;
  empresa_padrao_id uuid;
begin
  select id into empresa_padrao_id from empresas limit 1;

  for t in select unnest(array[
    'produtos','fotos_produto','videos_produto','motores','acessorios',
    'clientes_leads','orcamentos','orcamentos_acessorios','categorias_produto',
    'subcategorias_produto','manuais_produto','orcamentos_parcelas','clientes_historico',
    'captacoes','captacao_itens','captacao_fotos','posts_marketing','parceiros',
    'minutas_contrato','contrapropostas','contraproposta_veiculos','contraproposta_imoveis',
    'usuarios_perfil','permissoes_usuario','perfis_acesso','perfis_acesso_tabs',
    'produto_itens_inclusos','acessorios_subcategorias','grupos_produto','instagram_config',
    'campos_personalizados'
  ])
  loop
    execute format('update %I set empresa_id = $1 where empresa_id is null', t) using empresa_padrao_id;
  end loop;
end $$;
