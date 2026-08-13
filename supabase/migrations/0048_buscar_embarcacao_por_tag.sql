-- A view embarcacoes_publico é indexada por id da embarcação, não pelo código físico da tag NFC
-- (embarcacoes_tags.tag_id), e embarcacoes_tags não tem grant nenhum para anon (nem deveria —
-- guardaria contagem_leituras/modo_gravacao, não é dado destinado ao público). A página pública
-- /embarcacao/:tagId precisa resolver "tag_id físico -> dados seguros da embarcação" sem sessão,
-- então essa resolução vira uma função security definer, mesmo padrão de
-- registrar_evento_embarcacao: só devolve as colunas já expostas em embarcacoes_publico.
create or replace function buscar_embarcacao_por_tag(p_tag_id text)
returns table (
  id uuid, nome text, tipo text, comprimento numeric, foto_url text,
  marina_id uuid, marinheiro_nome text, status text, empresa_id uuid
)
language plpgsql security definer set search_path to 'public'
as $$
begin
  update embarcacoes_tags set contagem_leituras = contagem_leituras + 1
  where tag_id = p_tag_id and ativo = true;

  return query
  select e.id, e.nome, e.tipo, e.comprimento, e.foto_url, e.marina_id, e.marinheiro_nome, e.status, e.empresa_id
  from embarcacoes e
  join embarcacoes_tags t on t.embarcacao_id = e.id
  where t.tag_id = p_tag_id and t.ativo = true
  limit 1;
end;
$$;

grant execute on function buscar_embarcacao_por_tag(text) to anon;
