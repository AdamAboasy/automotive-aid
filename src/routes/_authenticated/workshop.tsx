import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workshop")({
  head: () => ({ meta: [{ title: "الورشة — توكيل السيارات" }] }),
  component: () => (
    <RoleGate tab="workshop">
      <Card className="p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary p-3 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الورشة</h1>
            <p className="text-sm text-muted-foreground mt-1">
              أوامر الشغل، حالة الصيانة، الفنيين، وربط الحجوزات بالأوامر تلقائياً.
            </p>
          </div>
        </div>
        <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
          المحتوى التفصيلي لهذا القسم هيتبني في المرحلة القادمة.
        </div>
      </Card>
    </RoleGate>
  ),
});
