-- Guarda a URL do vídeo gerado (slideshow das fotos + trilha) quando o post é publicado como
-- Reels em vez de imagem/carrossel.

alter table posts_marketing add column video_url text;
