import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
});

function AuthGuard() {
  const { session, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth" });
  }, [loading, session, nav]);

  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-xs text-muted-foreground tracking-widest uppercase animate-pulse">Yuklanmoqda…</div>
      </div>
    );
  }

  return <Outlet />;
}
