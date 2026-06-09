import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SparePartsManager } from "@/components/workshop/SparePartsManager";

export const Route = createFileRoute("/_authenticated/workshop")({
  head: () => ({ meta: [{ title: "الورشة — توكيل السيارات" }] }),
  component: () => (
    <RoleGate tab="workshop">
      <WorkshopPage />
    </RoleGate>
  ),
});

function WorkshopPage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary p-3 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الورشة</h1>
            <p className="text-sm text-muted-foreground mt-1">
              مخزون قطع الغيار، أوامر الشغل، حالة الصيانة، والفنيين.
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="spare_parts" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="spare_parts">قطع الغيار</TabsTrigger>
          <TabsTrigger value="work_orders" disabled>أوامر الشغل (قريباً)</TabsTrigger>
        </TabsList>

        <TabsContent value="spare_parts"><Card className="p-6"><SparePartsManager /></Card></TabsContent>
      </Tabs>
    </div>
  );
}
