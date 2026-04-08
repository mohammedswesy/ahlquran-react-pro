import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { listEnrollments, type Enrollment } from "@/services/enrollments"

export default function EnrollmentsList() {
  const nav = useNavigate()
  const [rows, setRows] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  async function load() {
    setLoading(true)
    try {
      const data = await listEnrollments({
        per_page: 100,
        search: search.trim() || undefined,
      })
      const list: Enrollment[] = Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray(data)
          ? data
          : []
      setRows(list)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل التسجيلات")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = setTimeout(() => load(), 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const columns = useMemo<ColumnDef<Enrollment>[]>(
    () => [
      { header: "#", cell: ({ row }) => row.index + 1 },
      { id: "student", header: "الطالب", cell: ({ row }) => row.original.student?.name || "-" },
      { id: "institute", header: "المعهد", cell: ({ row }) => row.original.institute?.name || "-" },
      { accessorKey: "status", header: "الحالة" },
      { accessorKey: "payment_status", header: "حالة الدفع" },
      {
        id: "fees",
        header: "الرسوم",
        cell: ({ row }) => {
          const total = Number(row.original.total_fees ?? 0)
          const paid = Number(row.original.paid_amount ?? 0)
          return `${paid} / ${total}`
        },
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => nav(`/admin/enrollments/${row.original.id}/edit`)}>
            تعديل
          </Button>
        ),
      },
    ],
    [nav]
  )

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end gap-2">
            <Input
              label="بحث"
              placeholder="ابحث باسم الطالب..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 text-right"
            />
            <div className="ms-auto flex gap-2">
              <Button variant="outline" onClick={load}>تحديث</Button>
              <Button onClick={() => nav("/admin/enrollments/new")}>إضافة تسجيل</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rows} isLoading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
