import { TransactionList } from '@/components/transactions/transaction-list'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <TransactionList />
      </div>
    </DashboardLayout>
  )
}