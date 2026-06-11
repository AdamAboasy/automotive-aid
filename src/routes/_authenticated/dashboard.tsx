import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Car, Users, Wrench, Package, ClipboardList, Calendar, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "لوحة المعلومات — توكيل السيارات" }] }),
  component: DashboardPage,
});

interface Stats {
  clients: number;
  cars: number;
  bookings_today: number;
  bookings_pending: number;
  work_orders_open: number;
  work_orders_in_progress: number;
  work_orders_completed: number;
  spare_parts: number;
  low_stock: number;
  employees: number;
  attendance_today: number;
}

function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const c = (q: any) => q.then((r: any) => r.count ?? 0);
    const [
      clients, cars, bookingsToday, bookingsPending,
      woOpen, woInProgress, woCompleted,
      spareParts, employees, attendanceToday, spareAll,
    ] = await Promise.all([
      c(supabase.from("clients").select("*", { count: "exact", head: true })),
      c(supabase.from("cars").select("*", { count: "exact", head: true })),
      c(supabase.from("maintenance_bookings").select("*", { count: "exact", head: true }).gte("scheduled_at", `${today}T00:00:00`).lt("scheduled_at", `${today}T23:59:59`)),
      c(supabase.from("maintenance_bookings").select("*", { count: "exact", head: true }).eq("status", "pending")),
      c(supabase.from("work_orders").select("*", { count: "exact", head: true }).eq("status", "open")),
      c(supabase.from("work_orders").select("*", { count: "exact", head: true }).eq("status", "in_progress")),
      c(supabase.from("work_orders").select("*", { count: "exact", head: true }).eq("status", "completed")),
      c(supabase.from("spare_parts").select("*", { count: "exact", head: true })),
      c(supabase.from("employees").select("*", { count: "exact", head: true })),
      c(supabase.from("attendance").select("*", { count: "exact", head: true }).eq("work_date", today).eq("status", "present")),
      supabase.from("spare_parts").select("quantity,min_quantity"),
    ]);
    const lowStock = (spareAll.data ?? []).filter((p: any) => (p.quantity ?? 0) <= (p.min_quantity ?? 0)).length;
    setStats({
      clients, cars,
      bookings_today: bookingsToday, bookings_pending: bookingsPending,
      work_orders_open: woOpen, work_orders_in_progress: woInProgress, work_orders_completed: woCompleted,
      spare_parts: spareParts, low_stock: lowStock,
      employees, attendance_today: attendanceToday,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const exportAll = async () => {
    toast.info("جاري تجهيز البيانات...");
    const tables = ["clients", "cars", "maintenance_bookings", "work_orders", "spare_parts", "employees", "attendance", "complaints", "client_followups"];
    const dump: Record<string, any> = { exported_at: new Date().toISOString() };
    for (const t of tables) {
      const { data, error } = await supabase.from(t as any).select("*");
      if (error) { toast.error(`${t}: ${error.message}`); continue; }
      dump[t] = data;
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/15 text-primary p-3 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">لوحة المعلومات</h1>
              <p className="text-sm text-muted-foreground mt-1">نظرة عامة على نشاط التوكيل اليوم.</p>
            </div>
          </div>
          <Button onClick={exportAll} variant="outline" size="sm">
            <Download className="w-4 h-4 ml-1" /> تصدير نسخة احتياطية
          </Button>
        </div>
      </Card>

      {loading || !stats ? (
        <div className="text-center text-muted-foreground py-10">جاري التحميل...</div>
      ) : (
        <>
          <Section title="الاستقبال" icon={Car}>
            <Stat label="إجمالي العملاء" value={stats.clients} />
            <Stat label="إجمالي السيارات" value={stats.cars} />
            <Stat label="حجوزات اليوم" value={stats.bookings_today} accent="primary" />
            <Stat label="حجوزات في الانتظار" value={stats.bookings_pending} accent="warn" />
          </Section>

          <Section title="الورشة" icon={Wrench}>
            <Stat label="أوامر مفتوحة" value={stats.work_orders_open} accent="warn" />
            <Stat label="قيد التنفيذ" value={stats.work_orders_in_progress} accent="primary" />
            <Stat label="منتهية" value={stats.work_orders_completed} accent="good" />
            <Stat label="منخفض المخزون" value={stats.low_stock} accent={stats.low_stock > 0 ? "warn" : "good"} icon={Package} />
          </Section>

          <Section title="الموارد البشرية" icon={Users}>
            <Stat label="عدد الموظفين" value={stats.employees} />
            <Stat label="الحاضرون اليوم" value={stats.attendance_today} accent="good" icon={Calendar} />
            <Stat label="قطع غيار مسجلة" value={stats.spare_parts} icon={ClipboardList} />
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
        <Icon className="w-4 h-4" /> {title}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

function Stat({ label, value, accent, icon: Icon }: { label: string; value: number; accent?: "primary" | "warn" | "good"; icon?: any }) {
  const cls = accent === "warn" ? "text-amber-500" : accent === "good" ? "text-emerald-500" : accent === "primary" ? "text-primary" : "text-foreground";
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </div>
      <div className={`text-3xl font-bold mt-2 ${cls}`}>{value}</div>
    </Card>
  );
}
