import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const loadProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) return;
      setDisplayName(data?.display_name ?? null);
    } catch {
      // ignore profile fetch errors (e.g. RLS not configured for anon users)
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setDisplayName(null);
      }
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        if (data.session.user) loadProfile(data.session.user.id);
        setLoading(false);
        return;
      }

      // Ensure we have an authenticated user for RLS-protected tables (e.g. shifts)
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (!error) {
        setSession(anon.session ?? null);
        if (anon.session?.user) loadProfile(anon.session.user.id);
      }
      setLoading(false);
    })();

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };
  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, displayName, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
