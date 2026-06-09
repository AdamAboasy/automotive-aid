import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card } from "@/components/ui/card";
import { Car } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClientsManager } from "@/components/reception/ClientsManager";
import { CarsManager } from "@/components/reception/CarsManager";
import { BookingsManager } from "@/components/reception/BookingsManager";
import { ComplaintsManager } from "@/components/reception/ComplaintsManager";
import { FollowupsManager } from "@/components/reception/FollowupsManager";

export const Route = createFileRoute("/_authenticated/reception")({
  head: () => ({ meta: [{ title: "خدمة العملاء — توكيل السيارات" }] }),
  component: () => (
    <RoleGate tab="reception">
      <ReceptionPage />
    </RoleGate>
  ),
});

function ReceptionPage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary p-3 rounded-xl">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">خدمة العملاء والاستقبال</h1>
            <p className="text-sm text-muted-foreground mt-1">
              العملاء، السيارات، الحجوزات، الشكاوى، والمتابعة.
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="clients">العملاء</TabsTrigger>
          <TabsTrigger value="cars">السيارات</TabsTrigger>
          <TabsTrigger value="bookings">حجوزات الصيانة</TabsTrigger>
          <TabsTrigger value="complaints">الشكاوى</TabsTrigger>
          <TabsTrigger value="followups">المتابعة</TabsTrigger>
        </TabsList>

        <TabsContent value="clients"><Card className="p-6"><ClientsManager /></Card></TabsContent>
        <TabsContent value="cars"><Card className="p-6"><CarsManager /></Card></TabsContent>
        <TabsContent value="bookings"><Card className="p-6"><BookingsManager /></Card></TabsContent>
        <TabsContent value="complaints"><Card className="p-6"><ComplaintsManager /></Card></TabsContent>
        <TabsContent value="followups"><Card className="p-6"><FollowupsManager /></Card></TabsContent>
      </Tabs>
    </div>
  );
}
