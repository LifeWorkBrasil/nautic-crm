-- Distingue tenants náuticos de tenants de outros segmentos, para adaptar rótulos genéricos
-- (ex.: "CRM náutico" -> "CRM", "Cliente & Barco" -> "Cliente") sem mexer em RLS/schema de dados.

alter table empresas add column ramo_nautico boolean not null default true;
