import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { MeterInput } from "@/components/MeterInput";
import { MoneyInput } from "@/components/MoneyInput";
import { NumberCard } from "@/components/NumberCard";
import { fmt, fmtSigned, toNum } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FuelDesk — Smena hisob-kitobi" },
      {
        name: "description",
        content:
          "Yoqilg'i quyish shahobchasi uchun smena yopish kalkulyatori: Ai-92, Ai-95, Ai-98 hisob-kitobi.",
      },
    ],
  }),
  component: HomePage,
});

const FUELS = [
  { id: "92k4", name: "Ai-92", grade: "K4", price: 10800, color: "var(--color-fuel-92k4)" },
  { id: "92k5", name: "Ai-92", grade: "K5", price: 11400, color: "var(--color-fuel-92k5)" },
  { id: "95",   name: "Ai-95", grade: "",   price: 13000, color: "var(--color-fuel-95)"   },
  { id: "98",   name: "Ai-98", grade: "",   price: 16800, color: "var(--color-fuel-98)"   },
] as const;

const PAYMENTS = [
  { id: "online",   label: "Online karta" },
  { id: "terminal", label: "Terminal" },
  { id: "yandex",   label: "Yandex" },
  { id: "other",    label: "Boshqa" },
] as const;

type FuelId = typeof FUELS[number]["id"];
type PayId = typeof PAYMENTS[number]["id"];

function HomePage() {
  const [open, setOpen] = useState(false);
  const [tops, setTops] = useState<Record<FuelId, string>>({ "92k4": "", "92k5": "", "95": "", "98": "" });
  const [bots, setBots] = useState<Record<FuelId, string>>({ "92k4": "", "92k5": "", "95": "", "98": "" });
  const [pays, setPays] = useState<Record<PayId, string>>({ online: "", terminal: "", yandex: "", other: "" });

  const rows = useMemo(() =>
    FUELS.map((f) => {
      const top = toNum(tops[f.id]);
      const bot = toNum(bots[f.id]);
      const liters = Math.abs(bot - top);
      const subtotal = liters * f.price;
      return { ...f, top, bot, liters, subtotal };
    }),
    [tops, bots]
  );

  const totalLiters = rows.reduce((s, r) => s + r.liters, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.subtotal, 0);
  const totalPaid = PAYMENTS.reduce((s, p) => s + toNum(pays[p.id]), 0);
  const diff = totalPaid - totalRevenue;

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-6xl mx-auto px-5 py-8">
        {/* Hero */}
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black tracking-tight"
            >
              Smena yopish<span className="text-primary">.</span>
            </motion.h1>
            <p className="text-muted-foreground mt-2 max-w-md">
              4 ta yoqilg'i bo'yicha sanoq, hisob va to'lovlar — bir ekranda, xatosiz.
            </p>
          </div>
        </section>

        {/* Toggle */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setOpen((v) => !v)}
          className="w-full glass rounded-2xl border border-border/60 px-5 py-4 flex items-center justify-between group hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ rotate: open ? 45 : 0 }}
              className="h-9 w-9 rounded-xl grad-primary grid place-items-center text-primary-foreground text-xl font-bold glow"
            >
              +
            </motion.span>
            <div className="text-left">
              <div className="font-bold">Hisob-kitobni ochish</div>
              <div className="text-xs text-muted-foreground">
                Sanoq, litr, summa va to'lovlar
              </div>
            </div>
          </div>
          {totalLiters > 0 && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Jami litr</div>
              <div className="num-display text-xl font-bold text-primary">{fmt(totalLiters)} L</div>
            </div>
          )}
        </motion.button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-6 space-y-8">
                {/* Row 1: TOP meter readings */}
                <Section
                  index="01"
                  title="Boshlang'ich sanoq"
                  subtitle="Smena boshidagi 7-xonali ko'rsatkich"
                >
                  <Grid>
                    {FUELS.map((f) => (
                      <FuelHeader key={f.id} f={f}>
                        <MeterInput
                          label="Top"
                          tone="top"
                          value={tops[f.id]}
                          onChange={(v) => setTops((s) => ({ ...s, [f.id]: v }))}
                        />
                      </FuelHeader>
                    ))}
                  </Grid>
                </Section>

                {/* Row 2: BOTTOM meter readings */}
                <Section
                  index="02"
                  title="Yakuniy sanoq"
                  subtitle="Smena oxiridagi 7-xonali ko'rsatkich"
                >
                  <Grid>
                    {FUELS.map((f) => (
                      <FuelHeader key={f.id} f={f}>
                        <MeterInput
                          label="Bottom"
                          tone="bottom"
                          value={bots[f.id]}
                          onChange={(v) => setBots((s) => ({ ...s, [f.id]: v }))}
                        />
                      </FuelHeader>
                    ))}
                  </Grid>
                </Section>

                {/* Row 3: Liters × price */}
                <Section
                  index="03"
                  title="Litr × narx"
                  subtitle="|Yakuniy − Boshlang'ich| × narx"
                  right={
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Jami summa
                      </div>
                      <div className="num-display text-2xl font-black text-primary">
                        {fmt(totalRevenue)}
                      </div>
                    </div>
                  }
                >
                  <Grid>
                    {rows.map((r) => (
                      <motion.div
                        key={r.id}
                        layout
                        className="glass rounded-2xl border border-border/60 p-4"
                        style={{ boxShadow: `inset 0 0 0 1px ${r.color}22` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                            <span className="text-xs font-semibold">
                              {r.name}{r.grade && <span className="opacity-60 ml-1">{r.grade}</span>}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground num-display">
                            {fmt(r.price)} so'm/L
                          </span>
                        </div>
                        <div className="num-display text-sm text-muted-foreground">
                          {fmt(r.liters)} L
                        </div>
                        <div className="num-display text-2xl font-bold mt-1">
                          {fmt(r.subtotal)}
                        </div>
                      </motion.div>
                    ))}
                  </Grid>
                </Section>

                {/* Row 4: Payments */}
                <Section
                  index="04"
                  title="To'lovlar"
                  subtitle="Online, terminal, Yandex va boshqa"
                  right={
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Jami to'lovlar
                      </div>
                      <div className="num-display text-2xl font-black text-accent">
                        {fmt(totalPaid)}
                      </div>
                    </div>
                  }
                >
                  <Grid>
                    {PAYMENTS.map((p) => (
                      <MoneyInput
                        key={p.id}
                        label={p.label}
                        value={pays[p.id]}
                        onChange={(v) => setPays((s) => ({ ...s, [p.id]: v }))}
                        accent="var(--color-accent)"
                      />
                    ))}
                  </Grid>
                </Section>

                {/* Final */}
                <motion.section
                  layout
                  className="glass rounded-3xl border border-border/60 p-6 md:p-8 relative overflow-hidden"
                >
                  <div
                    className="absolute -inset-px rounded-3xl pointer-events-none opacity-40"
                    style={{
                      background:
                        diff > 0
                          ? "radial-gradient(ellipse at top, var(--color-success) 0%, transparent 60%)"
                          : diff < 0
                          ? "radial-gradient(ellipse at top, var(--color-destructive) 0%, transparent 60%)"
                          : "radial-gradient(ellipse at top, var(--color-muted) 0%, transparent 60%)",
                    }}
                  />
                  <div className="relative grid md:grid-cols-3 gap-4">
                    <NumberCard label="Jami summa (litr×narx)" value={totalRevenue} tone="primary" suffix="so'm" />
                    <NumberCard label="Jami to'lovlar" value={totalPaid} tone="accent" suffix="so'm" />
                    <motion.div
                      key={diff}
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-2xl p-4 border border-border/60 bg-background/40"
                    >
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Farq (to'lovlar − summa)
                      </div>
                      <div
                        className={`num-display mt-1 text-3xl font-black ${
                          diff > 0
                            ? "text-success"
                            : diff < 0
                            ? "text-destructive"
                            : "text-foreground"
                        }`}
                      >
                        {fmtSigned(diff)}
                        <span className="ml-1 text-sm text-muted-foreground font-normal">so'm</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {diff > 0
                          ? "Ortiqcha (profitsit)"
                          : diff < 0
                          ? "Kam (defitsit)"
                          : "Aynan teng"}
                      </div>
                    </motion.div>
                  </div>
                </motion.section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Section({
  index,
  title,
  subtitle,
  right,
  children,
}: {
  index: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between mb-3 gap-4">
        <div className="flex items-center gap-3">
          <span className="num-display text-xs text-primary font-bold">{index}</span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>;
}

function FuelHeader({
  f,
  children,
}: {
  f: typeof FUELS[number];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-1">
        <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />
        <span className="text-xs font-semibold">
          {f.name}
          {f.grade && <span className="opacity-60 ml-1">{f.grade}</span>}
        </span>
      </div>
      {children}
    </div>
  );
}
