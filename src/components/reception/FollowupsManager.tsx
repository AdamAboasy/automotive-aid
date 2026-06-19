import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addMonths, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, PhoneCall, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate, toInputDateTime } from "@/lib/format";

interface Followup {
  id: string; client_id: string; followup_type: string;
  scheduled_at: string; done: boolean; notes: string | null;
  clients?: { name: string } | null;
}

const empty = { client_id: "", followup_type: "مكالمة", scheduled_at: "", notes: "", done: false };

export function FollowupsManager() {
  const [rows, setRows] = useState<Followup[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(empty);

  const generateAutomaticFollowups = async () => {
    // 1. Get all clients and their last work order date
    const { data: clientsData } = await supabase.from("clients").select("id, name");
    if (!clientsData) return;

    for (const client of clientsData) {
      // Find the latest completed work order for this client
      const { data: latestWO } = await supabase
        .from("work_orders")
        .select("updated_at")
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (latestWO && latestWO.length > 0) {
        const lastVisit = new Date(latestWO[0].updated_at);
        const nextFollowupDate = addMonths(lastVisit, 3);

        // Only generate if the 3 months have passed or are approaching
        if (isAfter(new Date(), nextFollowupDate)) {
          // Check if a followup already exists for this timeframe to avoid duplicates
          const { data: existing } = await supabase
            .from("client_followups")
            .select("id")
            .eq("client_id", client.id)
            .gte("scheduled_at", nextFollowupDate.toISOString().split('T')[0])
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from("client_followups").insert({
              client_id: client.id,
              followup_type: "متابعة دورية (3 شهور)",
              scheduled_at: nextFollowupDate.toISOString(),
              notes: "توليد تلقائي بناءً على آخر زيارة",
              done: false
            });
          }
        }
      }
    }
  };

  const load = async () => {
    setLoading(true);
    await generateAutomaticFollowups();
    const [f, cl] = await Promise.all([
      supabase.from("client_followups").select("*, clients(name)").order("scheduled_at", { ascending: true }),
      supabase.from("clients").select("id,name").order("name"),
    ]);
    if (f.error) toast.error(f.error.message);
    setRows((f.data as Followup[]) ?? []);
    setClients(cl.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.client_id) return toast.error("اختر العميل");
    if (!draft.scheduled_at) return toast.error("حدد التاريخ");
    if (!draft.followup_type.trim()) return toast.error("اكتب نوع المتابعة");
    const payload = {
      client_id: draft.client_id,
      followup_type: draft.followup_type.trim(),
      scheduled_at: new Date(draft.scheduled_at).toISOString(),
      notes: draft.notes.trim() || null,
      done: draft.done,
    };
    const op = editing
      ? supabase.from("client_followups").update(payload).eq("id", editing)
      : supabase.from("client_followups").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(editing ? "تم التحديث" : "تم إضافة المتابعة");
    setEditing(null); setAdding(false); setDraft(empty); load();
  };

  const toggleDone = async (id: string, done: boolean) => {
    const { error } = await supabase.from("client_followups").update({ done }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف المتابعة؟")) return;
    const { error } = await supabase.from("client_followups").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف"); load();
  };

  const startEdit = (f: Followup) => {
    setEditing(f.id); setAdding(false);
    setDraft({
      client_id: f.client_id, followup_type: f.followup_type,
      scheduled_at: toInputDateTime(f.scheduled_at),
      notes: f.notes ?? "", done: f.done,
    });
  };

  const cancel = () => { setEditing(null); setAdding(false); setDraft(empty); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">متابعة العملاء ({rows.length})</h2>
        {!adding && !editing && (
          <Button onClick={() => { setAdding(true); setDraft(empty); }} size="sm">
            <Plus className="w-4 h-4 ml-1" /> متابعة جديدة
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
            <Input placeholder="نوع المتابعة (مكالمة، زيارة...)" value={draft.followup_type} onChange={(e) => setDraft({ ...draft, followup_type: e.target.value })} />
            <Input type="datetime-local" value={draft.scheduled_at} onChange={(e) => setDraft({ ...draft, scheduled_at: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={draft.done} onCheckedChange={(v) => setDraft({ ...draft, done: !!v })} />
              تم التنفيذ
            </label>
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
        <div className="text-center text-muted-foreground py-6">لا توجد متابعات</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((f) => (
            <div key={f.id} className={`border border-border rounded-lg p-3 flex items-center justify-between gap-2 hover:bg-accent/30 transition ${f.done ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Checkbox checked={f.done} onCheckedChange={(v) => toggleDone(f.id, !!v)} />
                <PhoneCall className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className={`font-medium ${f.done ? "line-through" : ""}`}>
                    {f.followup_type} — {f.clients?.name ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {fmtDate(f.scheduled_at)}
                    {f.notes && <span className="mr-2">· {f.notes}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {f.done && <Check className="w-4 h-4 text-success" />}
                <Button variant="ghost" size="icon" onClick={() => startEdit(f)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(f.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
