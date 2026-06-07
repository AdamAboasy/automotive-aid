import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate } from "@/lib/format";

const STATUSES = [
  { v: "open", l: "مفتوحة" },
  { v: "in_review", l: "قيد المراجعة" },
  { v: "resolved", l: "تم الحل" },
  { v: "closed", l: "مغلقة" },
] as const;

const PRIORITIES = [
  { v: "low", l: "منخفضة" },
  { v: "medium", l: "متوسطة" },
  { v: "high", l: "عالية" },
  { v: "urgent", l: "عاجلة" },
] as const;

const PRIO_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/15 text-primary",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

interface Complaint {
  id: string; client_id: string; car_id: string | null;
  subject: string; description: string | null;
  status: string; priority: string; created_at: string;
  clients?: { name: string } | null;
  cars?: { plate_number: string | null } | null;
}

const empty = { client_id: "", car_id: "", subject: "", description: "", status: "open", priority: "medium" };

export function ComplaintsManager() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(empty);

  const load = async () => {
    setLoading(true);
    const [c, cl, ca] = await Promise.all([
      supabase.from("complaints").select("*, clients(name), cars(plate_number)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id,name").order("name"),
      supabase.from("cars").select("id, client_id, plate_number, brands(name), models(name)"),
    ]);
    if (c.error) toast.error(c.error.message);
    setRows((c.data as Complaint[]) ?? []);
    setClients(cl.data ?? []);
    setCars(ca.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.client_id) return toast.error("اختر العميل");
    if (!draft.subject.trim()) return toast.error("اكتب موضوع الشكوى");
    const payload = {
      client_id: draft.client_id,
      car_id: draft.car_id || null,
      subject: draft.subject.trim(),
      description: draft.description.trim() || null,
      status: draft.status as any,
      priority: draft.priority as any,
    };
    const op = editing
      ? supabase.from("complaints").update(payload).eq("id", editing)
      : supabase.from("complaints").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "تم التحديث" : "تم تسجيل الشكوى");
    setEditing(null); setAdding(false); setDraft(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الشكوى؟")) return;
    const { error } = await supabase.from("complaints").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  const startEdit = (c: Complaint) => {
    setEditing(c.id); setAdding(false);
    setDraft({
      client_id: c.client_id, car_id: c.car_id ?? "",
      subject: c.subject, description: c.description ?? "",
      status: c.status, priority: c.priority,
    });
  };

  const cancel = () => { setEditing(null); setAdding(false); setDraft(empty); };

  const clientCars = cars.filter((c) => !draft.client_id || c.client_id === draft.client_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">الشكاوى ({rows.length})</h2>
        {!adding && !editing && (
          <Button onClick={() => { setAdding(true); setDraft(empty); }} size="sm">
            <Plus className="w-4 h-4 ml-1" /> شكوى جديدة
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
              <SelectTrigger><SelectValue placeholder="السيارة (اختياري)" /></SelectTrigger>
              <SelectContent>
                {clientCars.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.brands?.name ?? ""} {c.models?.name ?? ""} {c.plate_number ? `- ${c.plate_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={draft.priority} onValueChange={(v) => setDraft({ ...draft, priority: v })}>
              <SelectTrigger><SelectValue placeholder="الأولوية" /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="موضوع الشكوى *" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
          <Textarea placeholder="التفاصيل" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={3} />
          <div className="flex gap-2">
            <Button onClick={save} size="sm"><Save className="w-4 h-4 ml-1" /> حفظ</Button>
            <Button onClick={cancel} variant="ghost" size="sm"><X className="w-4 h-4 ml-1" /> إلغاء</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground py-6">جاري التحميل...</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">لا توجد شكاوى</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((c) => (
            <div key={c.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-2 hover:bg-accent/30 transition">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{c.subject}</div>
                  {c.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</div>}
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                    <span>{c.clients?.name ?? "—"}</span>
                    {c.cars?.plate_number && <span>لوحة: {c.cars.plate_number}</span>}
                    <span>{fmtDate(c.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded-md ${PRIO_COLORS[c.priority] ?? ""}`}>
                    {PRIORITIES.find((p) => p.v === c.priority)?.l}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                    {STATUSES.find((s) => s.v === c.status)?.l}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
