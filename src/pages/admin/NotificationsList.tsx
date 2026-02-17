import AppLayout from '@/layouts/AppLayout'
import PageHeader from '@/components/ui/Header'
import { DataTable } from '@/components/ui/datatable'
import type { ColumnDef } from '@tanstack/react-table'

type Notification = {
  id: number
  title: string
  recipient: string
  created_at: string
}

const rows: Notification[] = [
  { id: 1, title: 'Congrats', recipient: 'Teacher Ahmad', created_at: '2025-08-12' },
  { id: 2, title: 'Exam Schedule', recipient: 'All Students', created_at: '2025-08-10' },
]

const columns: ColumnDef<Notification>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'recipient', header: 'Recipient' },
  { accessorKey: 'created_at', header: 'Created At' },
]

export default function NotificationsList() {
  return (
    <AppLayout>
      <PageHeader title="Notifications" />
      <DataTable data={rows} columns={columns} />
    </AppLayout>
  )
}
