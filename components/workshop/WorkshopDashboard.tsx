import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskAssignmentModal } from './TaskAssignmentModal';
import { RepairLogTable } from './RepairLogTable';

export function WorkshopDashboard() {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">نظام الورشة</h1>
        <Button onClick={() => setShowModal(true)}>
          توزيع مهمة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>سيارات جاري إصلاحها</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">12</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>مهام متأخرة</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold text-red-600">3</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>فنيين نشطين</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-bold">8</p></CardContent>
        </Card>
      </div>

      <RepairLogTable />

      <TaskAssignmentModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
}
