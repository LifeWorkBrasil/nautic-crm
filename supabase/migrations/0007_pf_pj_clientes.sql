-- Fase 5: cadastro completo de clientes PF/PJ, com vínculo entre eles
alter table clientes_leads
  add column tipo_pessoa text not null default 'PF' check (tipo_pessoa in ('PF', 'PJ')),
  add column cpf text,
  add column rg text,
  add column cnpj text,
  add column razao_social text,
  add column nome_fantasia text,
  add column inscricao_estadual text,
  add column endereco text,
  add column cidade text,
  add column estado text,
  add column cep text,
  add column pessoa_juridica_id uuid references clientes_leads(id) on delete set null,
  add constraint chk_pj_link_only_pf check (pessoa_juridica_id is null or tipo_pessoa = 'PF');

create index idx_clientes_pessoa_juridica_id on clientes_leads(pessoa_juridica_id);
