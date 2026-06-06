import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

const ORDER = ["/", "/reports", "/settings", "/calc"] as const;

export function SwipeNavigator() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    };
    const onEnd = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      const dt = Date.now() - start.current.t;
      start.current = null;
      if (dt > 600) return;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const idx = ORDER.indexOf(pathname as (typeof ORDER)[number]);
      if (idx === -1) return;
      const next = dx < 0 ? idx + 1 : idx - 1;
      if (next < 0 || next >= ORDER.length) return;
      navigate({ to: ORDER[next] });
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [pathname, navigate]);

  return null;
}
