import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import type { ColumnDef } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { listMyCircles, type TeacherCircle } from "@/services/circles"
import { Link } from "react-router-dom"

export default function MyCircles() {
    const [rows, setRows] = useState<TeacherCircle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            try {
                const data = await listMyCircles()
                setRows(Array.isArray(data) ? data : [])
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const columns = useMemo<ColumnDef<TeacherCircle>[]>(() => [
        { header: "#", cell: ({ row }) => row.index + 1 },
        { accessorKey: "name", header: "اسم الحلقة" },
        { accessorKey: "institute_name", header: "المعهد", cell: ({ getValue }) => getValue() || "—" },
        { accessorKey: "students_count", header: "عدد الطلبة", cell: ({ getValue }) => getValue() ?? 0 },
        { accessorKey: "schedule", header: "الجدول", cell: ({ getValue }) => getValue() || "—" },
        {
            id: "actions",
            header: "إجراءات",
            cell: ({ row }) => {
                const c = row.original
                return (
                    <div className="flex gap-2">
                        <Link to={`/teacher/attendance?circle_id=${c.id}`}>
                            <Button size="sm" variant="outline">تسجيل الحضور</Button>
                        </Link>
                        <Link to={`/teacher/memorization?circle_id=${row.original.id}`}>
                            <Button size="sm" variant="outline">تسجيل الحفظ</Button>
                        </Link>
                        <Link to={`/teacher/assessments?circle_id=${c.id}`}>
                            <Button size="sm" variant="outline">التقييمات</Button>
                        </Link>
                    </div>
                )
            }
        }
    ], [])

    return (
        <AppLayout>
            <Header />
            <div className="p-4" dir="rtl">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold">حلقاتي</h1>
                    <Link to="/teacher/attendance">
                        <Button variant="outline">تسجيل حضور سريع</Button>
                    </Link>

                </div>

                <DataTable data={rows} columns={columns} isLoading={loading} />
            </div>
        </AppLayout>
    )
}
