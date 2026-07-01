import { ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";
import { haptic } from "@/lib/haptic";
import { useI18n } from "@/hooks/useI18n";

interface Props {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  threshold?: number;
}

/**
 * Simple pull-to-refresh wrapper. Activates only when the page is scrolled to the top
 * and the user drags downwards. On release past `threshold`, triggers `onRefresh`.
 */
export function PullToRefresh({ onRefresh, children, threshold = 70 }: Props) {
  const { t } = useI18n();
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 4) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    // dampen
    setPull(Math.min(threshold * 1.8, delta * 0.5));
  };

  const onTouchEnd = async () => {
    if (startY.current == null) return;
    startY.current = null;
    if (pull >= threshold && !refreshing) {
      haptic("success");
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const active = pull > 0 || refreshing;
  const progress = Math.min(1, pull / threshold);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {active && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex justify-center"
          style={{ transform: `translateY(${Math.max(8, pull - 20)}px)` }}
        >
          <motion.div
            animate={{ rotate: refreshing ? 360 : progress * 320 }}
            transition={refreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.1 }}
            className="h-10 w-10 rounded-full grid place-items-center bg-background/80 border border-border/60 backdrop-blur-xl shadow-lg"
          >
            <span className="text-lg">⛽</span>
          </motion.div>
        </div>
      )}
      <motion.div animate={{ y: refreshing ? 40 : pull }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        {refreshing && (
          <div className="text-center text-[11px] uppercase tracking-widest text-muted-foreground pt-2">
            {t("pull.refreshing")}
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
}
