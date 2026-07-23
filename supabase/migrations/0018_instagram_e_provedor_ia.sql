-- Integração com Instagram (publicação de posts) + registro do provedor de IA usado na legenda

create table instagram_config (
  id uuid primary key default uuid_generate_v4(),
  access_token text,
  token_expira_em timestamptz,
  instagram_user_id text,
  instagram_username text,
  atualizado_em timestamptz not null default now()
);

alter table instagram_config enable row level security;
-- Sem policy para anon/authenticated: só Edge Functions (service role) leem/escrevem o token.
insert into instagram_config (access_token, instagram_user_id, instagram_username) values (null, null, null);

-- View segura: expõe apenas se está conectado e o username, nunca o access_token.
create view instagram_status as
  select
    (instagram_user_id is not null) as conectado,
    instagram_username,
    token_expira_em
  from instagram_config;

grant select on instagram_status to authenticated;

alter table posts_marketing add column provedor_ia text;
alter table posts_marketing add column instagram_media_id text;
alter table posts_marketing add column publicado_instagram_em timestamptz;
