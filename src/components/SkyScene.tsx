import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Phase = "dawn" | "day" | "dusk" | "night";

function getPhase(h: number): Phase {
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

const GRADIENTS: Record<Phase, string> = {
  dawn: "linear-gradient(180deg, #ff9a76 0%, #ffd6a5 45%, #fef3c7 100%)",
  day: "linear-gradient(180deg, #60a5fa 0%, #93c5fd 55%, #dbeafe 100%)",
  dusk: "linear-gradient(180deg, #4c1d95 0%, #db2777 55%, #f59e0b 100%)",
  night: "linear-gradient(180deg, #020617 0%, #0f172a 55%, #1e293b 100%)",
};

export function SkyScene() {
  const [phase, setPhase] = useState<Phase>(() => getPhase(new Date().getHours()));

  useEffect(() => {
    const tick = () => setPhase(getPhase(new Date().getHours()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const isNight = phase === "night";
  const isDay = phase === "day" || phase === "dawn";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[55vh] overflow-hidden"
      aria-hidden
    >
      <motion.div
        key={phase}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 1.4 }}
        style={{ background: GRADIENTS[phase] }}
      />
      {/* Soft mask to fade into app bg */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

      {/* Stars (night) */}
      {isNight && (
        <div className="absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => {
            const left = (i * 53) % 100;
            const top = (i * 37) % 70;
            const delay = (i % 7) * 0.3;
            return (
              <motion.span
                key={i}
                className="absolute h-[2px] w-[2px] rounded-full bg-white"
                style={{ left: `${left}%`, top: `${top}%` }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 2 + (i % 4), repeat: Infinity, delay }}
              />
            );
          })}
        </div>
      )}

      {/* Moon */}
      {isNight && (
        <motion.div
          className="absolute right-8 top-10 h-20 w-20 rounded-full"
          style={{
            background: "radial-gradient(circle at 30% 30%, #fef9c3, #facc15 60%, #ca8a04)",
            boxShadow: "0 0 60px 10px rgba(250, 204, 21, 0.35)",
          }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: [10, 0, 10], opacity: 1 }}
          transition={{ y: { duration: 8, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 1.5 } }}
        >
          <div className="absolute right-3 top-4 h-3 w-3 rounded-full bg-yellow-200/40" />
          <div className="absolute left-5 top-9 h-2 w-2 rounded-full bg-yellow-200/40" />
        </motion.div>
      )}

      {/* Sun */}
      {!isNight && (
        <motion.div
          className="absolute right-10 top-8 h-24 w-24 rounded-full"
          style={{
            background:
              phase === "dusk"
                ? "radial-gradient(circle, #fde68a, #f97316 60%, #b91c1c)"
                : "radial-gradient(circle, #fef9c3, #fde047 55%, #f59e0b)",
            boxShadow:
              phase === "dusk"
                ? "0 0 80px 20px rgba(249, 115, 22, 0.5)"
                : "0 0 80px 25px rgba(253, 224, 71, 0.5)",
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [0.95, 1.03, 0.95], opacity: 1, rotate: 360 }}
          transition={{
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 80, repeat: Infinity, ease: "linear" },
            opacity: { duration: 1.5 },
          }}
        />
      )}

      {/* Clouds (day & dawn) */}
      {isDay &&
        [
          { top: "18%", size: 120, dur: 60, delay: 0, opacity: 0.85 },
          { top: "38%", size: 80, dur: 90, delay: -20, opacity: 0.7 },
          { top: "8%", size: 60, dur: 75, delay: -45, opacity: 0.6 },
        ].map((c, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: c.top, opacity: c.opacity }}
            initial={{ x: "-20%" }}
            animate={{ x: "120%" }}
            transition={{ duration: c.dur, repeat: Infinity, ease: "linear", delay: c.delay }}
          >
            <Cloud size={c.size} />
          </motion.div>
        ))}

      {/* Dusk clouds (orange-tinted) */}
      {phase === "dusk" && (
        <motion.div
          className="absolute top-[30%]"
          initial={{ x: "-20%" }}
          animate={{ x: "120%" }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        >
          <Cloud size={100} tint="#fed7aa" />
        </motion.div>
      )}
    </div>
  );
}

function Cloud({ size = 100, tint = "#ffffff" }: { size?: number; tint?: string }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill={tint}>
      <ellipse cx="30" cy="40" rx="22" ry="16" />
      <ellipse cx="55" cy="32" rx="28" ry="20" />
      <ellipse cx="75" cy="42" rx="20" ry="14" />
      <ellipse cx="50" cy="46" rx="35" ry="12" />
    </svg>
  );
}
