import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, Search, Phone, IdCard } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  national_id: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

const empty = { name: "", phone: "", national_id: "", address: "", notes: "" };

export function ClientsManager() {
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(empty);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.name.trim()) return toast.error("اسم العميل مطلوب");
    const payload = {
      name: draft.name.trim(),
      phone: draft.phone.trim() || null,
      national_id: draft.national_id.trim() || null,
      address: draft.address.trim() || null,
      notes: draft.notes.trim() || null,
    };
    if (editing) {
      const { error } = await supabase.from("clients").update(payload).eq("id", editing);
      if (error) return toast.error(error.message);
      toast.success("تم التحديث");
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("تمت إضافة العميل");
    }
    setEditing(null);
    setAdding(false);
    setDraft(empty);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("هل تريد حذف هذا العميل وكل سياراته وحجوزاته؟")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  const startEdit = (c: Client) => {
    setEditing(c.id);
    setAdding(false);
    setDraft({
      name: c.name,
      phone: c.phone ?? "",
      national_id: c.national_id ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
    });
  };

  const cancel = () => { setEditing(null); setAdding(false); setDraft(empty); };

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.phone ?? "").includes(q) ||
      (r.national_id ?? "").includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
        <h2 className="text-lg font-bold">العملاء ({rows.length})</h2>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الهاتف أو الرقم القومي"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8 w-full md:w-72"
            />
          </div>
          {!adding && !editing && (
            <Button onClick={() => { setAdding(true); setDraft(empty); }} size="sm">
              <Plus className="w-4 h-4 ml-1" /> عميل جديد
            </Button>
          )}
        </div>
      </div>

      {(adding || editing) && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="الاسم *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input placeholder="رقم الهاتف" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            <Input placeholder="الرقم القومي" value={draft.national_id} onChange={(e) => setDraft({ ...draft, national_id: e.target.value })} />
            <Input placeholder="العنوان" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
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
        <div className="text-center text-muted-foreground py-6">لا يوجد عملاء</div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((c) => (
            <div key={c.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-2 hover:bg-accent/30 transition">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                  {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                  {c.national_id && <span className="flex items-center gap-1"><IdCard className="w-3 h-3" /> {c.national_id}</span>}
                  {c.address && <span className="truncate">{c.address}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(c)} title="تعديل"><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(c.id)} title="حذف"><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
