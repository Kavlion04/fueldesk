import { sanitize7 } from "@/lib/format";
import { motion } from "framer-motion";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label: string;
  tone?: "top" | "bottom";
}

export function MeterInput({ value, onChange, label, tone = "top" }: Props) {
  const padded = value.padStart(7, "0");
  const digits = padded.split("");
  return (
    <motion.label
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`glass relative block rounded-2xl border border-border/60 p-3 cursor-text group transition-colors focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-background ${
        tone === "top"
          ? "focus-within:border-accent/70 focus-within:ring-accent/35"
          : "focus-within:border-primary/70 focus-within:ring-primary/35"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${tone === "top" ? "bg-accent" : "bg-primary"}`}
        />
      </div>
      <div className="flex gap-1 num-display">
        {digits.map((d, i) => (
          <div
            key={i}
            className="flex-1 aspect-3/4 grid place-items-center rounded-md bg-background/60 border border-border/40 text-foreground text-lg font-semibold"
          >
            {d}
          </div>
        ))}
      </div>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(sanitize7(e.target.value))}
        className="absolute inset-0 opacity-0 cursor-text"
        aria-label={label}
      />
    </motion.label>
  );
}
