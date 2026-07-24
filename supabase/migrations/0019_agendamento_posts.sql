-- Agendamento de publicação de posts no Instagram (data/hora futura)

alter table posts_marketing add column agendado_para timestamptz;
alter table posts_marketing add column status_agendamento text check (status_agendamento in ('agendado', 'publicado', 'erro'));
alter table posts_marketing add column erro_agendamento text;

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'publicar-posts-agendados-instagram',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://rsncpbhcgmthmsjfobey.supabase.co/functions/v1/instagram-publicar-agendados',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '2306ca376d209855f9bc80edae2ff95bcca74b8f3dcf039f'),
    body := '{}'::jsonb
  );
  $$
);
