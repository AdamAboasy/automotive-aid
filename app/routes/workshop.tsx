import { createFileRoute } from '@tanstack/start'
import { WorkshopDashboard } from '@/components/workshop/WorkshopDashboard'

export const Route = createFileRoute('/workshop')({
  component: WorkshopPage,
})

function WorkshopPage() {
  return <WorkshopDashboard />
}
