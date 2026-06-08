ALTER TYPE fase_nome ADD VALUE IF NOT EXISTS 'dezesseis_avos' BEFORE 'oitavas';

-- Garante que a fase também seja inserida na tabela de 'fases' caso ela já tenha dados
INSERT INTO public.fases (id, nome, abertura, encerramento)
VALUES (
  'e60d2b45-1c31-4820-9118-2c262a0a2df3', 
  'dezesseis_avos', 
  '2026-06-28T00:00:00.000Z', 
  '2026-07-03T23:59:59.000Z'
) ON CONFLICT (id) DO NOTHING;
