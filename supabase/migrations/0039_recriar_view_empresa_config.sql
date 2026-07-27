-- BUG CRÍTICO: "create view empresa_config as select * from empresas" (migração 0020) fixa a
-- lista de colunas no momento da criação — colunas adicionadas depois em empresas (ramo_nautico,
-- usa_captacao, usa_motores) nunca apareceram na view. Isso deixou getEmpresaConfig() sempre
-- retornando undefined para essas colunas (então os toggles de Preferências pareciam nunca
-- salvar, e os rótulos "CRM"/"Cliente" nunca trocavam) e updateEmpresaConfig() provavelmente
-- falhando ao tentar atualizar colunas que a view nem expõe.

create or replace view empresa_config as select * from empresas;
