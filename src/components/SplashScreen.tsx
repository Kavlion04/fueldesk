import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Beautiful animated splash shown on initial app load.
 * Auto-dismisses after `duration` ms.
 */
export function SplashScreen({ duration = 1500 }: { duration?: number }) {
  const [show, setShow] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-background"
        >
          {/* radial glow backdrop */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{
              background:
                "radial-gradient(60% 50% at 50% 45%, hsl(var(--primary)/0.28), transparent 70%), radial-gradient(40% 35% at 50% 90%, hsl(var(--accent)/0.22), transparent 70%)",
            }}
          />

          {/* orbiting droplets */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute"
                animate={{ rotate: 360 }}
                transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: "linear" }}
                style={{ width: 200 + i * 60, height: 200 + i * 60 }}
              >
                <motion.span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 block h-2 w-2 rounded-full"
                  style={{
                    background: i === 0 ? "hsl(var(--primary))" : i === 1 ? "hsl(var(--accent))" : "hsl(var(--primary)/0.6)",
                    boxShadow: `0 0 14px hsl(var(--primary) / 0.7)`,
                  }}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                />
              </motion.div>
            ))}
          </div>

          {/* center logo */}
          <div className="relative flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 -m-6 rounded-3xl blur-2xl grad-primary opacity-60"
                animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.45, 0.75, 0.45] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative h-24 w-24 rounded-3xl grad-primary grid place-items-center text-primary-foreground text-5xl glow shadow-2xl">
                ⛽
              </div>
            </motion.div>

            <div className="flex flex-col items-center gap-3">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.45 }}
                className="text-4xl font-black tracking-tight"
              >
                FuelDesk<span className="text-primary">.</span>
              </motion.h1>

              {/* progress bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative h-1 w-44 rounded-full bg-foreground/10 overflow-hidden"
              >
                <motion.div
                  className="absolute inset-y-0 left-0 grad-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: duration / 1000 - 0.1, ease: "easeInOut" }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold mt-1"
              >
                Yuklanmoqda
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
