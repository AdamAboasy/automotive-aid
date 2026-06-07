import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, Car as CarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Car {
  id: string;
  client_id: string;
  brand_id: string | null;
  model_id: string | null;
  engine_id: string | null;
  body_type_id: string | null;
  year: number | null;
  color: string | null;
  vin: string | null;
  plate_number: string | null;
  mileage: number | null;
  notes: string | null;
  clients?: { name: string } | null;
  brands?: { name: string } | null;
  models?: { name: string } | null;
}

interface Ref { id: string; name: string; brand_id?: string; model_id?: string }

const empty = { client_id: "", brand_id: "", model_id: "", engine_id: "", body_type_id: "", year: "", color: "", vin: "", plate_number: "", mileage: "", notes: "" };

export function CarsManager() {
  const [rows, setRows] = useState<Car[]>([]);
  const [clients, setClients] = useState<Ref[]>([]);
  const [brands, setBrands] = useState<Ref[]>([]);
  const [models, setModels] = useState<Ref[]>([]);
  const [engines, setEngines] = useState<Ref[]>([]);
  const [bodyTypes, setBodyTypes] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(empty);

  const load = async () => {
    setLoading(true);
    const [c, cl, br, mo, en, bt] = await Promise.all([
      supabase.from("cars").select("*, clients(name), brands(name), models(name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id,name").order("name"),
      supabase.from("brands").select("id,name").order("name"),
      supabase.from("models").select("id,name,brand_id"),
      supabase.from("engines").select("id,name,model_id"),
      supabase.from("body_types").select("id,name").order("name"),
    ]);
    if (c.error) toast.error(c.error.message);
    setRows((c.data as Car[]) ?? []);
    setClients(cl.data ?? []);
    setBrands(br.data ?? []);
    setModels(mo.data ?? []);
    setEngines(en.data ?? []);
    setBodyTypes(bt.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.client_id) return toast.error("اختر العميل");
    const payload = {
      client_id: draft.client_id,
      brand_id: draft.brand_id || null,
      model_id: draft.model_id || null,
      engine_id: draft.engine_id || null,
      body_type_id: draft.body_type_id || null,
      year: draft.year ? Number(draft.year) : null,
      color: draft.color.trim() || null,
      vin: draft.vin.trim() || null,
      plate_number: draft.plate_number.trim() || null,
      mileage: draft.mileage ? Number(draft.mileage) : null,
      notes: draft.notes.trim() || null,
    };
    const op = editing
      ? supabase.from("cars").update(payload).eq("id", editing)
      : supabase.from("cars").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "تم التحديث" : "تمت الإضافة");
    setEditing(null); setAdding(false); setDraft(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("هل تريد حذف السيارة؟")) return;
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  const startEdit = (c: Car) => {
    setEditing(c.id); setAdding(false);
    setDraft({
      client_id: c.client_id,
      brand_id: c.brand_id ?? "",
      model_id: c.model_id ?? "",
      engine_id: c.engine_id ?? "",
      body_type_id: c.body_type_id ?? "",
      year: c.year?.toString() ?? "",
      color: c.color ?? "",
      vin: c.vin ?? "",
      plate_number: c.plate_number ?? "",
      mileage: c.mileage?.toString() ?? "",
      notes: c.notes ?? "",
    });
  };

  const cancel = () => { setEditing(null); setAdding(false); setDraft(empty); };

  const filteredModels = models.filter((m) => !draft.brand_id || m.brand_id === draft.brand_id);
  const filteredEngines = engines.filter((e) => !draft.model_id || e.model_id === draft.model_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">السيارات ({rows.length})</h2>
        {!adding && !editing && (
          <Button onClick={() => { setAdding(true); setDraft(empty); }} size="sm">
            <Plus className="w-4 h-4 ml-1" /> سيارة جديدة
          </Button>
        )}
      </div>

      {(adding || editing) && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={draft.client_id} onValueChange={(v) => setDraft({ ...draft, client_id: v })}>
              <SelectTrigger><SelectValue placeholder="العميل *" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
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
            <Select value={draft.body_type_id} onValueChange={(v) => setDraft({ ...draft, body_type_id: v })}>
              <SelectTrigger><SelectValue placeholder="نوع الهيكل" /></SelectTrigger>
              <SelectContent>{bodyTypes.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="سنة الصنع" value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
            <Input placeholder="اللون" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
            <Input placeholder="رقم اللوحة" value={draft.plate_number} onChange={(e) => setDraft({ ...draft, plate_number: e.target.value })} />
            <Input placeholder="رقم الشاسيه (VIN)" value={draft.vin} onChange={(e) => setDraft({ ...draft, vin: e.target.value })} />
            <Input type="number" placeholder="الممشى (كم)" value={draft.mileage} onChange={(e) => setDraft({ ...draft, mileage: e.target.value })} />
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
        <div className="text-center text-muted-foreground py-6">لا توجد سيارات</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((c) => (
            <div key={c.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-2 hover:bg-accent/30 transition">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <CarIcon className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {c.brands?.name ?? "—"} {c.models?.name ?? ""} {c.year ? `(${c.year})` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                    <span>المالك: {c.clients?.name ?? "—"}</span>
                    {c.plate_number && <span>لوحة: {c.plate_number}</span>}
                    {c.color && <span>اللون: {c.color}</span>}
                    {c.mileage != null && <span>{c.mileage.toLocaleString()} كم</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
