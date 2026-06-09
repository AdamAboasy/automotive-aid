import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, Wrench, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Part {
  id: string;
  workshop_id: string | null;
  name: string;
  part_code: string | null;
  unit: string;
  quantity: number;
  min_quantity: number;
  purchase_price: number | null;
  selling_price: number | null;
  notes: string | null;
  workshops?: { name: string } | null;
}

const UNITS = ["قطعة", "علبة", "لتر", "كجم", "متر", "طقم"];

const empty = {
  workshop_id: "",
  name: "",
  part_code: "",
  unit: "قطعة",
  quantity: "0",
  min_quantity: "0",
  purchase_price: "",
  selling_price: "",
  notes: "",
};

export function SparePartsManager() {
  const [rows, setRows] = useState<Part[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(empty);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [p, w] = await Promise.all([
      supabase.from("spare_parts" as any).select("*, workshops(name)").order("name"),
      supabase.from("workshops").select("id,name").order("name"),
    ]);
    if (p.error) toast.error(p.error.message);
    setRows(((p.data as any) ?? []) as Part[]);
    setWorkshops(w.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.name.trim()) return toast.error("اكتب اسم القطعة");
    const payload = {
      workshop_id: draft.workshop_id || null,
      name: draft.name.trim(),
      part_code: draft.part_code.trim() || null,
      unit: draft.unit,
      quantity: Number(draft.quantity) || 0,
      min_quantity: Number(draft.min_quantity) || 0,
      purchase_price: draft.purchase_price ? Number(draft.purchase_price) : null,
      selling_price: draft.selling_price ? Number(draft.selling_price) : null,
      notes: draft.notes.trim() || null,
    };
    const op = editing
      ? supabase.from("spare_parts" as any).update(payload).eq("id", editing)
      : supabase.from("spare_parts" as any).insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "تم التحديث" : "تمت الإضافة");
    setEditing(null); setAdding(false); setDraft(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف القطعة؟")) return;
    const { error } = await supabase.from("spare_parts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  const startEdit = (p: Part) => {
    setEditing(p.id); setAdding(false);
    setDraft({
      workshop_id: p.workshop_id ?? "",
      name: p.name,
      part_code: p.part_code ?? "",
      unit: p.unit,
      quantity: String(p.quantity ?? 0),
      min_quantity: String(p.min_quantity ?? 0),
      purchase_price: p.purchase_price?.toString() ?? "",
      selling_price: p.selling_price?.toString() ?? "",
      notes: p.notes ?? "",
    });
  };

  const cancel = () => { setEditing(null); setAdding(false); setDraft(empty); };

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || (r.part_code ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold">مخزون قطع الغيار ({rows.length})</h2>
        <div className="flex gap-2">
          <Input placeholder="بحث بالاسم أو الكود..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          {!adding && !editing && (
            <Button onClick={() => { setAdding(true); setDraft(empty); }} size="sm">
              <Plus className="w-4 h-4 ml-1" /> إضافة قطعة
            </Button>
          )}
        </div>
      </div>

      {(adding || editing) && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="اسم القطعة *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input placeholder="كود القطعة" value={draft.part_code} onChange={(e) => setDraft({ ...draft, part_code: e.target.value })} />
            <Select value={draft.workshop_id} onValueChange={(v) => setDraft({ ...draft, workshop_id: v })}>
              <SelectTrigger><SelectValue placeholder="الورشة" /></SelectTrigger>
              <SelectContent>{workshops.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.unit} onValueChange={(v) => setDraft({ ...draft, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" step="any" placeholder="الكمية الحالية" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
            <Input type="number" step="any" placeholder="حد التنبيه (أدنى كمية)" value={draft.min_quantity} onChange={(e) => setDraft({ ...draft, min_quantity: e.target.value })} />
            <Input type="number" step="any" placeholder="سعر الشراء" value={draft.purchase_price} onChange={(e) => setDraft({ ...draft, purchase_price: e.target.value })} />
            <Input type="number" step="any" placeholder="سعر البيع" value={draft.selling_price} onChange={(e) => setDraft({ ...draft, selling_price: e.target.value })} />
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
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">لا توجد قطع غيار</div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((p) => {
            const low = Number(p.quantity) <= Number(p.min_quantity);
            return (
              <div key={p.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-2 hover:bg-accent/30 transition">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Wrench className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate flex items-center gap-2">
                      {p.name}
                      {p.part_code && <span className="text-xs text-muted-foreground font-mono">[{p.part_code}]</span>}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                      {p.workshops?.name && <span>ورشة: {p.workshops.name}</span>}
                      {p.selling_price != null && <span>بيع: {Number(p.selling_price).toLocaleString()} ج.م</span>}
                      {p.purchase_price != null && <span>شراء: {Number(p.purchase_price).toLocaleString()} ج.م</span>}
                    </div>
                  </div>
                </div>
                <div className={`text-sm px-3 py-1 rounded-md shrink-0 flex items-center gap-1 ${low ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
                  {low && <AlertTriangle className="w-3.5 h-3.5" />}
                  {Number(p.quantity).toLocaleString()} {p.unit}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
