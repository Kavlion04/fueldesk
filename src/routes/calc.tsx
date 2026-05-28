import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { fmt } from "@/lib/format";

export const Route = createFileRoute("/calc")({
  head: () => ({
    meta: [
      { title: "Kalkulyator — FuelDesk" },
      { name: "description", content: "Qo'shish va ko'paytirish kalkulyatori." },
    ],
  }),
  component: CalcPage,
});

type Op = "+" | "×" | null;

function CalcPage() {
  const [a, setA] = useState<string>("");
  const [op, setOp] = useState<Op>(null);
  const [b, setB] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);

  const display = useMemo(() => {
    if (op && b) return b;
    if (op && !b) return a || "0";
    return a || "0";
  }, [a, b, op]);

  const press = (k: string) => {
    if (k === "C") {
      setA("");
      setB("");
      setOp(null);
      return;
    }
    if (k === "⌫") {
      if (op && b) setB((s) => s.slice(0, -1));
      else setA((s) => s.slice(0, -1));
      return;
    }
    if (k === "+" || k === "×") {
      if (a) setOp(k as Op);
      return;
    }
    if (k === "=") {
      if (a && op && b) {
        const x = Number(a),
          y = Number(b);
        const r = op === "+" ? x + y : x * y;
        setHistory((h) => [`${fmt(x)} ${op} ${fmt(y)} = ${fmt(r)}`, ...h].slice(0, 8));
        setA(String(r));
        setB("");
        setOp(null);
      }
      return;
    }
    // digit
    if (op) setB((s) => (s + k).slice(0, 12));
    else setA((s) => (s + k).slice(0, 12));
  };

  const keys = ["C", "⌫", "×", "+", "7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "00", "="];

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black tracking-tight mb-1"
        >
          Kalkulyator<span className="text-primary">.</span>
        </motion.h1>
        <p className="text-muted-foreground text-sm mb-6">
          Qo'shish va ko'paytirish — tez va aniq.
        </p>

        <div className="glass rounded-3xl border border-border/60 p-5 md:p-6">
          {/* Display */}
          <div className="rounded-2xl bg-background/50 border border-border/60 p-5 mb-4 min-h-30 flex flex-col justify-end">
            <AnimatePresence mode="popLayout">
              {(op || a) && (
                <motion.div
                  key={`expr-${a}-${op}-${b}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  className="text-right num-display text-sm text-muted-foreground h-5"
                >
                  {a && fmt(Number(a))} {op ?? ""} {b && fmt(Number(b))}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="text-right num-display text-4xl md:text-5xl font-black tracking-tight">
              {fmt(Number(display))}
            </div>
          </div>

          {/* Keys */}
          <div className="grid grid-cols-4 gap-2.5">
            {keys.map((k) => {
              const isOp = ["+", "×", "="].includes(k);
              const isUtil = ["C", "⌫"].includes(k);
              return (
                <motion.button
                  key={k}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => press(k)}
                  className={`h-14 md:h-16 rounded-2xl text-lg font-bold border transition-colors ${
                    k === "="
                      ? "grad-primary text-primary-foreground border-transparent col-span-1 glow"
                      : isOp
                        ? "bg-accent/15 border-accent/40 text-accent hover:bg-accent/25"
                        : isUtil
                          ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
                          : "bg-secondary/60 border-border/60 hover:bg-secondary"
                  }`}
                >
                  {k}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* History */}
        <div className="mt-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Tarix
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {history.length === 0 && (
                <div className="text-sm text-muted-foreground/70">Hali hisob yo'q.</div>
              )}
              {history.map((h, i) => (
                <motion.div
                  key={`${h}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="num-display text-sm glass rounded-xl px-3 py-2 border border-border/60"
                >
                  {h}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
