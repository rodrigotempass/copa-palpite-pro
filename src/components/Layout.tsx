import { Link, useRouterState } from "@tanstack/react-router";
import { Trophy, Calendar, ListChecks, Shield, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";

const navItems = [
  { to: "/palpites", label: "Meus Palpites", icon: ListChecks },
  { to: "/ranking", label: "Ranking", icon: Trophy },
];

export function Layout({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh pb-24">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full chip-gold grid place-items-center text-lg">⚽</div>
            <div className="leading-tight">
              <div className="font-extrabold text-sm">Bolão Copa 2026</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Brasil · Horário oficial</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {profile && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                <User className="w-3 h-3" />
                {profile.nome}
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    profile.status === "aprovado"
                      ? "bg-success text-success-foreground"
                      : profile.status === "pendente"
                        ? "bg-warning text-warning-foreground"
                        : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {profile.status}
                </span>
              </span>
            )}
            <button
              onClick={() => void signOut()}
              className="p-2 rounded-md hover:bg-secondary text-muted-foreground"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto grid grid-cols-3">
          {navItems.map((it) => {
            const active = path.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {it.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                path.startsWith("/admin") ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="w-5 h-5" />
              Admin
            </Link>
          )}
          {!isAdmin && (
            <Link
              to="/perfil"
              className={`flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                path.startsWith("/perfil") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-5 h-5" />
              Perfil
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
