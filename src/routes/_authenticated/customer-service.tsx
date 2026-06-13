import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card } from "@/components/ui/card";
import { Headphones } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ComplaintsManager } from "@/components/reception/ComplaintsManager";
import { FollowupsManager } from "@/components/reception/FollowupsManager";
import { BookingsManager } from "@/components/reception/BookingsManager";

export const Route = createFileRoute("/_authenticated/customer-service")({
  head: () => ({ meta: [{ title: "خدمة العملاء — توكيل السيارات" }] }),
  component: () => (
    <RoleGate tab="customer_service">
      <CustomerServicePage />
    </RoleGate>
  ),
});

function CustomerServicePage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary p-3 rounded-xl">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">خدمة العملاء</h1>
            <p className="text-sm text-muted-foreground mt-1">
              متابعة الشكاوى والتواصل مع العملاء بعد الخدمة.
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="complaints" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="complaints">الشكاوى</TabsTrigger>
          <TabsTrigger value="followups">المتابعة</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints"><Card className="p-6"><ComplaintsManager /></Card></TabsContent>
        <TabsContent value="followups"><Card className="p-6"><FollowupsManager /></Card></TabsContent>
      </Tabs>
    </div>
  );
}
