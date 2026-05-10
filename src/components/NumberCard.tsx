import { motion } from "framer-motion";
import { fmt } from "@/lib/format";

interface Props {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "primary" | "success" | "destructive" | "accent";
  suffix?: string;
}

const toneMap = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  destructive: "text-destructive",
  accent: "text-accent",
} as const;

export function NumberCard({ label, value, hint, tone = "default", suffix }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-4 border border-border/60"
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`num-display mt-1 text-2xl font-bold ${toneMap[tone]}`}>
        {fmt(value)}
        {suffix && <span className="ml-1 text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </motion.div>
  );
}
