import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, UserCog, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ALL_ROLES, ROLE_LABELS, type AppRole } from "@/lib/roles";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — توكيل السيارات" }] }),
  component: () => (
    <RoleGate tab="settings">
      <SettingsPage />
    </RoleGate>
  ),
});

interface UserRow {
  id: string;
  full_name: string | null;
  roles: AppRole[];
}

function SettingsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("created_at", { ascending: true });
    const { data: rolesData, error: rErr } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (pErr || rErr) {
      toast.error("تعذّر تحميل المستخدمين");
      setLoading(false);
      return;
    }
    const byUser = new Map<string, AppRole[]>();
    (rolesData ?? []).forEach((r) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      byUser.set(r.user_id, arr);
    });
    setUsers(
      (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        roles: byUser.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تمت إضافة الدور");
    load();
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم حذف الدور");
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary p-3 rounded-xl">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الإعدادات</h1>
            <p className="text-sm text-muted-foreground mt-1">
              إدارة المستخدمين والأدوار. باقي القوائم المرجعية (البنوك، الماركات، الموديلات...) هتتنقل لقاعدة البيانات في المرحلة القادمة.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">المستخدمون والأدوار</h2>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-6">جاري التحميل...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">لا يوجد مستخدمون</div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <UserRoleRow key={u.id} user={u} onAdd={addRole} onRemove={removeRole} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function UserRoleRow({
  user,
  onAdd,
  onRemove,
}: {
  user: UserRow;
  onAdd: (id: string, role: AppRole) => void;
  onRemove: (id: string, role: AppRole) => void;
}) {
  const [pending, setPending] = useState<AppRole | "">("");
  const available = ALL_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <div className="border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
      <div>
        <div className="font-medium">{user.full_name || "—"}</div>
        <div className="text-xs text-muted-foreground" dir="ltr">{user.id}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {user.roles.length === 0 && (
          <span className="text-xs text-warning">بدون دور</span>
        )}
        {user.roles.map((r) => (
          <span
            key={r}
            className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs px-2 py-1 rounded-md"
          >
            {ROLE_LABELS[r]}
            <button
              onClick={() => onRemove(user.id, r)}
              className="hover:text-destructive"
              title="حذف"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </span>
        ))}
        {available.length > 0 && (
          <div className="flex items-center gap-1">
            <Select value={pending} onValueChange={(v) => setPending(v as AppRole)}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="إضافة دور" />
              </SelectTrigger>
              <SelectContent>
                {available.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="secondary"
              disabled={!pending}
              onClick={() => {
                if (pending) {
                  onAdd(user.id, pending);
                  setPending("");
                }
              }}
            >
              إضافة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
