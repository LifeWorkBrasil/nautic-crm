-- "Lixeira" de clientes/leads: excluir passa a ser soft-delete (marca deletado_em em vez de
-- apagar a linha), com restauração possível por até 24h. Depois disso, um job do pg_cron apaga
-- de vez.

alter table clientes_leads add column deletado_em timestamptz;
create index idx_clientes_leads_deletado_em on clientes_leads(deletado_em);

create extension if not exists pg_cron;

select cron.schedule(
  'purgar-lixeira-clientes-leads',
  '0 * * * *',
  $$ delete from clientes_leads where deletado_em is not null and deletado_em < now() - interval '24 hours'; $$
);
