import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { FASE_LABEL, FASES_ORDER, flagUrl, teamName, TEAMS } from "@/lib/teams";
import { fmtDate, fmtTime } from "@/lib/format";
import { toast } from "sonner";
import { Lock, Check, Crown } from "lucide-react";

export const Route = createFileRoute("/palpites")({ component: PalpitesPage });

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

type Tab = "grupos" | "mata-mata" | "campeao";

function PalpitesPage() {
  const { user, loading, profile, refresh } = useAuth();
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [fases, setFases] = useState<Fase[]>([]);
  const [palpites, setPalpites] = useState<Record<string, Palpite>>({});
  const [tab, setTab] = useState<Tab>("grupos");
  const [busy, setBusy] = useState<string | null>(null);

  // Campeão state
  const [campeao, setCampeao] = useState<string>("");
  const [oficial, setOficial] = useState<string | null>(null);
  const [savingCampeao, setSavingCampeao] = useState(false);

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
      
      setCampeao(profile?.campeao ?? "");
      supabase.from("config").select("campeao_oficial").eq("id", 1).maybeSingle()
        .then(({ data }) => setOficial(data?.campeao_oficial ?? null));
    })();
  }, [user, profile]);

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

  const salvarPalpite = async (jogo: Jogo, a: number, b: number) => {
    setBusy(jogo.id);
    const { error } = await supabase
      .from("palpites")
      .upsert({ user_id: user.id, jogo_id: jogo.id, gols_a: a, gols_b: b }, { onConflict: "user_id,jogo_id" });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    setPalpites((m) => ({ ...m, [jogo.id]: { jogo_id: jogo.id, gols_a: a, gols_b: b } }));
    toast.success("Palpite salvo!");
  };

  const lockedByOficial = !!oficial;
  const salvarCampeao = async () => {
    if (!campeao) return;
    setSavingCampeao(true);
    const { error } = await supabase.from("profiles").update({ campeao }).eq("id", user.id);
    setSavingCampeao(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Campeão registrado!");
  };

  return (
    <Layout>
      <h1 className="text-2xl font-extrabold mb-1">Meus Palpites</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Acertou vencedor: <b className="text-success">2 pts</b> · Placar exato: <b className="text-gold">5 pts</b>
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => setTab("grupos")}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition border ${
            tab === "grupos" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border"
          }`}
        >
          Fase de Grupos
        </button>
        <button
          onClick={() => setTab("mata-mata")}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition border ${
            tab === "mata-mata" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border"
          }`}
        >
          Mata-Mata
        </button>
        <button
          onClick={() => setTab("campeao")}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition border ${
            tab === "campeao" ? "bg-gold text-gold-foreground border-gold" : "bg-secondary text-secondary-foreground border-border"
          }`}
        >
          <Crown className="inline w-4 h-4 mr-1.5" />
          Campeão
        </button>
      </div>

      {tab === "grupos" && (
        <FaseView
          fase="grupos"
          jogos={jogos.filter(j => j.fase === "grupos")}
          palpites={palpites}
          status={faseStatus["grupos"]}
          busy={busy}
          onSave={salvarPalpite}
        />
      )}

      {tab === "mata-mata" && (
        <MataMataView
          jogos={jogos}
          palpites={palpites}
          faseStatus={faseStatus}
          busy={busy}
          onSave={salvarPalpite}
        />
      )}

      {tab === "campeao" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {lockedByOficial && (
            <div className="card-premium rounded-xl p-3 mb-4 text-sm flex gap-2">
              <Lock className="w-4 h-4 text-warning" /> Campeão oficial declarado. Não é mais possível alterar seu palpite.
            </div>
          )}

          <div className="card-premium rounded-2xl p-4">
            <p className="text-sm text-muted-foreground mb-4 font-medium text-center">
              Acertar o campeão vale <b className="text-gold">10 pontos</b>.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[50dvh] overflow-y-auto p-1">
              {TEAMS.map((t) => {
                const sel = campeao === t.code;
                return (
                  <button
                    key={t.code}
                    onClick={() => !lockedByOficial && setCampeao(t.code)}
                    disabled={lockedByOficial}
                    className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition ${
                      sel ? "bg-primary/15 border-primary" : "bg-secondary border-border hover:border-primary/60"
                    } disabled:opacity-60`}
                  >
                    <img src={flagUrl(t.code, 80)} alt={t.name} className="w-12 h-8 object-cover rounded shadow" />
                    <span className="text-[11px] font-bold text-center leading-tight">{t.name}</span>
                    {sel && <Check className="absolute top-1 right-1 w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            <button onClick={salvarCampeao} disabled={!campeao || savingCampeao || lockedByOficial || campeao === profile?.campeao}
              className="mt-4 w-full py-3 rounded-lg bg-gold text-gold-foreground font-extrabold disabled:opacity-40">
              {profile?.campeao ? "Atualizar campeão" : "Confirmar campeão"}
            </button>
          </div>
        </div>
      )}

    </Layout>
  );
}

function FaseView({ fase, jogos, palpites, status, busy, onSave }: any) {
  const aberta = status === "aberta";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {!aberta && (
        <div className="card-premium rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-warning shrink-0" />
          {status === "fechada" ? "Palpites encerrados nesta fase." : "Palpites ainda não abertos nesta fase."}
        </div>
      )}
      <div className="space-y-3">
        {jogos.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">Nenhum jogo cadastrado.</p>}
        {jogos.map((j: any) => (
          <JogoCard key={j.id} jogo={j} palpite={palpites[j.id]} disabled={!aberta || busy === j.id} onSave={(a, b) => onSave(j, a, b)} />
        ))}
      </div>
    </div>
  );
}

function MataMataView({ jogos, palpites, faseStatus, busy, onSave }: any) {
  const knockoutFases = FASES_ORDER.filter(f => f !== "grupos");

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
        {knockoutFases.map((fase) => {
          const jogosFase = jogos.filter((j: any) => j.fase === fase);
          const status = faseStatus[fase];
          const aberta = status === "aberta";

          return (
            <div key={fase} className="min-w-[85vw] sm:min-w-[320px] snap-center flex flex-col gap-3">
              <div className="sticky top-0 z-10 flex items-center justify-between bg-background/80 backdrop-blur pb-2 border-b border-border">
                <h3 className="font-extrabold text-lg">{FASE_LABEL[fase]}</h3>
                {status === "fechada" ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" /> Encerrado</span>
                ) : status === "aberta" ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Aberto</span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" /> Em breve</span>
                )}
              </div>
              
              <div className="space-y-4 pt-1">
                {jogosFase.length === 0 && (
                  <div className="card-premium border-dashed border-2 bg-transparent opacity-50 h-32 flex items-center justify-center rounded-2xl">
                    <span className="text-xs font-bold text-muted-foreground">Confrontos a definir</span>
                  </div>
                )}
                {jogosFase.map((j: any) => (
                  <JogoCard
                    key={j.id}
                    jogo={j}
                    palpite={palpites[j.id]}
                    disabled={!aberta || busy === j.id}
                    onSave={(a, b) => onSave(j, a, b)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JogoCard({ jogo, palpite, disabled, onSave }: { jogo: Jogo; palpite?: Palpite; disabled: boolean; onSave: (a: number, b: number) => void }) {
  const [a, setA] = useState<string>(palpite?.gols_a?.toString() ?? "");
  const [b, setB] = useState<string>(palpite?.gols_b?.toString() ?? "");
  useEffect(() => { setA(palpite?.gols_a?.toString() ?? ""); setB(palpite?.gols_b?.toString() ?? ""); }, [palpite]);

  const canSave = a !== "" && b !== "" && Number(a) >= 0 && Number(b) >= 0 && !disabled &&
                  (palpite?.gols_a !== Number(a) || palpite?.gols_b !== Number(b));
  
  const hasResult = jogo.gols_a != null && jogo.gols_b != null;

  return (
    <div className="card-premium rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
        <span className="font-bold text-accent">{jogo.grupo ? `Grupo ${jogo.grupo}` : FASE_LABEL[jogo.fase]}</span>
        <span>{fmtDate(jogo.data_hora)} · {fmtTime(jogo.data_hora)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Team code={jogo.bandeira_a ?? jogo.time_a} name={teamName(jogo.bandeira_a ?? jogo.time_a)} />
        <div className="flex items-center gap-1.5">
          <input type="number" min={0} inputMode="numeric" value={a} onChange={(e) => setA(e.target.value)} disabled={disabled}
            className="w-12 h-12 text-center text-xl font-extrabold rounded-lg bg-input border border-border focus:border-primary outline-none disabled:opacity-60 transition-colors" />
          <span className="text-muted-foreground font-bold">×</span>
          <input type="number" min={0} inputMode="numeric" value={b} onChange={(e) => setB(e.target.value)} disabled={disabled}
            className="w-12 h-12 text-center text-xl font-extrabold rounded-lg bg-input border border-border focus:border-primary outline-none disabled:opacity-60 transition-colors" />
        </div>
        <Team code={jogo.bandeira_b ?? jogo.time_b} name={teamName(jogo.bandeira_b ?? jogo.time_b)} reverse />
      </div>
      {hasResult && (
        <div className="mt-3 text-center text-xs py-1.5 bg-secondary/50 rounded-md">
          Resultado oficial: <b className="text-gold">{jogo.gols_a} × {jogo.gols_b}</b>
        </div>
      )}
      <button onClick={() => onSave(Number(a), Number(b))} disabled={!canSave}
        className={`mt-3 w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
          canSave ? "bg-primary text-primary-foreground shadow-md hover:brightness-110" : "bg-secondary text-secondary-foreground opacity-50"
        }`}>
        {palpite ? <><Check className="w-4 h-4" /> {canSave ? "Atualizar palpite" : "Palpite salvo"}</> : "Salvar palpite"}
      </button>
    </div>
  );
}

function Team({ code, name, reverse }: { code: string; name: string; reverse?: boolean }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      {code && <img src={flagUrl(code, 80)} alt={name} className="w-8 h-6 object-cover rounded shadow-sm ring-1 ring-border shrink-0" />}
      <div className="min-w-0">
        <div className="font-bold text-sm truncate leading-tight">{name}</div>
      </div>
    </div>
  );
}
