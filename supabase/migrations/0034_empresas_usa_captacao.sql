-- Torna a aba de Captação opcional por tenant. Default true preserva o comportamento atual;
-- o tenant desativa em Parametrização > Preferências quando não usar esse fluxo.

alter table empresas add column usa_captacao boolean not null default true;

insert into tabs_sistema (chave, label, ordem)
values ('parametrizacao:preferencias', 'Parametrização › Preferências', 12);
