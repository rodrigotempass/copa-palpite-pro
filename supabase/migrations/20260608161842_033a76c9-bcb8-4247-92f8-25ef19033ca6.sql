
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','participant');
CREATE TYPE public.user_status AS ENUM ('pendente','aprovado','rejeitado');
CREATE TYPE public.fase_nome AS ENUM ('grupos','oitavas','quartas','semis','final');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  status public.user_status NOT NULL DEFAULT 'pendente',
  campeao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- PROFILES policies
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_select_aprovados_para_ranking" ON public.profiles FOR SELECT TO authenticated
  USING (status = 'aprovado');
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self_basic" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND status = (SELECT status FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- USER ROLES policies
CREATE POLICY "user_roles_select_self_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- FASES
CREATE TABLE public.fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome public.fase_nome NOT NULL UNIQUE,
  abertura TIMESTAMPTZ NOT NULL,
  encerramento TIMESTAMPTZ NOT NULL
);
GRANT SELECT ON public.fases TO authenticated, anon;
GRANT ALL ON public.fases TO service_role;
ALTER TABLE public.fases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fases_read_all" ON public.fases FOR SELECT USING (true);
CREATE POLICY "fases_admin_write" ON public.fases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- JOGOS
CREATE TABLE public.jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase public.fase_nome NOT NULL,
  grupo TEXT,
  time_a TEXT NOT NULL,
  time_b TEXT NOT NULL,
  bandeira_a TEXT,
  bandeira_b TEXT,
  data_hora TIMESTAMPTZ NOT NULL,
  gols_a INT,
  gols_b INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jogos TO authenticated, anon;
GRANT ALL ON public.jogos TO service_role;
ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jogos_read_all" ON public.jogos FOR SELECT USING (true);
CREATE POLICY "jogos_admin_write" ON public.jogos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PALPITES
CREATE TABLE public.palpites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jogo_id UUID NOT NULL REFERENCES public.jogos(id) ON DELETE CASCADE,
  gols_a INT NOT NULL,
  gols_b INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, jogo_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.palpites TO authenticated;
GRANT ALL ON public.palpites TO service_role;
ALTER TABLE public.palpites ENABLE ROW LEVEL SECURITY;

-- Função para verificar se palpites estão abertos para a fase de um jogo
CREATE OR REPLACE FUNCTION public.fase_aberta_para_jogo(_jogo_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jogos j JOIN public.fases f ON f.nome = j.fase
    WHERE j.id = _jogo_id AND now() BETWEEN f.abertura AND f.encerramento
  )
$$;

CREATE POLICY "palpites_select_self_or_admin" ON public.palpites FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "palpites_insert_self_open" ON public.palpites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.fase_aberta_para_jogo(jogo_id));
CREATE POLICY "palpites_update_self_open" ON public.palpites FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.fase_aberta_para_jogo(jogo_id))
  WITH CHECK (user_id = auth.uid() AND public.fase_aberta_para_jogo(jogo_id));
CREATE POLICY "palpites_delete_self_open" ON public.palpites FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.fase_aberta_para_jogo(jogo_id));

-- CONFIG (campeão oficial)
CREATE TABLE public.config (
  id INT PRIMARY KEY DEFAULT 1,
  campeao_oficial TEXT,
  CHECK (id = 1)
);
GRANT SELECT ON public.config TO authenticated, anon;
GRANT ALL ON public.config TO service_role;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_read_all" ON public.config FOR SELECT USING (true);
CREATE POLICY "config_admin_write" ON public.config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.config (id, campeao_oficial) VALUES (1, NULL);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER palpites_updated_at BEFORE UPDATE ON public.palpites
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Trigger novo usuário: cria profile e atribui role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email,
    CASE WHEN lower(NEW.email) = 'rodrigotempass@gmail.com' THEN 'aprovado'::public.user_status ELSE 'pendente'::public.user_status END
  );
  IF lower(NEW.email) = 'rodrigotempass@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'participant') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função pontuação
CREATE OR REPLACE FUNCTION public.pontos_palpite(p_palpite_a INT, p_palpite_b INT, p_real_a INT, p_real_b INT)
RETURNS INT LANGUAGE SQL IMMUTABLE AS $$
  SELECT CASE
    WHEN p_real_a IS NULL OR p_real_b IS NULL THEN 0
    WHEN p_palpite_a = p_real_a AND p_palpite_b = p_real_b THEN 5
    WHEN sign(p_palpite_a - p_palpite_b) = sign(p_real_a - p_real_b) THEN 2
    ELSE 0
  END
$$;

-- View ranking
CREATE OR REPLACE VIEW public.ranking AS
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

-- Fases iniciais
INSERT INTO public.fases (nome, abertura, encerramento) VALUES
  ('grupos',   '2026-05-01 00:00:00-03', '2026-06-11 12:00:00-03'),
  ('oitavas',  '2026-06-27 00:00:00-03', '2026-06-28 12:00:00-03'),
  ('quartas',  '2026-07-04 00:00:00-03', '2026-07-04 12:00:00-03'),
  ('semis',    '2026-07-08 00:00:00-03', '2026-07-08 12:00:00-03'),
  ('final',    '2026-07-19 00:00:00-03', '2026-07-19 12:00:00-03');
