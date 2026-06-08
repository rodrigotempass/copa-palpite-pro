import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (user) return <Navigate to="/jogos" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: { nome },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Cadastro realizado! Você já pode entrar.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate({ to: "/jogos" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-md card-premium rounded-2xl p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-full chip-gold grid place-items-center text-2xl mb-3">⚽</div>
          <h1 className="text-2xl font-extrabold">Bolão Copa 2026</h1>
          <p className="text-sm text-muted-foreground">Entre ou crie sua conta para palpitar</p>
        </div>

        <div className="grid grid-cols-2 p-1 rounded-lg bg-secondary mb-5 text-sm font-semibold">
          <button
            type="button"
            className={`py-2 rounded-md transition ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setMode("login")}
          >Entrar</button>
          <button
            type="button"
            className={`py-2 rounded-md transition ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setMode("signup")}
          >Cadastrar</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</label>
              <input required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-input border border-border focus:border-primary outline-none" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-input border border-border focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Senha</label>
            <input required type="password" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-lg bg-input border border-border focus:border-primary outline-none" />
          </div>
          <button disabled={loading} className="w-full mt-2 py-3 rounded-lg bg-primary text-primary-foreground font-extrabold hover:opacity-90 disabled:opacity-50">
            {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-[11px] text-center text-muted-foreground">
          Novos cadastros ficam pendentes até a aprovação do administrador. Você já pode palpitar enquanto isso!
        </p>
      </div>
    </div>
  );
}
