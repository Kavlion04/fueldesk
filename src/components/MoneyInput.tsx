import { motion } from "framer-motion";
import { sanitizeN } from "@/lib/format";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent?: string;
  placeholder?: string;
  maxLen?: number;
}

export function MoneyInput({ label, value, onChange, accent, placeholder = "0", maxLen = 8 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="glass rounded-2xl p-3 border border-border/60"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {accent && (
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        )}
      </div>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(sanitize7(e.target.value))}
        placeholder={placeholder}
        className="w-full bg-transparent num-display text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
      />
    </motion.div>
  );
}
