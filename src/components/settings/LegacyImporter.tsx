import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileJson } from "lucide-react";

type Report = { table: string; inserted: number; skipped: number; error?: string };

export function LegacyImporter() {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report[]>([]);

  const readFromLocalStorage = () => {
    const keys = ["clients", "cars", "bookings", "complaints", "warehouses", "workshops", "employees", "brands", "banks", "bodyTypes"];
    const dump: Record<string, any> = {};
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) { try { dump[k] = JSON.parse(v); } catch { /* skip */ } }
    }
    if (Object.keys(dump).length === 0) return toast.error("لا توجد بيانات في الذاكرة المحلية لهذا المتصفح");
    setRaw(JSON.stringify(dump, null, 2));
    toast.success(`تم تحميل ${Object.keys(dump).length} جدول من الذاكرة`);
  };

  const onFile = async (f: File) => {
    const t = await f.text();
    setRaw(t);
    toast.success("تم تحميل الملف");
  };

  const importNow = async () => {
    let data: any;
    try { data = JSON.parse(raw); } catch { return toast.error("JSON غير صالح"); }
    setBusy(true); setReport([]);
    const out: Report[] = [];

    const tryInsert = async (table: string, rows: any[]) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      const cleaned = rows.map((r) => { const { id, ...rest } = r; return rest; });
      const { error, count } = await supabase.from(table as any).insert(cleaned, { count: "exact" });
      out.push({ table, inserted: count ?? (error ? 0 : cleaned.length), skipped: error ? cleaned.length : 0, error: error?.message });
    };

    // Map common legacy keys → tables (best-effort, ignore unknown fields)
    if (data.clients) await tryInsert("clients", data.clients.map((c: any) => ({
      full_name: c.name ?? c.full_name, phone: c.phone, email: c.email, address: c.address, notes: c.notes,
    })));
    if (data.warehouses) await tryInsert("warehouses", data.warehouses.map((w: any) => ({ name: w.name ?? w, location: w.location })));
    if (data.workshops) await tryInsert("workshops", data.workshops.map((w: any) => ({ name: w.name ?? w, location: w.location })));
    if (data.banks) await tryInsert("banks", data.banks.map((b: any) => ({ name: typeof b === "string" ? b : b.name })));
    if (data.bodyTypes) await tryInsert("body_types", data.bodyTypes.map((b: any) => ({ name: typeof b === "string" ? b : b.name })));
    if (data.employees) await tryInsert("employees", data.employees.map((e: any) => ({
      full_name: e.name ?? e.full_name, phone: e.phone, position: e.position ?? e.role, salary: e.salary,
    })));

    setReport(out); setBusy(false);
    const ok = out.reduce((s, r) => s + r.inserted, 0);
    toast.success(`تم استيراد ${ok} سجل`);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/15 text-primary p-3 rounded-xl"><Upload className="w-6 h-6" /></div>
        <div>
          <h2 className="text-lg font-bold">استيراد بيانات قديمة</h2>
          <p className="text-sm text-muted-foreground">من الذاكرة المحلية للمتصفح (النسخة القديمة) أو من ملف JSON.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={readFromLocalStorage} variant="outline" size="sm">
          <FileJson className="w-4 h-4 ml-1" /> تحميل من الذاكرة المحلية
        </Button>
        <label className="inline-flex">
          <input type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <Button asChild variant="outline" size="sm"><span><Upload className="w-4 h-4 ml-1" /> رفع ملف JSON</span></Button>
        </label>
      </div>

      <Textarea rows={10} dir="ltr" placeholder='{"clients":[...], "employees":[...]}'
        value={raw} onChange={(e) => setRaw(e.target.value)} className="font-mono text-xs" />

      <Button onClick={importNow} disabled={busy || !raw.trim()}>
        {busy ? "جاري الاستيراد..." : "بدء الاستيراد"}
      </Button>

      {report.length > 0 && (
        <div className="text-xs space-y-1 border border-border rounded-lg p-3">
          {report.map((r) => (
            <div key={r.table} className="flex justify-between">
              <span>{r.table}</span>
              <span className={r.error ? "text-destructive" : "text-emerald-500"}>
                {r.inserted} مضاف{r.error ? ` — ${r.error}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
