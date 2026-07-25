-- Multi-tenant: sinalizador de "dono da plataforma" — quem pode criar novos tenants
-- (diferente de is_admin, que é admin só dentro do próprio tenant).

alter table usuarios_perfil add column plataforma_admin boolean not null default false;

update usuarios_perfil set plataforma_admin = true where is_admin = true;
