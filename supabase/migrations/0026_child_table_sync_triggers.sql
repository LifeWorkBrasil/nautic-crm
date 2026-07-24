-- Multi-tenant: tabelas-filha herdam empresa_id do registro pai (nunca do que o cliente manda)

create or replace function sync_empresa_id() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  parent_table text := TG_ARGV[0];
  parent_col text := TG_ARGV[1];
begin
  execute format('select empresa_id from %I where id = $1', parent_table)
    into NEW.empresa_id using (to_jsonb(NEW) ->> parent_col)::uuid;
  return NEW;
end $$;

create trigger trg_sync_empresa_id before insert or update of produto_id
  on fotos_produto for each row
  execute function sync_empresa_id('produtos', 'produto_id');

create trigger trg_sync_empresa_id before insert or update of produto_id
  on videos_produto for each row
  execute function sync_empresa_id('produtos', 'produto_id');

create trigger trg_sync_empresa_id before insert or update of produto_id
  on manuais_produto for each row
  execute function sync_empresa_id('produtos', 'produto_id');

create trigger trg_sync_empresa_id before insert or update of produto_id
  on produto_itens_inclusos for each row
  execute function sync_empresa_id('produtos', 'produto_id');

create trigger trg_sync_empresa_id before insert or update of acessorio_id
  on acessorios_subcategorias for each row
  execute function sync_empresa_id('acessorios', 'acessorio_id');

create trigger trg_sync_empresa_id before insert or update of cliente_id
  on orcamentos for each row
  execute function sync_empresa_id('clientes_leads', 'cliente_id');

create trigger trg_sync_empresa_id before insert or update of orcamento_id
  on orcamentos_acessorios for each row
  execute function sync_empresa_id('orcamentos', 'orcamento_id');

create trigger trg_sync_empresa_id before insert or update of orcamento_id
  on orcamentos_parcelas for each row
  execute function sync_empresa_id('orcamentos', 'orcamento_id');

create trigger trg_sync_empresa_id before insert or update of cliente_id
  on clientes_historico for each row
  execute function sync_empresa_id('clientes_leads', 'cliente_id');

create trigger trg_sync_empresa_id before insert or update of captacao_id
  on captacao_itens for each row
  execute function sync_empresa_id('captacoes', 'captacao_id');

create trigger trg_sync_empresa_id before insert or update of captacao_id
  on captacao_fotos for each row
  execute function sync_empresa_id('captacoes', 'captacao_id');

create trigger trg_sync_empresa_id before insert or update of cliente_id
  on contrapropostas for each row
  execute function sync_empresa_id('clientes_leads', 'cliente_id');

create trigger trg_sync_empresa_id before insert or update of contraproposta_id
  on contraproposta_veiculos for each row
  execute function sync_empresa_id('contrapropostas', 'contraproposta_id');

create trigger trg_sync_empresa_id before insert or update of contraproposta_id
  on contraproposta_imoveis for each row
  execute function sync_empresa_id('contrapropostas', 'contraproposta_id');

create trigger trg_sync_empresa_id before insert or update of usuario_id
  on permissoes_usuario for each row
  execute function sync_empresa_id('usuarios_perfil', 'usuario_id');

create trigger trg_sync_empresa_id before insert or update of perfil_id
  on perfis_acesso_tabs for each row
  execute function sync_empresa_id('perfis_acesso', 'perfil_id');
