import { EquipmentList } from '@/components/equipment/equipment-list'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function EquipmentPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <EquipmentList />
      </div>
    </DashboardLayout>
  )
}