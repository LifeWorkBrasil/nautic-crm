-- Quantidade de unidades vendidas no orçamento — multiplica o valor total (casco + motor +
-- acessórios). Default 1 preserva o comportamento atual de todos os orçamentos existentes.

alter table orcamentos add column quantidade integer not null default 1 check (quantidade > 0);
