-- Fase 2: galeria de fotos/vídeos por produto
-- Garante no máximo 1 foto principal por produto (antes não era garantido no banco).
create unique index if not exists uq_fotos_produto_principal
  on fotos_produto(produto_id) where principal;
