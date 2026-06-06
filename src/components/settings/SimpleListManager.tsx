import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

type TableName = "banks" | "body_types" | "brands" | "warehouses" | "workshops";

interface Row {
  id: string;
  name: string;
  location?: string | null;
}

interface Props {
  table: TableName;
  label: string;
  withLocation?: boolean;
}

export function SimpleListManager({ table, label, withLocation }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*").order("name");
    if (error) toast.error(error.message);
    setRows(((data as unknown) as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [table]);

  const add = async () => {
    if (!name.trim()) return;
    const payload: Record<string, unknown> = { name: name.trim() };
    if (withLocation) payload.location = location.trim() || null;
    const { error } = await supabase.from(table).insert(payload as never);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تمت الإضافة");
    setName("");
    setLocation("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(`حذف هذا ${label}؟`)) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم الحذف");
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder={`اسم ${label}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-40"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        {withLocation && (
          <Input
            placeholder="الموقع (اختياري)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 min-w-40"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        )}
        <Button onClick={add} disabled={!name.trim()}>
          <Plus className="w-4 h-4 ml-1" /> إضافة
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-4">جاري التحميل...</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-4 text-sm">لا توجد بيانات</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between border border-border rounded-md px-3 py-2 bg-card/50"
            >
              <div>
                <div className="font-medium text-sm">{r.name}</div>
                {withLocation && r.location && (
                  <div className="text-xs text-muted-foreground">{r.location}</div>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(r.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
