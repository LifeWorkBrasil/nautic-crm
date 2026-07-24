-- Multi-tenant: empresa_id passa a ser obrigatório em todas as tabelas de negócio

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'produtos','fotos_produto','videos_produto','motores','acessorios',
    'clientes_leads','orcamentos','orcamentos_acessorios','categorias_produto',
    'subcategorias_produto','manuais_produto','orcamentos_parcelas','clientes_historico',
    'captacoes','captacao_itens','captacao_fotos','posts_marketing','parceiros',
    'minutas_contrato','contrapropostas','contraproposta_veiculos','contraproposta_imoveis',
    'usuarios_perfil','permissoes_usuario','perfis_acesso','perfis_acesso_tabs',
    'produto_itens_inclusos','acessorios_subcategorias','grupos_produto','instagram_config'
  ])
  loop
    execute format('alter table %I alter column empresa_id set not null', t);
  end loop;
end $$;
