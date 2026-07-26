-- Torna o passo de Motor/Acessórios do orçamento e o campo "Comprimento" opcionais por
-- subcategoria: nem todo tenant vende embarcações/veículos (ex.: CuraLabs3D). Default true
-- preserva o comportamento atual para as subcategorias já cadastradas (todas náuticas).

alter table subcategorias_produto add column requer_motor boolean not null default true;
