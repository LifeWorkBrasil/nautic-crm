-- Permissões de ação (inserir/excluir/exportar) separadas da permissão de ver a aba — dá pra um
-- usuário ver o Cadastro de Clientes, por exemplo, sem poder excluir ou baixar a lista inteira.
insert into tabs_sistema (chave, label, ordem) values
  ('dados:contatos:inserir', 'Contatos — Inserir', 15),
  ('dados:contatos:excluir', 'Contatos — Excluir', 16),
  ('dados:contatos:exportar', 'Contatos — Exportar/Download', 17),
  ('dados:acessorios:inserir', 'Acessórios — Inserir', 18),
  ('dados:acessorios:excluir', 'Acessórios — Excluir', 19),
  ('dados:acessorios:exportar', 'Acessórios — Exportar/Download', 20),
  ('dados:motores:inserir', 'Motores — Inserir', 21),
  ('dados:motores:excluir', 'Motores — Excluir', 22),
  ('dados:motores:exportar', 'Motores — Exportar/Download', 23);
