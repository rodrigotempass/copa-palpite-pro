import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-dvh grid place-items-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth" />;
  return <Navigate to="/palpites" />;
}
