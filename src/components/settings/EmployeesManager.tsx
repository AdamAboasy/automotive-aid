import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Employee {
  id: string;
  full_name: string;
  job_title: string | null;
  phone: string | null;
  salary: number | null;
  hire_date: string | null;
  workshop_id: string | null;
  is_active: boolean;
  shift_start?: string | null;
}

interface Workshop { id: string; name: string }

const empty = {
  full_name: "",
  job_title: "",
  phone: "",
  salary: "",
  hire_date: "",
  workshop_id: "",
  shift_start: "09:00",
};

export function EmployeesManager() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    const [e, w] = await Promise.all([
      supabase.from("employees").select("*").order("full_name"),
      supabase.from("workshops").select("id, name").order("name"),
    ]);
    if (e.error || w.error) toast.error("تعذّر التحميل");
    setRows(e.data ?? []);
    setWorkshops(w.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.full_name.trim()) return;
    const payload: any = {
      full_name: form.full_name.trim(),
      job_title: form.job_title.trim() || null,
      phone: form.phone.trim() || null,
      salary: form.salary ? Number(form.salary) : null,
      hire_date: form.hire_date || null,
      workshop_id: form.workshop_id || null,
      shift_start: form.shift_start || null,
    };
    const { error } = await supabase.from("employees").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تمت إضافة الموظف");
    setForm(empty);
    load();
  };

  const toggleActive = async (e: Employee) => {
    const { error } = await supabase.from("employees").update({ is_active: !e.is_active }).eq("id", e.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الموظف؟")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-md p-3 bg-card/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <Input placeholder="الاسم بالكامل *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input placeholder="الوظيفة" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
        <Input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="الراتب" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
        <Input placeholder="تاريخ التعيين" type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
        <Input placeholder="موعد الوردية (مثلاً 09:00)" type="time" value={form.shift_start} onChange={(e) => setForm({ ...form, shift_start: e.target.value })} />
        <Select value={form.workshop_id} onValueChange={(v) => setForm({ ...form, workshop_id: v })}>
          <SelectTrigger><SelectValue placeholder="الورشة" /></SelectTrigger>
          <SelectContent>
            {workshops.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <div className="md:col-span-2 lg:col-span-3">
          <Button onClick={add} disabled={!form.full_name.trim()} className="w-full md:w-auto">
            <Plus className="w-4 h-4 ml-1" /> إضافة موظف
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-4">جاري التحميل...</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-4 text-sm">لا يوجد موظفون</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((e) => {
            const ws = workshops.find((w) => w.id === e.workshop_id);
            return (
              <div key={e.id} className="flex items-center justify-between border border-border rounded-md px-3 py-2 bg-card/50">
                <div className="space-y-0.5">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {e.full_name}
                    {!e.is_active && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">غير نشط</span>}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                    {e.job_title && <span>{e.job_title}</span>}
                    {e.phone && <span dir="ltr">{e.phone}</span>}
                    {ws && <span>الورشة: {ws.name}</span>}
                    {e.salary != null && <span>الراتب: {e.salary}</span>}
                    {e.shift_start && <span>الوردية: {e.shift_start}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(e)}>
                    {e.is_active ? "إيقاف" : "تنشيط"}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
