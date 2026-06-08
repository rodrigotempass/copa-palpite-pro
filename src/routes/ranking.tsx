import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";

export const Route = createFileRoute("/ranking")({ component: RankingPage });

type Row = { id: string; nome: string; pontos: number };

function RankingPage() {
  const { user, loading, profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("ranking").select("*").then(({ data }) => {
      const sorted = ((data as Row[]) ?? []).sort((a, b) => b.pontos - a.pontos);
      setRows(sorted);
    });
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  const meIdx = rows.findIndex((r) => r.id === user.id);

  return (
    <Layout>
      <h1 className="text-2xl font-extrabold mb-1">Ranking</h1>
      <p className="text-sm text-muted-foreground mb-4">Atualiza automaticamente quando o admin lança resultados.</p>

      {profile?.status !== "aprovado" && (
        <div className="card-premium rounded-xl p-3 mb-4 text-sm">
          ⏳ Seus palpites estão registrados, mas você só aparece no ranking depois da aprovação do admin.
        </div>
      )}

      {meIdx === -1 && profile?.status === "aprovado" && (
        <div className="card-premium rounded-xl p-3 mb-4 text-sm text-muted-foreground">
          Ainda sem pontuação registrada.
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r, i) => {
          const me = r.id === user.id;
          const pos = i + 1;
          const medal = pos === 1 ? "text-gold" : pos === 2 ? "text-muted-foreground" : pos === 3 ? "text-accent" : "";
          return (
            <div key={r.id} className={`card-premium rounded-xl p-3 flex items-center gap-3 ${me ? "ring-2 ring-primary" : ""}`}>
              <div className={`w-10 h-10 grid place-items-center rounded-full bg-secondary font-extrabold ${medal}`}>
                {pos <= 3 ? <Medal className="w-5 h-5" /> : pos}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{r.nome}{me && <span className="ml-2 text-[10px] uppercase text-primary">você</span>}</div>
                <div className="text-xs text-muted-foreground">Posição #{pos}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-gold flex items-center gap-1"><Trophy className="w-4 h-4" />{r.pontos}</div>
                <div className="text-[10px] uppercase text-muted-foreground">pontos</div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">Ranking vazio.</p>}
      </div>
    </Layout>
  );
}
