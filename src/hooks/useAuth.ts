import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";

interface AuthState {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

async function loadRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) {
    console.error("[useAuth] loadRoles error:", error);
    return [];
  }
  return (data ?? []).map((r) => r.role as AppRole);
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, roles: [], loading: true });

  useEffect(() => {
    let mounted = true;
    let currentUserId: string | null = null;

    const sync = async (user: User | null) => {
      if (!mounted) return;
      if (!user) {
        currentUserId = null;
        setState({ user: null, roles: [], loading: false });
        return;
      }
      currentUserId = user.id;
      const roles = await loadRoles(user.id);
      if (!mounted || currentUserId !== user.id) return;
      setState({ user, roles, loading: false });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // defer to avoid deadlocks in the auth callback
      setTimeout(() => sync(session?.user ?? null), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      sync(data.session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
