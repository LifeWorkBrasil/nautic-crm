-- Torna a aba "Motores" da Parametrização opcional por tenant. Default true preserva o
-- comportamento atual; o tenant desativa em Parametrização > Preferências quando não vende
-- nada motorizado (o catálogo de Motores em si não é usado por nenhuma subcategoria).

alter table empresas add column usa_motores boolean not null default true;
