import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { EmptyState } from "@/components/ui/empty-state"
import type { ColumnDef } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { listStudentCircles, type StudentCircle } from "@/services/circles"

export default function StudentMyCircles() {
  const [rows, setRows] = useState<StudentCircle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await listStudentCircles()
        setRows(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setRows([])
        setError(
          e?.response?.data?.message ||
            "تعذر جلب حلقاتك الآن (قد يكون endpoint /student/circles غير متوفر في الـ Backend الحالي)."
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const columns = useMemo<ColumnDef<StudentCircle>[]>(
    () => [
      { header: "#", cell: ({ row }) => row.index + 1 },
      { accessorKey: "name", header: "اسم الحلقة" },
      { accessorKey: "teacher_name", header: "المدرّس", cell: ({ getValue }) => getValue() || "—" },
      { accessorKey: "schedule", header: "الجدول", cell: ({ getValue }) => getValue() || "—" },
    ],
    []
  )

  return (
    <AppLayout>
      <Header />
      <div className="p-4" dir="rtl">
        <div className="mb-4">
          <h1 className="text-xl font-bold">حلقاتي</h1>
          <p className="text-sm text-gray-600">استعرض الحلقات المسجل بها ومواعيدها</p>
        </div>

        <Card className="p-4">
          {error && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error}
            </div>
          )}

          {!loading && rows.length === 0 ? (
            <EmptyState title="لا توجد حلقات" description="عند تسجيلك في حلقة ستظهر هنا." />
          ) : (
            <DataTable data={rows} columns={columns} isLoading={loading} />
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
