import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { EmptyState } from "@/components/ui/empty-state"
import type { ColumnDef } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { getMyCircle, listMyCircleStudents, listMyCircles, type CircleStudent, type TeacherCircle } from "@/services/circles"

export default function CircleDetails() {
  const params = useParams()
  const circleId = Number(params.id)

  const [circle, setCircle] = useState<TeacherCircle | null>(null)
  const [students, setStudents] = useState<CircleStudent[]>([])
  const [loadingCircle, setLoadingCircle] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [studentsError, setStudentsError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        setLoadingCircle(true)
        if (!Number.isFinite(circleId)) return

        // حاول endpoint المباشر أولاً
        try {
          const c = await getMyCircle(circleId)
          if (c) return setCircle(c)
        } catch {
          // تجاهل
        }

        // fallback: جلب كل حلقاتي ثم إيجاد المطلوبة
        const all = await listMyCircles()
        const found = all.find((x) => Number(x.id) === circleId) || null
        setCircle(found)
      } finally {
        setLoadingCircle(false)
      }
    })()
  }, [circleId])

  useEffect(() => {
    (async () => {
      try {
        setLoadingStudents(true)
        setStudentsError(null)
        if (!Number.isFinite(circleId)) return
        const rows = await listMyCircleStudents(circleId)
        setStudents(Array.isArray(rows) ? rows : [])
      } catch (e: any) {
        setStudents([])
        setStudentsError(
          e?.response?.data?.message ||
            "تعذر جلب طلاب الحلقة الآن (قد يكون endpoint غير متوفر في الـ Backend الحالي)."
        )
      } finally {
        setLoadingStudents(false)
      }
    })()
  }, [circleId])

  const columns = useMemo<ColumnDef<CircleStudent>[]>(
    () => [
      { header: "#", cell: ({ row }) => row.index + 1 },
      { accessorKey: "name", header: "الاسم" },
      { accessorKey: "mobile", header: "الجوال", cell: ({ getValue }) => getValue() || "—" },
      { accessorKey: "email", header: "البريد", cell: ({ getValue }) => getValue() || "—" },
      { accessorKey: "status", header: "الحالة", cell: ({ getValue }) => getValue() || "—" },
    ],
    []
  )

  return (
    <AppLayout>
      <Header />

      <div className="p-4 space-y-4" dir="rtl">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">تفاصيل الحلقة</h1>
            <p className="text-sm text-gray-600">
              {loadingCircle ? "…" : circle?.name || "—"}
              {circle?.institute_name ? ` • ${circle.institute_name}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/teacher/circles">
              <Button variant="outline">رجوع</Button>
            </Link>
            <Link to={`/teacher/attendance?circle_id=${circleId}`}>
              <Button variant="outline">تسجيل الحضور</Button>
            </Link>
            <Link to={`/teacher/memorization?circle_id=${circleId}`}>
              <Button variant="outline">تسجيل الحفظ</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm text-gray-600">عدد الطلاب</div>
            <div className="text-2xl font-bold">{circle?.students_count ?? students.length ?? 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">الجدول</div>
            <div className="text-base font-semibold">{circle?.schedule || "—"}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">المعرف</div>
            <div className="text-base font-semibold">#{Number.isFinite(circleId) ? circleId : "—"}</div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">طلاب الحلقة</h2>
            <div className="text-sm text-gray-600">{students.length} طالب</div>
          </div>

          {studentsError && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {studentsError}
            </div>
          )}

          {!loadingStudents && students.length === 0 ? (
            <EmptyState title="لا يوجد طلاب" description="لم يتم العثور على طلاب لهذه الحلقة." />
          ) : (
            <DataTable data={students} columns={columns} isLoading={loadingStudents} />
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
