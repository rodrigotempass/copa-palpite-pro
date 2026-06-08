import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { TEAMS, flagUrl } from "@/lib/teams";
import { toast } from "sonner";
import { Crown, Check } from "lucide-react";

export const Route = createFileRoute("/campeao")({ component: CampeaoPage });

function CampeaoPage() {
  const { user, loading, profile, refresh } = useAuth();
  const [campeao, setCampeao] = useState<string>("");
  const [oficial, setOficial] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setCampeao(profile?.campeao ?? "");
    supabase.from("config").select("campeao_oficial").eq("id", 1).maybeSingle()
      .then(({ data }) => setOficial(data?.campeao_oficial ?? null));
  }, [user, profile]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  const lockedByOficial = !!oficial;

  const salvar = async () => {
    if (!campeao) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ campeao }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Campeão registrado!");
  };

  return (
    <Layout>
      <h1 className="text-2xl font-extrabold mb-1 flex items-center gap-2"><Crown className="text-gold" /> Campeão da Copa</h1>
      <p className="text-sm text-muted-foreground mb-5">Acertar o campeão vale <b className="text-gold">10 pontos</b>.</p>

      {lockedByOficial && (
        <div className="card-premium rounded-xl p-3 mb-4 text-sm">
          🏆 Campeão oficial declarado. Não é mais possível alterar seu palpite.
        </div>
      )}

      <div className="card-premium rounded-2xl p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[60dvh] overflow-y-auto p-1">
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
        <button onClick={salvar} disabled={!campeao || saving || lockedByOficial || campeao === profile?.campeao}
          className="mt-4 w-full py-3 rounded-lg bg-gold text-gold-foreground font-extrabold disabled:opacity-40">
          {profile?.campeao ? "Atualizar campeão" : "Confirmar campeão"}
        </button>
      </div>
    </Layout>
  );
}
