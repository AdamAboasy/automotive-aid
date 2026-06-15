import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, Calendar, Wrench } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate, toInputDateTime } from "@/lib/format";

const STATUSES = [
  { v: "pending", l: "قيد الانتظار" },
  { v: "confirmed", l: "مؤكد" },
  { v: "in_progress", l: "قيد التنفيذ" },
  { v: "completed", l: "مكتمل" },
  { v: "cancelled", l: "ملغي" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-primary/15 text-primary",
  in_progress: "bg-accent text-accent-foreground",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

interface Booking {
  id: string; client_id: string; car_id: string | null; workshop_id: string | null;
  scheduled_at: string; service_type: string | null; status: string; notes: string | null;
  clients?: { name: string } | null;
  cars?: { plate_number: string | null; brands?: { name: string } | null; models?: { name: string } | null } | null;
  workshops?: { name: string } | null;
}

interface Ref { id: string; name?: string; client_id?: string; plate_number?: string | null }

const empty = { client_id: "", car_id: "", workshop_id: "", scheduled_at: "", service_type: "", status: "pending", notes: "" };

export function BookingsManager() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Ref[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(empty);
  const [filterDate, setFilterDate] = useState<string>("");

  const load = async () => {
    setLoading(true);
    let query = supabase.from("maintenance_bookings")
      .select("*, clients(name), cars(plate_number, brands(name), models(name)), workshops(name), work_orders(status, profiles(full_name))")
      .order("scheduled_at", { ascending: false });
    
    if (filterDate) {
      query = query.gte("scheduled_at", `${filterDate}T00:00:00`).lt("scheduled_at", `${filterDate}T23:59:59`);
    }

    const [b, cl, ca, ws] = await Promise.all([
      query,
      supabase.from("clients").select("id,name").order("name"),
      supabase.from("cars").select("id, client_id, plate_number, brands(name), models(name)"),
      supabase.from("workshops").select("id,name").order("name"),
    ]);
    if (b.error) toast.error(b.error.message);
    setRows((b.data as any[]) ?? []);
    setClients(cl.data ?? []);
    setCars(ca.data ?? []);
    setWorkshops(ws.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.client_id) return toast.error("اختر العميل");
    if (!draft.scheduled_at) return toast.error("اختر موعد الحجز");
    const payload = {
      client_id: draft.client_id,
      car_id: draft.car_id || null,
      workshop_id: draft.workshop_id || null,
      scheduled_at: new Date(draft.scheduled_at).toISOString(),
      service_type: draft.service_type.trim() || null,
      status: draft.status as any,
      notes: draft.notes.trim() || null,
    };
    const op = editing
      ? supabase.from("maintenance_bookings").update(payload).eq("id", editing)
      : supabase.from("maintenance_bookings").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "تم التحديث" : "تم الحجز");
    setEditing(null); setAdding(false); setDraft(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الحجز؟")) return;
    const { error } = await supabase.from("maintenance_bookings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  const startEdit = (b: Booking) => {
    setEditing(b.id); setAdding(false);
    setDraft({
      client_id: b.client_id,
      car_id: b.car_id ?? "",
      workshop_id: b.workshop_id ?? "",
      scheduled_at: toInputDateTime(b.scheduled_at),
      service_type: b.service_type ?? "",
      status: b.status,
      notes: b.notes ?? "",
    });
  };

  const cancel = () => { setEditing(null); setAdding(false); setDraft(empty); };

  const createWorkOrder = async (b: Booking) => {
    const { data: existing } = await supabase.from("work_orders").select("id").eq("booking_id", b.id).maybeSingle();
    if (existing) return toast.info("أمر الشغل موجود بالفعل لهذا الحجز");
    
    // Create actual work order record
    const { error: woError } = await supabase.from("work_orders").insert({
      booking_id: b.id,
      client_id: b.client_id,
      car_id: b.car_id,
      workshop_id: b.workshop_id,
      status: "open",
      description: b.service_type || "من حجز صيانة",
    });

    if (woError) return toast.error(woError.message);

    const { error } = await supabase.from("maintenance_bookings").update({ status: "confirmed" }).eq("id", b.id);
    if (error) return toast.error(error.message);
    
    toast.success("تم إنشاء أمر شغل فعلي وتنبيه مدير الورشة");
    load();
  };

  const clientCars = cars.filter((c) => !draft.client_id || c.client_id === draft.client_id);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">حجوزات الصيانة ({rows.length})</h2>
          <Input 
            type="date" 
            value={filterDate} 
            onChange={(e) => { setFilterDate(e.target.value); }} 
            className="w-40 h-9"
            title="تحديد التاريخ من الكالندر"
          />
          <Button onClick={() => load()} size="sm" variant="outline">بحث</Button>
        </div>
        {!adding && !editing && (
          <Button onClick={() => { setAdding(true); setDraft(empty); }} size="sm">
            <Plus className="w-4 h-4 ml-1" /> حجز جديد
          </Button>
        )}
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
            <Input type="datetime-local" value={draft.scheduled_at} onChange={(e) => setDraft({ ...draft, scheduled_at: e.target.value })} />
            <Input placeholder="نوع الخدمة (مثلاً: صيانة دورية)" value={draft.service_type} onChange={(e) => setDraft({ ...draft, service_type: e.target.value })} />
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Textarea placeholder="ملاحظات" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button onClick={save} size="sm"><Save className="w-4 h-4 ml-1" /> حفظ</Button>
            <Button onClick={cancel} variant="ghost" size="sm"><X className="w-4 h-4 ml-1" /> إلغاء</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground py-6">جاري التحميل...</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">لا توجد حجوزات</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((b) => (
            <div key={b.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-2 hover:bg-accent/30 transition">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {b.clients?.name ?? "—"}
                    {b.cars && <span className="text-muted-foreground"> · {b.cars.brands?.name ?? ""} {b.cars.models?.name ?? ""} {b.cars.plate_number ? `(${b.cars.plate_number})` : ""}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                    <span>{fmtDate(b.scheduled_at)}</span>
                    {b.service_type && <span>{b.service_type}</span>}
                    {b.workshops?.name && <span>ورشة: {b.workshops.name}</span>}
                    {(b as any).work_orders?.[0]?.profiles?.full_name && (
                      <span className="text-primary font-medium">المهندس: {(b as any).work_orders[0].profiles.full_name}</span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md shrink-0 ${STATUS_COLORS[b.status] ?? ""}`}>
                {STATUSES.find((s) => s.v === b.status)?.l ?? b.status}
              </span>
              <div className="flex gap-1 shrink-0">
                {b.status !== "confirmed" && b.status !== "completed" && b.status !== "cancelled" && (
                  <Button variant="outline" size="sm" onClick={() => createWorkOrder(b)} title="إنشاء أمر شغل">
                    <Wrench className="w-4 h-4 ml-1" /> أمر شغل
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => startEdit(b)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
