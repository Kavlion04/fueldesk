import { motion } from "framer-motion";

interface Props {
  label?: string;
  size?: number;
}

/**
 * Creative animated "fuel droplet" loader.
 * Three drops orbit while a glow pulses underneath — fits the gas-station theme.
 */
export function FuelLoader({ label, size = 28 }: Props) {
  const dots = [0, 1, 2];
  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <motion.div
          className="absolute inset-0 rounded-full grad-primary opacity-30 blur-md"
          animate={{ scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {dots.map((i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full grad-primary"
            style={{ marginLeft: -3, marginTop: -3 }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.15,
            }}
            initial={false}
          >
            <motion.span
              className="absolute h-1.5 w-1.5 rounded-full bg-primary"
              style={{
                top: -size / 2 + 3,
                left: 0,
                boxShadow: "0 0 8px hsl(var(--primary) / 0.9)",
              }}
            />
          </motion.span>
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

/** Full-screen overlay variant. */
export function FuelLoaderOverlay({ label = "Saqlanmoqda…" }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] grid place-items-center bg-background/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        className="glass rounded-3xl border border-border/60 px-7 py-6 flex flex-col items-center gap-4 shadow-2xl"
      >
        <FuelLoader size={44} />
        <div className="text-sm font-semibold tracking-wide">{label}</div>
      </motion.div>
    </motion.div>
  );
}
