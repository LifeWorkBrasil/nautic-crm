-- Multi-tenant: resolve o tenant do usuário logado a partir do JWT (auth.uid())

create or replace function auth_empresa_id() returns uuid
language sql stable security definer set search_path = public
as $$
  select empresa_id from usuarios_perfil where id = auth.uid()
$$;
