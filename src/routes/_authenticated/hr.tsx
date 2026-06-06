import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/RoleGate";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hr")({
  head: () => ({ meta: [{ title: "الموارد البشرية — توكيل السيارات" }] }),
  component: () => (
    <RoleGate tab="hr">
      <Card className="p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary p-3 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الموارد البشرية</h1>
            <p className="text-sm text-muted-foreground mt-1">
              الموظفين، الحضور والانصراف، والتقارير.
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
