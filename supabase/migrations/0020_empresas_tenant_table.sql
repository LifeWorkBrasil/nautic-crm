-- Multi-tenant: empresa_config vira a tabela de tenants "empresas"

alter table empresa_config rename to empresas;
alter table empresas add column slug text unique;
alter table empresas add column segmento text;
alter table empresas add column ativo boolean not null default true;

update empresas set slug = 'barcos-e-barcos', segmento = 'nautico' where slug is null;
alter table empresas alter column slug set not null;

-- View de compatibilidade: código antigo que ainda chama .from('empresa_config') continua
-- funcionando. security_invoker=true porque `empresas` tem policy tanto para authenticated
-- quanto para anon (diferente de produtos_publicos/instagram_status, ver migração 0027).
create view empresa_config
with (security_invoker = true)
as select * from empresas;

grant select, insert, update, delete on empresa_config to authenticated;
grant select on empresa_config to anon;
