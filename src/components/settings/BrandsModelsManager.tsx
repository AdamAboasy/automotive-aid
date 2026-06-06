import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus, ChevronDown, ChevronLeft } from "lucide-react";

interface Brand { id: string; name: string }
interface Model { id: string; name: string; brand_id: string }
interface Engine { id: string; name: string; model_id: string }

export function BrandsModelsManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [engines, setEngines] = useState<Engine[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [newBrand, setNewBrand] = useState("");
  const [newModelName, setNewModelName] = useState<Record<string, string>>({});
  const [newEngineName, setNewEngineName] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [b, m, e] = await Promise.all([
      supabase.from("brands").select("id, name").order("name"),
      supabase.from("models").select("id, name, brand_id").order("name"),
      supabase.from("engines").select("id, name, model_id").order("name"),
    ]);
    if (b.error || m.error || e.error) toast.error("تعذّر تحميل البيانات");
    setBrands(b.data ?? []);
    setModels(m.data ?? []);
    setEngines(e.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addBrand = async () => {
    if (!newBrand.trim()) return;
    const { error } = await supabase.from("brands").insert({ name: newBrand.trim() });
    if (error) return toast.error(error.message);
    setNewBrand("");
    toast.success("تمت إضافة الماركة");
    load();
  };

  const delBrand = async (id: string) => {
    if (!confirm("حذف الماركة وكل موديلاتها ومحركاتها؟")) return;
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const addModel = async (brandId: string) => {
    const name = (newModelName[brandId] ?? "").trim();
    if (!name) return;
    const { error } = await supabase.from("models").insert({ brand_id: brandId, name });
    if (error) return toast.error(error.message);
    setNewModelName({ ...newModelName, [brandId]: "" });
    load();
  };

  const delModel = async (id: string) => {
    if (!confirm("حذف الموديل ومحركاته؟")) return;
    const { error } = await supabase.from("models").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const addEngine = async (modelId: string) => {
    const name = (newEngineName[modelId] ?? "").trim();
    if (!name) return;
    const { error } = await supabase.from("engines").insert({ model_id: modelId, name });
    if (error) return toast.error(error.message);
    setNewEngineName({ ...newEngineName, [modelId]: "" });
    load();
  };

  const delEngine = async (id: string) => {
    const { error } = await supabase.from("engines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  if (loading) return <div className="text-center text-muted-foreground py-4">جاري التحميل...</div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="اسم ماركة جديدة"
          value={newBrand}
          onChange={(e) => setNewBrand(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addBrand()}
        />
        <Button onClick={addBrand} disabled={!newBrand.trim()}>
          <Plus className="w-4 h-4 ml-1" /> ماركة
        </Button>
      </div>

      {brands.length === 0 ? (
        <div className="text-center text-muted-foreground py-4 text-sm">لا توجد ماركات</div>
      ) : (
        <div className="space-y-2">
          {brands.map((b) => {
            const brandModels = models.filter((m) => m.brand_id === b.id);
            const isOpen = open[b.id];
            return (
              <div key={b.id} className="border border-border rounded-md bg-card/50">
                <div className="flex items-center justify-between px-3 py-2">
                  <button
                    className="flex items-center gap-2 font-medium text-sm flex-1 text-right"
                    onClick={() => setOpen({ ...open, [b.id]: !isOpen })}
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {b.name}
                    <span className="text-xs text-muted-foreground">({brandModels.length})</span>
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => delBrand(b.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="اسم موديل"
                        value={newModelName[b.id] ?? ""}
                        onChange={(e) => setNewModelName({ ...newModelName, [b.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addModel(b.id)}
                        className="h-8 text-sm"
                      />
                      <Button size="sm" onClick={() => addModel(b.id)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    {brandModels.map((m) => {
                      const modelEngines = engines.filter((e) => e.model_id === m.id);
                      return (
                        <div key={m.id} className="border border-border/70 rounded p-2 bg-background/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{m.name}</span>
                            <Button size="icon" variant="ghost" onClick={() => delModel(m.id)} className="text-destructive h-7 w-7">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {modelEngines.map((eng) => (
                              <span key={eng.id} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded">
                                {eng.name}
                                <button onClick={() => delEngine(eng.id)} className="hover:text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="محرك"
                              value={newEngineName[m.id] ?? ""}
                              onChange={(ev) => setNewEngineName({ ...newEngineName, [m.id]: ev.target.value })}
                              onKeyDown={(ev) => ev.key === "Enter" && addEngine(m.id)}
                              className="h-7 text-xs"
                            />
                            <Button size="sm" variant="secondary" onClick={() => addEngine(m.id)} className="h-7">
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
