import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const mockRequests = [
  {
    id: 1,
    customer: "أحمد محمد",
    plate: "1234 ABC",
    model: "تويوتا كامري",
    issue: "صوت غريب من المحرك",
    status: "pending",
    time: "منذ ساعة",
  },
  {
    id: 2,
    customer: "محمد علي",
    plate: "5678 XYZ",
    model: "هيونداي إلنترا",
    issue: "فرامل غير مستجيبة",
    status: "in_progress",
    time: "منذ 3 ساعات",
  },
]

export function ServiceRequestsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>السيارات الواردة اليوم</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right p-3">العميل</th>
                <th className="text-right p-3">رقم اللوحة</th>
                <th className="text-right p-3">الموديل</th>
                <th className="text-right p-3">المشكلة</th>
                <th className="text-right p-3">الحالة</th>
                <th className="text-right p-3">الوقت</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mockRequests.map((req) => (
                <tr key={req.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">{req.customer}</td>
                  <td className="p-3 font-mono">{req.plate}</td>
                  <td className="p-3">{req.model}</td>
                  <td className="p-3 text-sm">{req.issue}</td>
                  <td className="p-3">
                    <Badge variant={req.status === 'pending' ? 'secondary' : 'default'}>
                      {req.status === 'pending' ? 'في الانتظار' : 'جاري العمل'}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{req.time}</td>
                  <td className="p-3">
                    <Button variant="outline" size="sm">تفاصيل</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
