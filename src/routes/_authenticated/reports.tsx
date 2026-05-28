import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { NavBar } from "@/components/NavBar";
import { supabase } from "@/integrations/supabase/client";
import { fmt, fmtSigned } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "FuelDesk — Hisobotlar" }] }),
  component: ReportsPage,
});

type Range = "day" | "week" | "month";

const LOCAL_SHIFTS_KEY = "fueldesk:localShifts";

interface Row {
  id: string;
  shift_number: number | null;
  shift_date: string;
  created_at: string;
  total_revenue: number;
  total_paid: number;
  diff: number;
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}

function toRow(s: any): Row {
  return {
    id: String(s.id),
    shift_number: (s.shift_number ?? null) as number | null,
    shift_date: String(s.shift_date ?? ""),
    created_at: String(s.created_at ?? ""),
    total_revenue: Number(s.total_revenue ?? 0),
    total_paid: Number(s.total_paid ?? 0),
    diff: Number(s.diff ?? 0),
  };
}

function ReportsPage() {
  // Auth removed: always show reports page
  const [range, setRange] = useState<Range>("week");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    // user removed
    const since = new Date();
    if (range === "day") since.setHours(0, 0, 0, 0);
    if (range === "week") since.setDate(since.getDate() - 7);
    if (range === "month") since.setMonth(since.getMonth() - 1);

    const localAll = loadJSON<any[]>(LOCAL_SHIFTS_KEY, []);
    const localFiltered = localAll
      .map(toRow)
      .filter((r) => (r.created_at ? new Date(r.created_at) >= since : false))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    supabase
      .from("shifts")
      .select("id, shift_number, shift_date, created_at, total_revenue, total_paid, diff")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setRows(localFiltered);
          return;
        }
        const remote = ((data as Row[]) ?? []).map((r) => ({
          ...r,
          total_revenue: Number((r as any).total_revenue ?? 0),
          total_paid: Number((r as any).total_paid ?? 0),
          diff: Number((r as any).diff ?? 0),
        }));
        const mergedMap = new Map<string, Row>();
        localFiltered.forEach((r) => mergedMap.set(r.id, r));
        remote.forEach((r) => mergedMap.set(r.id, r));
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        setRows(merged);
      });
  }, [range]);

  const totals = useMemo(() => {
    const rev = rows.reduce((s, r) => s + Number(r.total_revenue), 0);
    const paid = rows.reduce((s, r) => s + Number(r.total_paid), 0);
    const diff = rows.reduce((s, r) => s + Number(r.diff), 0);
    return { rev, paid, diff, count: rows.length };
  }, [rows]);

  const chartData = useMemo(() => {
    // group by date
    const map = new Map<string, { date: string; revenue: number; paid: number }>();
    rows.forEach((r) => {
      const key = new Date(r.created_at).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      });
      const cur = map.get(key) ?? { date: key, revenue: 0, paid: 0 };
      cur.revenue += Number(r.total_revenue);
      cur.paid += Number(r.total_paid);
      map.set(key, cur);
    });
    return Array.from(map.values());
  }, [rows]);

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-6xl mx-auto px-5 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-black tracking-tight mb-2"
        >
          Hisobotlar<span className="text-primary">.</span>
        </motion.h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Smenalar bo'yicha statistika va grafiklar.
        </p>

        <div className="flex gap-1 p-1 rounded-full bg-secondary/60 border border-border/60 w-fit mb-6">
          {(
            [
              { id: "day", label: "Bugun" },
              { id: "week", label: "Hafta" },
              { id: "month", label: "Oy" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setRange(t.id)}
              className={`relative px-4 py-1.5 text-xs font-semibold rounded-full ${
                range === t.id ? "grad-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Smenalar" value={totals.count.toString()} />
          <Stat label="Jami summa" value={fmt(totals.rev)} tone="primary" />
          <Stat label="Jami to'lovlar" value={fmt(totals.paid)} tone="accent" />
          <Stat
            label="Umumiy farq"
            value={fmtSigned(totals.diff)}
            tone={totals.diff > 0 ? "success" : totals.diff < 0 ? "destructive" : "default"}
          />
        </div>

        <div className="glass rounded-3xl border border-border/60 p-4 md:p-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Daromad / To'lov dinamikasi
          </div>
          {chartData.length === 0 ? (
            <div className="h-64 grid place-items-center text-muted-foreground text-sm">
              Hozircha ma'lumot yo'q.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickFormatter={(v) =>
                      v >= 1_000_000
                        ? (v / 1_000_000).toFixed(1) + "M"
                        : (v / 1000).toFixed(0) + "k"
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                    }}
                    formatter={(v: any) => fmt(Number(v))}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-primary)"
                    radius={[6, 6, 0, 0]}
                    name="Summa"
                  />
                  <Bar
                    dataKey="paid"
                    fill="var(--color-accent)"
                    radius={[6, 6, 0, 0]}
                    name="To'lov"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary" | "accent" | "success" | "destructive";
}) {
  const cls = {
    default: "text-foreground",
    primary: "text-primary",
    accent: "text-accent",
    success: "text-success",
    destructive: "text-destructive",
  }[tone];
  return (
    <div className="glass rounded-2xl border border-border/60 p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`num-display text-xl font-black mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
