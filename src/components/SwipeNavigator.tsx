import { useEffect, useRef, startTransition } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

const ORDER = ["/", "/reports", "/settings", "/calc"] as const;
const SWIPE_MIN = 46;

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("input, textarea, select, button, a, [role='button'], [data-no-swipe]"));
}

export function SwipeNavigator() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const locked = useRef(false);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isInteractiveTarget(e.target) || locked.current) return;
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    };
    const onMove = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.touches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.35) return;
      const idx = ORDER.indexOf(pathname as (typeof ORDER)[number]);
      if (idx === -1) return;
      const next = dx < 0 ? idx + 1 : idx - 1;
      if (next < 0 || next >= ORDER.length) return;
      e.preventDefault();
      locked.current = true;
      start.current = null;
      startTransition(() => navigate({ to: ORDER[next] }));
      window.setTimeout(() => { locked.current = false; }, 360);
    };
    const onEnd = () => {
      start.current = null;
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [pathname, navigate]);

  return null;
}
