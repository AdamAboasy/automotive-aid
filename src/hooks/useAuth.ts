import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";

interface AuthState {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, roles: [], loading: true });

  useEffect(() => {
    let mounted = true;

    const loadRoles = async (userId: string) => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      return (data ?? []).map((r) => r.role as AppRole);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      setState((s) => ({ ...s, user, loading: true }));
      if (user) {
        setTimeout(async () => {
          const roles = await loadRoles(user.id);
          if (mounted) setState({ user, roles, loading: false });
        }, 0);
      } else {
        setState({ user: null, roles: [], loading: false });
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      if (user) {
        const roles = await loadRoles(user.id);
        if (mounted) setState({ user, roles, loading: false });
      } else {
        setState({ user: null, roles: [], loading: false });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
