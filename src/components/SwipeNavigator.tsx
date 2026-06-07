import { useEffect, useRef, useState, startTransition } from "react";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";

const ORDER = ["/", "/reports", "/settings", "/calc"] as const;
const SWIPE_MIN = 60;
const EDGE_IGNORE = 16;

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "input, textarea, select, button, a, label, [role='button'], [data-no-swipe]",
      ),
    )
  );
}

export function SwipeNavigator() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const decided = useRef<"h" | "v" | null>(null);
  const locked = useRef(false);
  const [hint, setHint] = useState<{ dir: -1 | 1; progress: number } | null>(null);

  // Preload neighbour routes whenever the current route changes.
  useEffect(() => {
    const idx = ORDER.indexOf(pathname as (typeof ORDER)[number]);
    if (idx === -1) return;
    [idx - 1, idx + 1].forEach((i) => {
      if (i >= 0 && i < ORDER.length) {
        router.preloadRoute({ to: ORDER[i] }).catch(() => {});
      }
    });
  }, [pathname, router]);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || locked.current) return;
      if (isInteractiveTarget(e.target)) return;
      const t = e.touches[0];
      // Ignore swipes that start at the screen edge (browser back gesture).
      if (t.clientX < EDGE_IGNORE || t.clientX > window.innerWidth - EDGE_IGNORE) return;
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
      decided.current = null;
    };
    const onMove = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.touches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;

      // Lock axis early so vertical scroll stays smooth.
      if (decided.current === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        decided.current = Math.abs(dx) > Math.abs(dy) * 1.2 ? "h" : "v";
      }
      if (decided.current === "v") return;

      const idx = ORDER.indexOf(pathname as (typeof ORDER)[number]);
      if (idx === -1) return;
      const dir: -1 | 1 = dx < 0 ? 1 : -1;
      const next = idx + dir;
      if (next < 0 || next >= ORDER.length) return;

      // Live progress hint.
      const progress = Math.min(1, Math.abs(dx) / 140);
      setHint({ dir, progress });

      if (Math.abs(dx) >= SWIPE_MIN) {
        e.preventDefault();
        locked.current = true;
        start.current = null;
        setHint(null);
        startTransition(() => navigate({ to: ORDER[next] }));
        window.setTimeout(() => {
          locked.current = false;
        }, 280);
      }
    };
    const onEnd = () => {
      start.current = null;
      decided.current = null;
      setHint(null);
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

  if (!hint) return null;
  const side = hint.dir === 1 ? "right-3" : "left-3";
  const arrow = hint.dir === 1 ? "›" : "‹";
  return (
    <div
      className={`fixed top-1/2 ${side} z-50 -translate-y-1/2 pointer-events-none`}
      style={{ opacity: 0.35 + hint.progress * 0.6, transform: `translateY(-50%) scale(${0.8 + hint.progress * 0.4})` }}
    >
      <div className="h-12 w-12 rounded-full grad-primary text-primary-foreground grid place-items-center text-2xl font-black shadow-lg">
        {arrow}
      </div>
    </div>
  );
}
