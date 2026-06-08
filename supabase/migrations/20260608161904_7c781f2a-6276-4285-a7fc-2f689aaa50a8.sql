
DROP VIEW IF EXISTS public.ranking;
CREATE VIEW public.ranking
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.nome,
  COALESCE(SUM(public.pontos_palpite(pa.gols_a, pa.gols_b, j.gols_a, j.gols_b)),0)
    + CASE WHEN p.campeao IS NOT NULL AND p.campeao = (SELECT campeao_oficial FROM public.config WHERE id=1) THEN 10 ELSE 0 END
    AS pontos
FROM public.profiles p
LEFT JOIN public.palpites pa ON pa.user_id = p.id
LEFT JOIN public.jogos j ON j.id = pa.jogo_id
WHERE p.status = 'aprovado'
GROUP BY p.id, p.nome, p.campeao;
GRANT SELECT ON public.ranking TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.pontos_palpite(p_palpite_a INT, p_palpite_b INT, p_real_a INT, p_real_b INT)
RETURNS INT LANGUAGE SQL IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN p_real_a IS NULL OR p_real_b IS NULL THEN 0
    WHEN p_palpite_a = p_real_a AND p_palpite_b = p_real_b THEN 5
    WHEN sign(p_palpite_a - p_palpite_b) = sign(p_real_a - p_real_b) THEN 2
    ELSE 0
  END
$$;
