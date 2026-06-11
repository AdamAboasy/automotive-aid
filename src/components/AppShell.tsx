import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Car, Wrench, Users, Settings, LogOut, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { canAccess, ROLE_LABELS, type AppRole } from "@/lib/roles";
import { toast } from "sonner";

const TABS: { to: string; key: keyof typeof import("@/lib/roles").TAB_ACCESS; label: string; icon: typeof Car }[] = [
  { to: "/dashboard", key: "dashboard", label: "لوحة المعلومات", icon: BarChart3 },
  { to: "/reception", key: "reception", label: "خدمة العملاء والاستقبال", icon: Car },
  { to: "/workshop", key: "workshop", label: "الورشة", icon: Wrench },
  { to: "/hr", key: "hr", label: "الموارد البشرية", icon: Users },
  { to: "/settings", key: "settings", label: "الإعدادات", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, roles, loading } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/auth", replace: true });
  };

  const visibleTabs = TABS.filter((t) => canAccess(t.key, roles));
  const primaryRole = (roles[0] as AppRole | undefined) ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-10">
      <nav className="bg-card border-b border-border sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <div className="flex items-center justify-between h-16 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-lg md:text-xl font-bold text-primary hidden md:block">
                توكيل سيارات
              </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto md:overflow-visible flex-1 justify-center">
              {visibleTabs.map((t) => {
                const Icon = t.icon;
                const active = pathname.startsWith(t.to);
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className={`px-3 py-2 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!loading && user && (
                <div className="text-xs text-muted-foreground hidden md:block text-left">
                  <div className="font-medium text-foreground">{user.email}</div>
                  {primaryRole && <div>{ROLE_LABELS[primaryRole]}</div>}
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="تسجيل الخروج">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
