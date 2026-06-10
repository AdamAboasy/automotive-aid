import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AttendanceManager } from "@/components/hr/AttendanceManager";
import { EmployeesManager } from "@/components/settings/EmployeesManager";

export const Route = createFileRoute("/_authenticated/hr")({
  head: () => ({ meta: [{ title: "الموارد البشرية — توكيل السيارات" }] }),
  component: () => (
    <RoleGate tab="hr">
      <HRPage />
    </RoleGate>
  ),
});

function HRPage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary p-3 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الموارد البشرية</h1>
            <p className="text-sm text-muted-foreground mt-1">
              الموظفين، الحضور والانصراف.
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="attendance">الحضور والانصراف</TabsTrigger>
          <TabsTrigger value="employees">الموظفين</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance"><Card className="p-6"><AttendanceManager /></Card></TabsContent>
        <TabsContent value="employees"><Card className="p-6"><EmployeesManager /></Card></TabsContent>
      </Tabs>
    </div>
  );
}
