import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, UserCog, Trash2, Plus, UserX } from "lucide-react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SimpleListManager } from "@/components/settings/SimpleListManager";
import { BrandsModelsManager } from "@/components/settings/BrandsModelsManager";
import { EmployeesManager } from "@/components/settings/EmployeesManager";
import { useServerFn } from "@tanstack/react-start";
import { createUserAccount, deleteUserAccount } from "@/lib/admin-users.functions";
import { useAuth } from "@/hooks/useAuth";


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
              إدارة المستخدمين والقوائم المرجعية للنظام.
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="users">المستخدمون</TabsTrigger>
          <TabsTrigger value="brands">الماركات والموديلات</TabsTrigger>
          <TabsTrigger value="banks">البنوك</TabsTrigger>
          <TabsTrigger value="body_types">أنواع الهياكل</TabsTrigger>
          <TabsTrigger value="warehouses">المخازن</TabsTrigger>
          <TabsTrigger value="workshops">الورش</TabsTrigger>
          <TabsTrigger value="employees">الموظفون</TabsTrigger>
        </TabsList>

        <TabsContent value="users"><Card className="p-6"><UsersAndRoles /></Card></TabsContent>
        <TabsContent value="brands"><Card className="p-6"><BrandsModelsManager /></Card></TabsContent>
        <TabsContent value="banks"><Card className="p-6"><SimpleListManager table="banks" label="البنك" /></Card></TabsContent>
        <TabsContent value="body_types"><Card className="p-6"><SimpleListManager table="body_types" label="نوع الهيكل" /></Card></TabsContent>
        <TabsContent value="warehouses"><Card className="p-6"><SimpleListManager table="warehouses" label="المخزن" withLocation /></Card></TabsContent>
        <TabsContent value="workshops"><Card className="p-6"><SimpleListManager table="workshops" label="الورشة" withLocation /></Card></TabsContent>
        <TabsContent value="employees"><Card className="p-6"><EmployeesManager /></Card></TabsContent>
      </Tabs>
    </div>
  );
}

function UsersAndRoles() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const createUser = useServerFn(createUserAccount);
  const deleteUser = useServerFn(deleteUserAccount);

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

  useEffect(() => { load(); }, []);

  const addRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    toast.success("تمت إضافة الدور");
    load();
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) return toast.error(error.message);
    toast.success("تم حذف الدور");
    load();
  };

  const handleDelete = async (userId: string, name: string | null) => {
    if (!confirm(`حذف المستخدم "${name || userId}" نهائياً؟`)) return;
    try {
      await deleteUser({ data: { userId } });
      toast.success("تم حذف المستخدم");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "فشل الحذف");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">المستخدمون والأدوار</h2>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 ml-1" /> إضافة مستخدم
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-6">جاري التحميل...</div>
      ) : users.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">لا يوجد مستخدمون</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserRoleRow
              key={u.id}
              user={u}
              isSelf={u.id === currentUser?.id}
              onAdd={addRole}
              onRemove={removeRole}
              onDelete={() => handleDelete(u.id, u.full_name)}
            />
          ))}
        </div>
      )}

      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={async (payload) => {
          try {
            await createUser({ data: payload });
            toast.success("تم إنشاء المستخدم");
            setAddOpen(false);
            load();
          } catch (e: any) {
            toast.error(e?.message ?? "فشل الإنشاء");
          }
        }}
      />
    </div>
  );
}

function UserRoleRow({
  user, isSelf, onAdd, onRemove, onDelete,
}: {
  user: UserRow;
  isSelf: boolean;
  onAdd: (id: string, role: AppRole) => void;
  onRemove: (id: string, role: AppRole) => void;
  onDelete: () => void;
}) {
  const [pending, setPending] = useState<AppRole | "">("");
  const available = ALL_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <div className="border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
      <div className="min-w-0">
        <div className="font-medium flex items-center gap-2">
          {user.full_name || "—"}
          {isSelf && <span className="text-xs bg-muted px-2 py-0.5 rounded">أنت</span>}
        </div>
        <div className="text-xs text-muted-foreground truncate" dir="ltr">{user.id}</div>
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
              title="حذف الدور"
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
        {!isSelf && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            title="حذف المستخدم نهائياً"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <UserX className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function AddUserDialog({
  open, onOpenChange, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (p: { email: string; password: string; fullName: string; role: AppRole }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("reception");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setEmail(""); setPassword(""); setFullName(""); setRole("reception"); }
  }, [open]);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      toast.error("الإيميل مطلوب وكلمة السر لا تقل عن 6 حروف");
      return;
    }
    setSaving(true);
    await onCreate({ email: email.trim(), password, fullName: fullName.trim(), role });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input type="email" placeholder="الإيميل *" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          <Input type="password" placeholder="كلمة السر (6 أحرف على الأقل) *" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
          <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>إلغاء</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "جاري الحفظ..." : "إنشاء"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

