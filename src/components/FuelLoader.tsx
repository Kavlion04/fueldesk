import { motion } from "framer-motion";

interface Props {
  label?: string;
  size?: number;
}

/**
 * Creative animated loader — a glowing "fuel droplet" bouncing trio.
 * Uses the design system's gradient + glow.
 */
export function FuelLoader({ label, size = 8 }: Props) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="relative inline-flex items-end gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block rounded-full grad-primary"
            style={{
              width: size,
              height: size,
              boxShadow: "0 0 12px hsl(var(--primary) / 0.6)",
            }}
            animate={{
              y: [0, -size * 1.4, 0],
              scale: [1, 1.15, 1],
              opacity: [0.55, 1, 0.55],
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.12,
            }}
          />
        ))}
      </div>
      {label && (
        <motion.span
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="text-sm font-semibold tracking-wide"
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}

/** Full-screen overlay variant — for blocking saves. */
export function FuelLoaderOverlay({ label = "Saqlanmoqda…" }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] grid place-items-center bg-background/75 backdrop-blur-md p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        className="relative glass rounded-3xl border border-border/60 px-8 py-7 flex flex-col items-center gap-5 shadow-2xl overflow-hidden"
      >
        <div className="absolute -top-px left-6 right-6 h-px grad-primary opacity-80" />
        <div className="relative">
          <motion.div
            className="absolute inset-0 -m-3 rounded-full grad-primary opacity-25 blur-xl"
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative h-14 w-14 rounded-2xl grad-primary grid place-items-center text-primary-foreground text-2xl glow">
            ⛽
          </div>
        </div>
        <FuelLoader size={9} />
        <div className="text-sm font-semibold tracking-wide text-center">{label}</div>
      </motion.div>
    </motion.div>
  );
}
