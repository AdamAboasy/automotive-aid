import { createFileRoute } from '@tanstack/start'
import { ReceptionDashboard } from '@/components/reception/ReceptionDashboard'

export const Route = createFileRoute('/reception')({
  component: ReceptionPage,
})

function ReceptionPage() {
  return <ReceptionDashboard />
}
