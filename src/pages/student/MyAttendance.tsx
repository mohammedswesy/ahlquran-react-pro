import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { PiCalendarCheckBold } from "react-icons/pi"
import {
  getStudentAttendanceHistory,
  getStudentAttendanceSummary,
  type StudentAttendanceRecord,
  type StudentAttendanceSummary,
} from "@/services/studentService"
import { getCircleTrackColor } from "@/lib/circleTracks"

const STATUS_UI = {
  present: { label: "حاضر", background: "#dcfce7", border: "#86efac", text: "#15803d" },
  absent: { label: "غائب", background: "#fee2e2", border: "#fca5a5", text: "#b91c1c" },
  late: { label: "متأخر", background: "#fef3c7", border: "#fcd34d", text: "#b45309" },
  excused: { label: "معذور", background: "#e0e7ff", border: "#a5b4fc", text: "#4338ca" },
} as const

export default function MyAttendance() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null)
  const [rows, setRows] = useState<StudentAttendanceRecord[]>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [summaryData, records] = await Promise.all([
          getStudentAttendanceSummary(),
          getStudentAttendanceHistory(),
        ])
        setSummary(summaryData)
        setRows(records)
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "تعذر تحميل سجل الحضور")
        setSummary(null)
        setRows([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const statusCounts = useMemo(() => ({
    present: rows.filter((row) => row.status === "present").length,
    absent: rows.filter((row) => row.status === "absent").length,
    late: rows.filter((row) => row.status === "late").length,
  }), [rows])

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6">
        <Header title="سجل حضوري" subtitle="تابع حضورك اليومي ونسبة التزامك" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="py-6">
              {loading || !summary ? (
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl p-4" style={{ background: "rgba(22,163,74,.08)" }}>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>نسبة الحضور</div>
                    <div className="mt-1 text-2xl font-black" style={{ color: "#15803d" }}>{Math.round(summary.presence_percent)}%</div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: "rgba(220,38,38,.08)" }}>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>نسبة الغياب</div>
                    <div className="mt-1 text-2xl font-black" style={{ color: "#b91c1c" }}>{Math.round(summary.absence_percent)}%</div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: "rgba(0,61,53,.06)" }}>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>إجمالي اللقاءات</div>
                    <div className="mt-1 text-2xl font-black" style={{ color: "var(--text)" }}>{summary.total}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ملخص الحالات</CardTitle>
              <CardDescription>توزيع حالات الحضور الأخيرة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["present", "absent", "late"] as const).map((status) => (
                <div key={status} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: STATUS_UI[status].background }}>
                  <span style={{ color: STATUS_UI[status].text }}>{STATUS_UI[status].label}</span>
                  <span className="font-bold" style={{ color: STATUS_UI[status].text }}>{statusCounts[status]}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">السجل التفصيلي</CardTitle>
              <CardDescription>مرتب من الأحدث إلى الأقدم لسهولة المتابعة من الجوال</CardDescription>
            </div>
            <PiCalendarCheckBold size={18} style={{ color: "var(--brand)" }} />
          </CardHeader>
          <CardContent className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, idx) => <Skeleton key={idx} className="h-24 w-full" />)
              : rows.map((row) => {
                  const statusUi = STATUS_UI[row.status] ?? STATUS_UI.present
                  const trackColor = getCircleTrackColor(row.track)
                  return (
                    <div key={row.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold" style={{ color: "var(--text)" }}>
                            {row.circle_name || "حلقة الطالب"}
                          </div>
                          <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                            {row.date ? new Date(row.date).toLocaleDateString("ar-SA") : "بدون تاريخ"}
                          </div>
                        </div>
                        <Badge
                          style={{
                            background: statusUi.background,
                            borderColor: statusUi.border,
                            color: statusUi.text,
                          }}
                        >
                          {statusUi.label}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge
                          style={{
                            background: trackColor.background,
                            borderColor: trackColor.border,
                            color: trackColor.text,
                          }}
                        >
                          {row.track_name}
                        </Badge>
                      </div>

                      {row.notes && (
                        <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: "rgba(0,61,53,.05)", color: "var(--text)" }}>
                          {row.notes}
                        </div>
                      )}
                    </div>
                  )
                })}

            {!loading && rows.length === 0 && (
              <div className="py-10 text-center">
                <div className="text-lg font-bold" style={{ color: "var(--text)" }}>لا توجد سجلات حضور بعد</div>
                <div className="mt-2 text-sm" style={{ color: "var(--muted)" }}>سيظهر سجل حضورك هنا بمجرد تسجيله من المعهد.</div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="pb-6 text-center text-xs" style={{ color: "var(--muted)" }}>
          معاهد الخليل لتعليم القرآن الكريم
        </div>
      </div>
    </AppLayout>
  )
}
