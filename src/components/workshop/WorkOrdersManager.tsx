import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, Wrench, Search } from "lucide-react";
import { fmtDate } from "@/lib/format";

const STATUSES = [
  { v: "open", l: "مفتوح" },
  { v: "in_progress", l: "قيد التنفيذ" },
  { v: "on_hold", l: "معلق" },
  { v: "completed", l: "مكتمل" },
  { v: "cancelled", l: "ملغي" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  open: "bg-warning/15 text-warning",
  in_progress: "bg-primary/15 text-primary",
  on_hold: "bg-muted text-muted-foreground",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

interface WO {
  id: string; client_id: string; car_id: string | null; workshop_id: string | null;
  technician_id: string | null; description: string | null; diagnosis: string | null;
  status: string; total_cost: number | null; notes: string | null; created_at: string;
  clients?: { name: string } | null;
  cars?: { plate_number: string | null; brands?: { name: string } | null; models?: { name: string } | null } | null;
  workshops?: { name: string } | null;
  employees?: { full_name: string } | null;
}

const empty = {
  client_id: "", car_id: "", workshop_id: "", technician_id: "",
  description: "", diagnosis: "", status: "open", total_cost: "", notes: "",
};

export function WorkOrdersManager() {
  const [rows, setRows] = useState<WO[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(empty);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [w, cl, ca, ws, em] = await Promise.all([
      supabase.from("work_orders")
        .select("*, clients(name), cars(plate_number, brands(name), models(name)), workshops(name), employees(full_name)")
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id,name").order("name"),
      supabase.from("cars").select("id, client_id, plate_number, brands(name), models(name)"),
      supabase.from("workshops").select("id,name").order("name"),
      supabase.from("employees").select("id,full_name").order("full_name"),
    ]);
    if (w.error) toast.error(w.error.message);
    const data = (w.data as WO[]) ?? [];
    setRows(data);
    
    // Alert for unassigned work orders (for workshop manager)
    const unassigned = data.filter(r => r.status === "open" && !r.technician_id);
    if (unassigned.length > 0) {
      toast.info(`يوجد ${unassigned.length} أمر شغل جديد بانتظار تعيين فني/مهندس`, {
        duration: 5000,
      });
    }

    setClients(cl.data ?? []); setCars(ca.data ?? []);
    setWorkshops(ws.data ?? []); setTechs(em.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.client_id) return toast.error("اختر العميل");
    const payload: any = {
      client_id: draft.client_id,
      car_id: draft.car_id || null,
      workshop_id: draft.workshop_id || null,
      technician_id: draft.technician_id || null,
      description: draft.description.trim() || null,
      diagnosis: draft.diagnosis.trim() || null,
      status: draft.status,
      total_cost: draft.total_cost ? Number(draft.total_cost) : null,
      notes: draft.notes.trim() || null,
    };
    if (draft.status === "in_progress") payload.started_at = new Date().toISOString();
    if (draft.status === "completed") payload.completed_at = new Date().toISOString();

    const op = editing
      ? supabase.from("work_orders").update(payload).eq("id", editing)
      : supabase.from("work_orders").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "تم التحديث" : "تم إنشاء الأمر");
    setAdding(false); setEditing(null); setDraft(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الأمر؟")) return;
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  const startEdit = (w: WO) => {
    setEditing(w.id); setAdding(false);
    setDraft({
      client_id: w.client_id,
      car_id: w.car_id ?? "",
      workshop_id: w.workshop_id ?? "",
      technician_id: w.technician_id ?? "",
      description: w.description ?? "",
      diagnosis: w.diagnosis ?? "",
      status: w.status,
      total_cost: w.total_cost?.toString() ?? "",
      notes: w.notes ?? "",
    });
  };

  const cancel = () => { setAdding(false); setEditing(null); setDraft(empty); };
  const clientCars = cars.filter((c) => !draft.client_id || c.client_id === draft.client_id);

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (r.clients?.name ?? "").toLowerCase().includes(q)
      || (r.description ?? "").toLowerCase().includes(q)
      || (r.cars?.plate_number ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
        <h2 className="text-lg font-bold">أوامر الشغل ({rows.length})</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-8 w-full md:w-56" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
            </SelectContent>
          </Select>
          {!adding && !editing && (
            <Button onClick={() => { setAdding(true); setDraft(empty); }} size="sm">
              <Plus className="w-4 h-4 ml-1" /> أمر جديد
            </Button>
          )}
        </div>
      </div>

      {(adding || editing) && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={draft.client_id} onValueChange={(v) => setDraft({ ...draft, client_id: v, car_id: "" })}>
              <SelectTrigger><SelectValue placeholder="العميل *" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.car_id} onValueChange={(v) => setDraft({ ...draft, car_id: v })} disabled={!draft.client_id}>
              <SelectTrigger><SelectValue placeholder="السيارة" /></SelectTrigger>
              <SelectContent>
                {clientCars.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.brands?.name ?? ""} {c.models?.name ?? ""} {c.plate_number ? `- ${c.plate_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={draft.workshop_id} onValueChange={(v) => setDraft({ ...draft, workshop_id: v })}>
              <SelectTrigger><SelectValue placeholder="الورشة" /></SelectTrigger>
              <SelectContent>{workshops.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.technician_id} onValueChange={(v) => setDraft({ ...draft, technician_id: v })}>
              <SelectTrigger><SelectValue placeholder="الفني المسؤول" /></SelectTrigger>
              <SelectContent>{techs.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" step="0.01" placeholder="التكلفة الإجمالية" value={draft.total_cost} onChange={(e) => setDraft({ ...draft, total_cost: e.target.value })} />
          </div>
          <Textarea placeholder="وصف العمل المطلوب" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} />
          <Textarea placeholder="التشخيص" value={draft.diagnosis} onChange={(e) => setDraft({ ...draft, diagnosis: e.target.value })} rows={2} />
          <Textarea placeholder="ملاحظات" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button onClick={save} size="sm"><Save className="w-4 h-4 ml-1" /> حفظ</Button>
            <Button onClick={cancel} variant="ghost" size="sm"><X className="w-4 h-4 ml-1" /> إلغاء</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground py-6">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">لا توجد أوامر</div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((w) => (
            <div key={w.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-2 hover:bg-accent/30 transition">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Wrench className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {w.clients?.name ?? "—"}
                    {w.cars && <span className="text-muted-foreground"> · {w.cars.brands?.name ?? ""} {w.cars.models?.name ?? ""} {w.cars.plate_number ? `(${w.cars.plate_number})` : ""}</span>}
                  </div>
                  {w.description && <div className="text-sm text-muted-foreground mt-1">{w.description}</div>}
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                    <span>{fmtDate(w.created_at)}</span>
                    {w.workshops?.name && <span>ورشة: {w.workshops.name}</span>}
                    {w.employees?.full_name && <span>فني: {w.employees.full_name}</span>}
                    {w.total_cost != null && <span>التكلفة: {w.total_cost}</span>}
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md shrink-0 ${STATUS_COLORS[w.status] ?? ""}`}>
                {STATUSES.find((s) => s.v === w.status)?.l ?? w.status}
              </span>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(w)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(w.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
