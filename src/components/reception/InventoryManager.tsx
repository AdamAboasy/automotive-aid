import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = [
  { v: "available", l: "متاح" },
  { v: "reserved", l: "محجوز" },
  { v: "sold", l: "مباع" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  available: "bg-success/15 text-success",
  reserved: "bg-warning/15 text-warning",
  sold: "bg-muted text-muted-foreground",
};

interface Item {
  id: string; warehouse_id: string | null; brand_id: string | null; model_id: string | null;
  engine_id: string | null; color: string | null; year: number | null; vin: string | null;
  price: number | null; status: string; notes: string | null;
  warehouses?: { name: string } | null;
  brands?: { name: string } | null;
  models?: { name: string } | null;
}

const empty = { warehouse_id: "", brand_id: "", model_id: "", engine_id: "", color: "", year: "", vin: "", price: "", status: "available", notes: "" };

export function InventoryManager() {
  const [rows, setRows] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(empty);

  const load = async () => {
    setLoading(true);
    const [i, w, b, m, e] = await Promise.all([
      supabase.from("inventory").select("*, warehouses(name), brands(name), models(name)").order("created_at", { ascending: false }),
      supabase.from("warehouses").select("id,name").order("name"),
      supabase.from("brands").select("id,name").order("name"),
      supabase.from("models").select("id,name,brand_id"),
      supabase.from("engines").select("id,name,model_id"),
    ]);
    if (i.error) toast.error(i.error.message);
    setRows((i.data as Item[]) ?? []);
    setWarehouses(w.data ?? []);
    setBrands(b.data ?? []);
    setModels(m.data ?? []);
    setEngines(e.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      warehouse_id: draft.warehouse_id || null,
      brand_id: draft.brand_id || null,
      model_id: draft.model_id || null,
      engine_id: draft.engine_id || null,
      color: draft.color.trim() || null,
      year: draft.year ? Number(draft.year) : null,
      vin: draft.vin.trim() || null,
      price: draft.price ? Number(draft.price) : null,
      status: draft.status as any,
      notes: draft.notes.trim() || null,
    };
    const op = editing
      ? supabase.from("inventory").update(payload).eq("id", editing)
      : supabase.from("inventory").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "تم التحديث" : "تمت الإضافة");
    setEditing(null); setAdding(false); setDraft(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الصنف؟")) return;
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  const startEdit = (i: Item) => {
    setEditing(i.id); setAdding(false);
    setDraft({
      warehouse_id: i.warehouse_id ?? "", brand_id: i.brand_id ?? "",
      model_id: i.model_id ?? "", engine_id: i.engine_id ?? "",
      color: i.color ?? "", year: i.year?.toString() ?? "",
      vin: i.vin ?? "", price: i.price?.toString() ?? "",
      status: i.status, notes: i.notes ?? "",
    });
  };

  const cancel = () => { setEditing(null); setAdding(false); setDraft(empty); };

  const filteredModels = models.filter((m) => !draft.brand_id || m.brand_id === draft.brand_id);
  const filteredEngines = engines.filter((e) => !draft.model_id || e.model_id === draft.model_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">المخزون ({rows.length})</h2>
        {!adding && !editing && (
          <Button onClick={() => { setAdding(true); setDraft(empty); }} size="sm">
            <Plus className="w-4 h-4 ml-1" /> إضافة سيارة للمخزون
          </Button>
        )}
      </div>

      {(adding || editing) && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={draft.warehouse_id} onValueChange={(v) => setDraft({ ...draft, warehouse_id: v })}>
              <SelectTrigger><SelectValue placeholder="المخزن" /></SelectTrigger>
              <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.brand_id} onValueChange={(v) => setDraft({ ...draft, brand_id: v, model_id: "", engine_id: "" })}>
              <SelectTrigger><SelectValue placeholder="الماركة" /></SelectTrigger>
              <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.model_id} onValueChange={(v) => setDraft({ ...draft, model_id: v, engine_id: "" })} disabled={!draft.brand_id}>
              <SelectTrigger><SelectValue placeholder="الموديل" /></SelectTrigger>
              <SelectContent>{filteredModels.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.engine_id} onValueChange={(v) => setDraft({ ...draft, engine_id: v })} disabled={!draft.model_id}>
              <SelectTrigger><SelectValue placeholder="المحرك" /></SelectTrigger>
              <SelectContent>{filteredEngines.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="اللون" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
            <Input type="number" placeholder="سنة الصنع" value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
            <Input placeholder="رقم الشاسيه" value={draft.vin} onChange={(e) => setDraft({ ...draft, vin: e.target.value })} />
            <Input type="number" placeholder="السعر" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
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
        <div className="text-center text-muted-foreground py-6">المخزون فارغ</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((i) => (
            <div key={i.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-2 hover:bg-accent/30 transition">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Package className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {i.brands?.name ?? "—"} {i.models?.name ?? ""} {i.year ? `(${i.year})` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                    {i.warehouses?.name && <span>مخزن: {i.warehouses.name}</span>}
                    {i.color && <span>اللون: {i.color}</span>}
                    {i.price != null && <span>{Number(i.price).toLocaleString()} ج.م</span>}
                    {i.vin && <span className="font-mono" dir="ltr">{i.vin}</span>}
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md shrink-0 ${STATUS_COLORS[i.status] ?? ""}`}>
                {STATUSES.find((s) => s.v === i.status)?.l}
              </span>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(i)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
