import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { FASE_LABEL, FASES_ORDER, flagUrl, teamName } from "@/lib/teams";
import { fmtDate, fmtTime } from "@/lib/format";
import { toast } from "sonner";
import { Lock, Check } from "lucide-react";

export const Route = createFileRoute("/jogos")({ component: JogosPage });

type Jogo = {
  id: string;
  fase: string;
  grupo: string | null;
  time_a: string;
  time_b: string;
  bandeira_a: string | null;
  bandeira_b: string | null;
  data_hora: string;
  gols_a: number | null;
  gols_b: number | null;
};
type Fase = { nome: string; abertura: string; encerramento: string };
type Palpite = { jogo_id: string; gols_a: number; gols_b: number };

function JogosPage() {
  const { user, loading } = useAuth();
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [fases, setFases] = useState<Fase[]>([]);
  const [palpites, setPalpites] = useState<Record<string, Palpite>>({});
  const [activeFase, setActiveFase] = useState<string>("grupos");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: j }, { data: f }, { data: p }] = await Promise.all([
        supabase.from("jogos").select("*").order("data_hora"),
        supabase.from("fases").select("nome,abertura,encerramento"),
        supabase.from("palpites").select("jogo_id,gols_a,gols_b").eq("user_id", user.id),
      ]);
      setJogos((j as Jogo[]) ?? []);
      setFases((f as Fase[]) ?? []);
      const map: Record<string, Palpite> = {};
      (p as Palpite[] | null)?.forEach((x) => (map[x.jogo_id] = x));
      setPalpites(map);
    })();
  }, [user]);

  const faseStatus = useMemo(() => {
    const now = Date.now();
    const map: Record<string, "antes" | "aberta" | "fechada"> = {};
    fases.forEach((f) => {
      const ab = new Date(f.abertura).getTime();
      const fc = new Date(f.encerramento).getTime();
      map[f.nome] = now < ab ? "antes" : now > fc ? "fechada" : "aberta";
    });
    return map;
  }, [fases]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  const jogosFase = jogos.filter((j) => j.fase === activeFase);
  const aberta = faseStatus[activeFase] === "aberta";

  const salvar = async (jogo: Jogo, a: number, b: number) => {
    setBusy(jogo.id);
    const { error } = await supabase
      .from("palpites")
      .upsert({ user_id: user.id, jogo_id: jogo.id, gols_a: a, gols_b: b }, { onConflict: "user_id,jogo_id" });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    setPalpites((m) => ({ ...m, [jogo.id]: { jogo_id: jogo.id, gols_a: a, gols_b: b } }));
    toast.success("Palpite salvo!");
  };

  return (
    <Layout>
      <h1 className="text-2xl font-extrabold mb-1">Palpites</h1>
      <p className="text-sm text-muted-foreground mb-4">Acertou vencedor: <b className="text-success">2 pts</b> · Placar exato: <b className="text-gold">5 pts</b></p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FASES_ORDER.map((f) => {
          const st = faseStatus[f];
          return (
            <button
              key={f}
              onClick={() => setActiveFase(f)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                activeFase === f ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border"
              }`}
            >
              {FASE_LABEL[f]}
              {st === "fechada" && <Lock className="inline w-3 h-3 ml-1" />}
            </button>
          );
        })}
      </div>

      {!aberta && (
        <div className="card-premium rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-warning" />
          {faseStatus[activeFase] === "fechada" ? "Palpites encerrados nesta fase." : "Palpites ainda não abertos nesta fase."}
        </div>
      )}

      <div className="space-y-3">
        {jogosFase.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">Nenhum jogo cadastrado nesta fase ainda.</p>}
        {jogosFase.map((j) => (
          <JogoCard key={j.id} jogo={j} palpite={palpites[j.id]} disabled={!aberta || busy === j.id} onSave={(a, b) => salvar(j, a, b)} />
        ))}
      </div>
    </Layout>
  );
}

function JogoCard({ jogo, palpite, disabled, onSave }: { jogo: Jogo; palpite?: Palpite; disabled: boolean; onSave: (a: number, b: number) => void }) {
  const [a, setA] = useState<string>(palpite?.gols_a?.toString() ?? "");
  const [b, setB] = useState<string>(palpite?.gols_b?.toString() ?? "");
  useEffect(() => { setA(palpite?.gols_a?.toString() ?? ""); setB(palpite?.gols_b?.toString() ?? ""); }, [palpite]);

  const canSave = a !== "" && b !== "" && Number(a) >= 0 && Number(b) >= 0 && !disabled;
  const hasResult = jogo.gols_a != null && jogo.gols_b != null;

  return (
    <div className="card-premium rounded-2xl p-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
        <span className="font-bold text-accent">{jogo.grupo ? `Grupo ${jogo.grupo}` : FASE_LABEL[jogo.fase]}</span>
        <span>{fmtDate(jogo.data_hora)} · {fmtTime(jogo.data_hora)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Team code={jogo.bandeira_a ?? jogo.time_a} name={teamName(jogo.bandeira_a ?? jogo.time_a)} />
        <div className="flex items-center gap-1">
          <input type="number" min={0} inputMode="numeric" value={a} onChange={(e) => setA(e.target.value)} disabled={disabled}
            className="w-12 text-center text-xl font-extrabold py-2 rounded-lg bg-input border border-border focus:border-primary outline-none disabled:opacity-60" />
          <span className="text-muted-foreground font-bold">×</span>
          <input type="number" min={0} inputMode="numeric" value={b} onChange={(e) => setB(e.target.value)} disabled={disabled}
            className="w-12 text-center text-xl font-extrabold py-2 rounded-lg bg-input border border-border focus:border-primary outline-none disabled:opacity-60" />
        </div>
        <Team code={jogo.bandeira_b ?? jogo.time_b} name={teamName(jogo.bandeira_b ?? jogo.time_b)} reverse />
      </div>
      {hasResult && (
        <div className="mt-3 text-center text-xs">
          Resultado oficial: <b className="text-gold">{jogo.gols_a} × {jogo.gols_b}</b>
        </div>
      )}
      <button onClick={() => onSave(Number(a), Number(b))} disabled={!canSave}
        className="mt-3 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-1.5">
        {palpite ? <><Check className="w-4 h-4" /> Atualizar palpite</> : "Salvar palpite"}
      </button>
    </div>
  );
}

function Team({ code, name, reverse }: { code: string; name: string; reverse?: boolean }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      {code && <img src={flagUrl(code, 80)} alt={name} className="w-9 h-6 object-cover rounded shadow ring-1 ring-border" />}
      <div className="min-w-0">
        <div className="font-bold text-sm truncate">{name}</div>
      </div>
    </div>
  );
}
