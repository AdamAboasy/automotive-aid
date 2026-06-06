import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card } from "@/components/ui/card";
import { Car } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reception")({
  head: () => ({ meta: [{ title: "خدمة العملاء — توكيل السيارات" }] }),
  component: () => (
    <RoleGate tab="reception">
      <PageStub
        title="خدمة العملاء والاستقبال"
        desc="إدارة العملاء، السيارات، حجوزات الصيانة، المخزون، الشكاوى، ومتابعة العملاء."
      />
    </RoleGate>
  ),
});

function PageStub({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="p-8 space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/15 text-primary p-3 rounded-xl">
          <Car className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{desc}</p>
        </div>
      </div>
      <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
        المحتوى التفصيلي لهذا القسم هيتبني في المرحلة القادمة.
      </div>
    </Card>
  );
}
