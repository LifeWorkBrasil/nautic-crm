-- BUG CRÍTICO (regressão introduzida pela migração 0039): "create or replace view
-- empresa_config as select * from empresas" recriou a view SEM "with (security_invoker = true)"
-- (opção original da migração 0021). Sem isso, a view volta a rodar com o privilégio do dono
-- (postgres, que tem BYPASSRLS) — ou seja, a policy "empresa_id = auth_empresa_id()" da tabela
-- empresas nunca é aplicada quando consultada via empresa_config, e QUALQUER tenant autenticado
-- lê a linha de QUALQUER outra empresa. Na prática, getEmpresaConfig() (usado no CRM, Orçamentos,
-- Layout etc.) sempre devolvia a primeira linha da tabela (Barcos & Barcos) para todo mundo,
-- inclusive para usuários da CuraLabs3D.

create or replace view empresa_config
with (security_invoker = true)
as select * from empresas;
