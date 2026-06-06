import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
  const maxChartValue = useMemo(() => Math.max(1, ...chartData.flatMap((d) => [d.revenue, d.paid])), [chartData]);

  const exportExcel = () => {
    const header = ["Smena", "Sana", "Jami summa", "Jami to'lov", "Farq"];
    const body = rows.map((r) => [
      r.shift_number ?? "",
      r.created_at ? new Date(r.created_at).toLocaleString("ru-RU") : r.shift_date,
      r.total_revenue,
      r.total_paid,
      r.diff,
    ]);
    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fueldesk-hisobot-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>FuelDesk Hisobot</title><style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111} h1{margin:0 0 12px} table{width:100%;border-collapse:collapse;margin-top:18px} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f4f4f4}.num{text-align:right;font-variant-numeric:tabular-nums}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.card{border:1px solid #ddd;border-radius:10px;padding:12px}.label{font-size:10px;text-transform:uppercase;color:#666}.value{font-size:18px;font-weight:800}
    </style></head><body><h1>FuelDesk hisobot</h1><div class="cards">
      <div class="card"><div class="label">Smenalar</div><div class="value">${totals.count}</div></div>
      <div class="card"><div class="label">Jami summa</div><div class="value">${fmt(totals.rev)}</div></div>
      <div class="card"><div class="label">Jami to'lov</div><div class="value">${fmt(totals.paid)}</div></div>
      <div class="card"><div class="label">Farq</div><div class="value">${fmtSigned(totals.diff)}</div></div>
    </div><table><thead><tr><th>Smena</th><th>Sana</th><th>Summa</th><th>To'lov</th><th>Farq</th></tr></thead><tbody>${rows.map((r) => `<tr><td>#${r.shift_number ?? "—"}</td><td>${r.created_at ? new Date(r.created_at).toLocaleString("ru-RU") : r.shift_date}</td><td class="num">${fmt(r.total_revenue)}</td><td class="num">${fmt(r.total_paid)}</td><td class="num">${fmtSigned(r.diff)}</td></tr>`).join("")}</tbody></table></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

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

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-1 p-1 rounded-full bg-secondary/60 border border-border/60 w-fit">
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
          <div className="flex gap-2">
            <button onClick={exportPdf} className="px-3 py-2 rounded-xl border border-border/60 bg-secondary/40 text-xs font-semibold hover:border-primary/50 transition-colors">PDF</button>
            <button onClick={exportExcel} className="px-3 py-2 rounded-xl border border-border/60 bg-secondary/40 text-xs font-semibold hover:border-accent/50 transition-colors">Excel</button>
          </div>
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
            <div className="h-64 flex items-end gap-2 overflow-x-auto pb-2" data-no-swipe>
              {chartData.map((d) => (
                <div key={d.date} className="min-w-14 flex-1 h-full flex flex-col justify-end gap-1">
                  <div className="flex items-end gap-1 h-full px-1">
                    <div title={`Summa: ${fmt(d.revenue)}`} className="flex-1 rounded-t-lg grad-primary min-h-1" style={{ height: `${Math.max(4, (d.revenue / maxChartValue) * 100)}%` }} />
                    <div title={`To'lov: ${fmt(d.paid)}`} className="flex-1 rounded-t-lg bg-accent min-h-1" style={{ height: `${Math.max(4, (d.paid / maxChartValue) * 100)}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center num-display">{d.date}</div>
                </div>
              ))}
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
