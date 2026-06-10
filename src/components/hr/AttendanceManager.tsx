import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, LogIn, LogOut } from "lucide-react";
import { fmtDate } from "@/lib/format";

const STATUSES = [
  { v: "present", l: "حاضر" },
  { v: "absent", l: "غائب" },
  { v: "leave", l: "إجازة" },
  { v: "sick", l: "إجازة مرضية" },
];

interface Att {
  id: string; employee_id: string; work_date: string;
  check_in: string | null; check_out: string | null;
  status: string; notes: string | null;
  employees?: { full_name: string } | null;
}

const today = () => new Date().toISOString().slice(0, 10);
const empty = { employee_id: "", work_date: today(), check_in: "", check_out: "", status: "present", notes: "" };

export function AttendanceManager() {
  const [rows, setRows] = useState<Att[]>([]);
  const [emps, setEmps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(empty);
  const [dateFilter, setDateFilter] = useState(today());

  const load = async () => {
    setLoading(true);
    const [a, e] = await Promise.all([
      supabase.from("attendance")
        .select("*, employees(full_name)")
        .eq("work_date", dateFilter)
        .order("created_at", { ascending: false }),
      supabase.from("employees").select("id,full_name").order("name"),
    ]);
    if (a.error) toast.error(a.error.message);
    setRows((a.data as Att[]) ?? []);
    setEmps(e.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [dateFilter]);

  const save = async () => {
    if (!draft.employee_id) return toast.error("اختر الموظف");
    const payload: any = {
      employee_id: draft.employee_id,
      work_date: draft.work_date,
      check_in: draft.check_in ? new Date(draft.check_in).toISOString() : null,
      check_out: draft.check_out ? new Date(draft.check_out).toISOString() : null,
      status: draft.status,
      notes: draft.notes.trim() || null,
    };
    const op = editing
      ? supabase.from("attendance").update(payload).eq("id", editing)
      : supabase.from("attendance").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "تم التحديث" : "تم التسجيل");
    setAdding(false); setEditing(null); setDraft(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف السجل؟")) return;
    const { error } = await supabase.from("attendance").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  const checkOut = async (id: string) => {
    const { error } = await supabase.from("attendance").update({ check_out: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل الانصراف"); load();
  };

  const quickCheckIn = async (employee_id: string) => {
    const { error } = await supabase.from("attendance").upsert({
      employee_id, work_date: today(), check_in: new Date().toISOString(), status: "present",
    }, { onConflict: "employee_id,work_date" });
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل الحضور"); load();
  };

  const startEdit = (a: Att) => {
    setEditing(a.id); setAdding(false);
    setDraft({
      employee_id: a.employee_id,
      work_date: a.work_date,
      check_in: a.check_in ? a.check_in.slice(0, 16) : "",
      check_out: a.check_out ? a.check_out.slice(0, 16) : "",
      status: a.status,
      notes: a.notes ?? "",
    });
  };

  const cancel = () => { setAdding(false); setEditing(null); setDraft(empty); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
        <h2 className="text-lg font-bold">الحضور والانصراف</h2>
        <div className="flex gap-2 items-center">
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-44" />
          {!adding && !editing && (
            <Button onClick={() => { setAdding(true); setDraft({ ...empty, work_date: dateFilter }); }} size="sm">
              <Plus className="w-4 h-4 ml-1" /> سجل يدوي
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="text-sm font-medium mb-2">تسجيل حضور سريع (لليوم)</div>
        <div className="flex flex-wrap gap-2">
          {emps.map((e) => (
            <Button key={e.id} size="sm" variant="outline" onClick={() => quickCheckIn(e.id)}>
              <LogIn className="w-3 h-3 ml-1" /> {e.name}
            </Button>
          ))}
          {emps.length === 0 && <div className="text-xs text-muted-foreground">لا يوجد موظفين — أضفهم من الإعدادات</div>}
        </div>
      </Card>

      {(adding || editing) && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={draft.employee_id} onValueChange={(v) => setDraft({ ...draft, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="الموظف *" /></SelectTrigger>
              <SelectContent>{emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={draft.work_date} onChange={(e) => setDraft({ ...draft, work_date: e.target.value })} />
            <Input type="datetime-local" placeholder="الحضور" value={draft.check_in} onChange={(e) => setDraft({ ...draft, check_in: e.target.value })} />
            <Input type="datetime-local" placeholder="الانصراف" value={draft.check_out} onChange={(e) => setDraft({ ...draft, check_out: e.target.value })} />
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="ملاحظات" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} size="sm"><Save className="w-4 h-4 ml-1" /> حفظ</Button>
            <Button onClick={cancel} variant="ghost" size="sm"><X className="w-4 h-4 ml-1" /> إلغاء</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground py-6">جاري التحميل...</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">لا توجد سجلات لهذا اليوم</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((a) => (
            <div key={a.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-2 hover:bg-accent/30 transition">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{a.employees?.full_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                  <span>الحالة: {STATUSES.find((s) => s.v === a.status)?.l ?? a.status}</span>
                  {a.check_in && <span>حضور: {fmtDate(a.check_in)}</span>}
                  {a.check_out && <span>انصراف: {fmtDate(a.check_out)}</span>}
                  {a.notes && <span>{a.notes}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {a.check_in && !a.check_out && (
                  <Button variant="outline" size="sm" onClick={() => checkOut(a.id)}>
                    <LogOut className="w-4 h-4 ml-1" /> انصراف
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => startEdit(a)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
