-- Endurecimento: as funções helper do multi-tenant não devem ser chamáveis diretamente via API
-- (RPC), só usadas internamente por RLS/triggers. Revoga de PUBLIC e regrante só o necessário:
-- authenticated precisa poder executar auth_empresa_id() (é usada nas policies avaliadas com
-- esse role); sync_empresa_id() não precisa de grant nenhum, pois triggers disparam
-- independente de EXECUTE do papel que faz o INSERT/UPDATE.

-- Supabase concede EXECUTE a anon/authenticated automaticamente na criação (privilégios padrão
-- do projeto) — revoke from public não alcança essas concessões diretas, precisa revogar de
-- cada role explicitamente.
revoke execute on function auth_empresa_id() from public, anon, authenticated;
grant execute on function auth_empresa_id() to authenticated;

revoke execute on function sync_empresa_id() from public, anon, authenticated;
