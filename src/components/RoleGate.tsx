import { useAuth } from "@/hooks/useAuth";
import { canAccess, type AppRole } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function RoleGate({
  tab,
  children,
}: {
  tab: "reception" | "workshop" | "hr" | "settings";
  children: ReactNode;
}) {
  const { roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canAccess(tab, roles as AppRole[])) {
    return (
      <Card className="p-10 text-center space-y-3 max-w-lg mx-auto mt-10">
        <ShieldAlert className="w-12 h-12 mx-auto text-warning" />
        <h2 className="text-xl font-bold">غير مصرّح بالوصول</h2>
        <p className="text-sm text-muted-foreground">
          صلاحياتك الحالية لا تسمح بفتح هذا القسم. تواصل مع المدير العام لمنحك الدور المناسب.
        </p>
      </Card>
    );
  }

  return <>{children}</>;
}
