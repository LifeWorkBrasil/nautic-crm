-- Guarda o creation_id do container de Reels criado no Instagram, pra o job de agendamento
-- (instagram-publicar-agendados, roda a cada 5 min) conseguir retomar o polling de status entre
-- execuções em vez de criar um container novo toda vez que o vídeo ainda não terminou de
-- processar (processamento de vídeo no Instagram é bem mais lento que o de imagem).
alter table posts_marketing add column reels_creation_id text;
