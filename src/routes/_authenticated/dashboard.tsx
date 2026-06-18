import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Car, Users, Wrench, Package, ClipboardList, Calendar, Download, Upload, AlertCircle, CheckCircle2, RotateCcw, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";

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
  employees: number;
  attendance_today: number;
  complaints_open: number;
}

interface Complaint {
  id: string; subject: string; description: string | null; status: string; priority: string;
  created_at: string;
  clients?: { name: string; phone: string | null } | null;
  cars?: { plate_number: string | null } | null;
}

interface LowPart {
  id: string; name: string; part_code: string | null; quantity: number; min_quantity: number; unit: string;
  workshops?: { name: string } | null;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [complaintsOpen, setComplaintsOpen] = useState(false);
  const [resolvedOpen, setResolvedOpen] = useState(false);
  const [lowStockOpen, setLowStockOpen] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [resolvedComplaints, setResolvedComplaints] = useState<Complaint[]>([]);
  const [lowParts, setLowParts] = useState<LowPart[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const c = (q: any) => q.then((r: any) => r.count ?? 0);
    const [
      clients, cars, bookingsToday, bookingsPending,
      woOpen, woInProgress, woCompleted,
      spareParts, employees, attendanceToday, spareAll,
      complaintsOpenCount, openCList, resolvedCList,
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
      supabase.from("spare_parts").select("id,name,part_code,quantity,min_quantity,unit,workshops(name)"),
      c(supabase.from("complaints").select("*", { count: "exact", head: true }).in("status", ["open", "in_review"])),
      supabase.from("complaints").select("*, clients(name,phone), cars(plate_number)").in("status", ["open", "in_review"]).order("created_at", { ascending: false }),
      supabase.from("complaints").select("*, clients(name,phone), cars(plate_number)").eq("status", "resolved").order("created_at", { ascending: false }),
    ]);
    const lowPartsList = ((spareAll.data ?? []) as LowPart[]).filter((p) => (p.quantity ?? 0) <= (p.min_quantity ?? 0));
    setLowParts(lowPartsList);
    setComplaints((openCList.data as Complaint[]) ?? []);
    setResolvedComplaints((resolvedCList.data as Complaint[]) ?? []);
    setStats({
      clients, cars,
      bookings_today: bookingsToday, bookings_pending: bookingsPending,
      work_orders_open: woOpen, work_orders_in_progress: woInProgress, work_orders_completed: woCompleted,
      spare_parts: spareParts,
      employees, attendance_today: attendanceToday,
      complaints_open: complaintsOpenCount,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolveComplaint = async (id: string) => {
    const { error } = await supabase.from("complaints").update({ status: "resolved" } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم حل الشكوى");
    setSelectedComplaint(null);
    load();
  };

  const reopenComplaint = async (id: string) => {
    const { error } = await supabase.from("complaints").update({ status: "open" } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم إعادة فتح الشكوى للمدير");
    setSelectedComplaint(null);
    load();
  };

  const exportToPDF = async () => {
    toast.info("جاري إنشاء ملف PDF...");
    const doc = new jsPDF({ orientation: "landscape" });
    
    // Add Arabic Font Support (using a standard font that supports some RTL or basic Latin)
    doc.setFontSize(20);
    doc.text("Automotive Aid - Full Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tables = [
      { id: "clients", name: "Clients", columns: ["name", "phone", "email"] },
      { id: "cars", name: "Cars", columns: ["plate_number", "vin", "color"] },
      { id: "work_orders", name: "Work Orders", columns: ["status", "description", "created_at"] },
      { id: "spare_parts", name: "Spare Parts", columns: ["name", "part_code", "quantity", "selling_price"] },
    ];

    let yOffset = 40;

    for (const t of tables) {
      const { data, error } = await supabase.from(t.id as any).select("*").limit(50);
      if (error || !data || data.length === 0) continue;

      doc.setFontSize(14);
      doc.text(t.name, 14, yOffset);
      
      (doc as any).autoTable({
        startY: yOffset + 5,
        head: [t.columns],
        body: data.map((row: any) => t.columns.map(col => row[col] || "-")),
        theme: "striped",
        headStyles: { fillColor: [63, 81, 181] },
      });

      yOffset = (doc as any).lastAutoTable.finalY + 15;
      if (yOffset > 180) {
        doc.addPage();
        yOffset = 20;
      }
    }

    doc.save(`automotive-aid-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("تم تحميل ملف PDF بنجاح");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info("جاري معالجة الملف...");
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) throw new Error("الملف فارغ");

        // Simple mapping for demonstration - in real app, user would map columns
        toast.info(`تم اكتشاف ${data.length} سجل، جاري الاستيراد لجدول العملاء...`);
        
        for (const item of data as any[]) {
          await supabase.from("clients").insert({
            name: item.name || item["الاسم"] || "مستورد",
            phone: item.phone || item["الهاتف"] || null,
            email: item.email || item["الايميل"] || null,
          });
        }

        toast.success("تم استيراد البيانات بنجاح");
        load();
      } catch (err: any) {
        toast.error("فشل الاستيراد: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
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
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 ml-1" /> استيراد بيانات
                </span>
              </Button>
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} />
            </label>
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 ml-1" /> تصدير PDF
            </Button>
          </div>
        </div>
      </Card>

      {loading || !stats ? (
        <div className="text-center text-muted-foreground py-10">جاري التحميل...</div>
      ) : (
        <>
          <Section title="الاستقبال" icon={Car}>
            <Stat label="إجمالي العملاء" value={stats.clients} />
            <Stat label="إجمالي السيارات" value={stats.cars} />
            <Stat label="حجوزات اليوم" value={stats.bookings_today} accent="primary" onClick={() => navigate({ to: "/customer-service" })} />
          </Section>

          <Section title="خدمة العملاء" icon={AlertCircle}>
            <Stat
              label="شكاوى مفتوحة"
              value={stats.complaints_open}
              accent={stats.complaints_open > 0 ? "warn" : "good"}
              icon={AlertCircle}
              onClick={() => setComplaintsOpen(true)}
            />
            <Stat
              label="شكاوى تم حلها"
              value={resolvedComplaints.length}
              accent="good"
              icon={CheckCircle2}
              onClick={() => setResolvedOpen(true)}
            />
          </Section>

          <Section title="الورشة" icon={Wrench}>
            <Stat label="أوامر مفتوحة" value={stats.work_orders_open} accent="warn" />
            <Stat label="قيد التنفيذ" value={stats.work_orders_in_progress} accent="primary" />
            <Stat label="منتهية" value={stats.work_orders_completed} accent="good" />
            <Stat
              label="قطع منخفضة المخزون"
              value={lowParts.length}
              accent={lowParts.length > 0 ? "warn" : "good"}
              icon={Package}
              onClick={() => setLowStockOpen(true)}
            />
          </Section>

          <Section title="الموارد البشرية" icon={Users}>
            <Stat label="عدد الموظفين" value={stats.employees} />
            <Stat label="الحاضرون اليوم" value={stats.attendance_today} accent="good" icon={Calendar} />
          </Section>
        </>
      )}

      {/* Open complaints dialog */}
      <Dialog open={complaintsOpen} onOpenChange={setComplaintsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>الشكاوى المفتوحة ({complaints.length})</DialogTitle></DialogHeader>
          {complaints.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">لا توجد شكاوى مفتوحة</div>
          ) : (
            <div className="grid gap-2">
              {complaints.map((c) => (
                <button key={c.id} onClick={() => setSelectedComplaint(c)}
                  className="text-right border border-border rounded-lg p-3 hover:bg-accent/30 transition">
                  <div className="font-medium">{c.subject}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                    <span>{c.clients?.name ?? "—"}</span>
                    {c.clients?.phone && <span>{c.clients.phone}</span>}
                    {c.cars?.plate_number && <span>لوحة: {c.cars.plate_number}</span>}
                    <span>{fmtDate(c.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolved complaints dialog */}
      <Dialog open={resolvedOpen} onOpenChange={setResolvedOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>الشكاوى التي تم حلها ({resolvedComplaints.length})</DialogTitle></DialogHeader>
          {resolvedComplaints.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">لا توجد شكاوى محلولة</div>
          ) : (
            <div className="grid gap-2">
              {resolvedComplaints.map((c) => (
                <div key={c.id} className="border border-border rounded-lg p-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{c.subject}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                      <span>{c.clients?.name ?? "—"}</span>
                      {c.cars?.plate_number && <span>لوحة: {c.cars.plate_number}</span>}
                      <span>{fmtDate(c.created_at)}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => reopenComplaint(c.id)}>
                    <RotateCcw className="w-4 h-4 ml-1" /> إعادة فتح
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complaint detail dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={(o) => !o && setSelectedComplaint(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>تفاصيل الشكوى</DialogTitle></DialogHeader>
          {selectedComplaint && (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">المشترك</div>
                <div className="font-medium">{selectedComplaint.clients?.name ?? "—"}</div>
                {selectedComplaint.clients?.phone && (
                  <div className="text-sm text-muted-foreground">{selectedComplaint.clients.phone}</div>
                )}
              </div>
              {selectedComplaint.cars?.plate_number && (
                <div>
                  <div className="text-xs text-muted-foreground">السيارة</div>
                  <div className="font-medium">{selectedComplaint.cars.plate_number}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">الموضوع</div>
                <div className="font-medium">{selectedComplaint.subject}</div>
              </div>
              {selectedComplaint.description && (
                <div>
                  <div className="text-xs text-muted-foreground">التفاصيل</div>
                  <div className="text-sm whitespace-pre-wrap">{selectedComplaint.description}</div>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                التاريخ: {fmtDate(selectedComplaint.created_at)}
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => resolveComplaint(selectedComplaint.id)} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 ml-1" /> تم الحل
                </Button>
                <Button variant="outline" onClick={() => reopenComplaint(selectedComplaint.id)} className="flex-1">
                  <RotateCcw className="w-4 h-4 ml-1" /> إعادة للمدير
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Low stock dialog */}
      <Dialog open={lowStockOpen} onOpenChange={setLowStockOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>قطع الغيار منخفضة المخزون ({lowParts.length})</DialogTitle></DialogHeader>
          {lowParts.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">جميع القطع بمخزون كافٍ</div>
          ) : (
            <div className="grid gap-2">
              {lowParts.map((p) => (
                <div key={p.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-1">
                      {p.part_code && <span>كود: {p.part_code}</span>}
                      {p.workshops?.name && <span>ورشة: {p.workshops.name}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-amber-500">
                      {p.quantity} {p.unit}
                    </div>
                    <div className="text-xs text-muted-foreground">الحد الأدنى: {p.min_quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
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

function Stat({ label, value, accent, icon: Icon, onClick }: { label: string; value: number; accent?: "primary" | "warn" | "good"; icon?: any; onClick?: () => void }) {
  const cls = accent === "warn" ? "text-amber-500" : accent === "good" ? "text-emerald-500" : accent === "primary" ? "text-primary" : "text-foreground";
  const interactive = onClick ? "cursor-pointer hover:bg-accent/30 transition" : "";
  return (
    <Card className={`p-4 ${interactive}`} onClick={onClick}>
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </div>
      <div className={`text-3xl font-bold mt-2 ${cls}`}>{value}</div>
    </Card>
  );
}
