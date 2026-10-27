import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;

    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted) {
        if (error) setAuthError(`Could not restore your session: ${error.message}`);
        setSession(data?.session ?? null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError("");
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    configured: Boolean(supabase),
    session,
    loading,
    authError,
    signIn: (email, password) => {
      if (!supabase) throw new Error("Supabase is not configured. Set the frontend environment variables.");
      return supabase.auth.signInWithPassword({ email, password });
    },
    signUp: (email, password) => {
      if (!supabase) throw new Error("Supabase is not configured. Set the frontend environment variables.");
      return supabase.auth.signUp({ email, password });
    },
    signOut: () => {
      if (!supabase) throw new Error("Supabase is not configured. Set the frontend environment variables.");
      return supabase.auth.signOut();
    },
  }), [session, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
