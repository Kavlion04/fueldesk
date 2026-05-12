import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "FuelDesk — Kirish" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) nav({ to: "/" });
  }, [loading, session, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { display_name: name || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e.message ?? "Xatolik");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl border border-border/60 p-7"
      >
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-10 w-10 rounded-xl grad-primary glow grid place-items-center text-primary-foreground font-black">⛽</div>
          <div>
            <div className="font-bold tracking-tight">FuelDesk</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Smena hisob-kitobi</div>
          </div>
        </div>

        <h1 className="text-2xl font-black mb-1">{mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}</h1>
        <p className="text-xs text-muted-foreground mb-5">
          {mode === "login" ? "O'z hisobingizga kiring." : "Yangi operator hisobi yarating."}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field label="Operator ismi">
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Akmal"
                className="w-full bg-background/40 border border-border/60 rounded-xl px-3 py-2.5 outline-none focus:border-primary/60" />
            </Field>
          )}
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background/40 border border-border/60 rounded-xl px-3 py-2.5 outline-none focus:border-primary/60" />
          </Field>
          <Field label="Parol">
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background/40 border border-border/60 rounded-xl px-3 py-2.5 outline-none focus:border-primary/60" />
          </Field>

          {err && <div className="text-xs text-destructive">{err}</div>}

          <button type="submit" disabled={busy}
            className="w-full grad-primary text-primary-foreground font-bold py-3 rounded-xl glow disabled:opacity-50">
            {busy ? "..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login" ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"}{" "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); }}
            className="text-primary font-semibold">
            {mode === "login" ? "Ro'yxatdan o'tish" : "Kirish"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
