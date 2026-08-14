-- Generaliza campos_personalizados: além de categoria_id/grupo_id (produtos), aceita um
-- "contexto" fixo pra formulários sem catálogo de categorias (Embarcações, Marinas). A
-- constraint original era um XOR estrito entre as duas FKs de produto; vira um "exatamente um
-- dos três" via num_nonnulls, preservando o comportamento já em uso para produtos.
alter table campos_personalizados add column contexto text check (contexto in ('embarcacao', 'marina'));

alter table campos_personalizados drop constraint campos_personalizados_check;
alter table campos_personalizados add constraint campos_personalizados_check
  check (num_nonnulls(categoria_id, grupo_id, contexto) = 1);

alter table embarcacoes add column atributos jsonb not null default '{}'::jsonb;
alter table marinas add column atributos jsonb not null default '{}'::jsonb;
