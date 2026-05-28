import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
});

function AuthGuard() {
  // Auth removed: always show content
  const nav = useNavigate();
  
  
  return <Outlet />;
}
