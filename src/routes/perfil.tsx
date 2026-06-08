import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { teamName, flagUrl } from "@/lib/teams";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/perfil")({ component: Perfil });

function Perfil() {
  const { user, loading, profile, signOut } = useAuth();
  const [meusPalpites, setMeus] = useState<any[]>([]);
  const [meuRank, setMeuRank] = useState<{ pos: number; pontos: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("palpites")
        .select("gols_a,gols_b,jogos(time_a,time_b,bandeira_a,bandeira_b,gols_a,gols_b,data_hora,fase)")
        .eq("user_id", user.id);
      setMeus(p ?? []);
      const { data: r } = await supabase.from("ranking").select("*");
      if (r) {
        const sorted = [...r].sort((a: any, b: any) => b.pontos - a.pontos);
        const idx = sorted.findIndex((x: any) => x.id === user.id);
        if (idx >= 0) setMeuRank({ pos: idx + 1, pontos: sorted[idx].pontos });
      }
    })();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  return (
    <Layout>
      <div className="card-premium rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full chip-gold grid place-items-center text-xl font-extrabold">
            {profile?.nome?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-lg truncate">{profile?.nome}</div>
            <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
            <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
              profile?.status === "aprovado" ? "bg-success text-success-foreground" :
              profile?.status === "pendente" ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"
            }`}>{profile?.status}</span>
          </div>
          {meuRank && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Posição</div>
              <div className="text-2xl font-extrabold text-gold">#{meuRank.pos}</div>
              <div className="text-xs flex items-center gap-1 justify-end"><Trophy className="w-3 h-3" />{meuRank.pontos} pts</div>
            </div>
          )}
        </div>
        {profile?.campeao && (
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Seu campeão:</span>
            <img src={flagUrl(profile.campeao, 40)} alt="" className="w-6 h-4 rounded" />
            <b>{teamName(profile.campeao)}</b>
          </div>
        )}
      </div>

      <h2 className="text-lg font-extrabold mb-3">Meus palpites</h2>
      <div className="space-y-2">
        {meusPalpites.length === 0 && <p className="text-sm text-muted-foreground">Nenhum palpite ainda.</p>}
        {meusPalpites.map((p, i) => {
          const j = p.jogos;
          if (!j) return null;
          const real = j.gols_a != null && j.gols_b != null;
          const exato = real && j.gols_a === p.gols_a && j.gols_b === p.gols_b;
          const vencedor = real && Math.sign(p.gols_a - p.gols_b) === Math.sign(j.gols_a - j.gols_b);
          const pts = exato ? 5 : vencedor ? 2 : 0;
          return (
            <div key={i} className="card-premium rounded-xl p-3 flex items-center gap-2 text-sm">
              <img src={flagUrl(j.bandeira_a ?? j.time_a, 40)} className="w-7 h-5 rounded" alt="" />
              <span className="font-bold flex-1 truncate">{teamName(j.bandeira_a ?? j.time_a)}</span>
              <span className="font-extrabold">{p.gols_a} × {p.gols_b}</span>
              <span className="font-bold flex-1 truncate text-right">{teamName(j.bandeira_b ?? j.time_b)}</span>
              <img src={flagUrl(j.bandeira_b ?? j.time_b, 40)} className="w-7 h-5 rounded" alt="" />
              {real && (
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold ${pts > 0 ? "bg-success text-success-foreground" : "bg-secondary"}`}>
                  +{pts}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => void signOut()} className="mt-6 w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-bold">
        Sair
      </button>
    </Layout>
  );
}
