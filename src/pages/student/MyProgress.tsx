// src/pages/student/MyProgress.tsx
import { useEffect, useState } from "react"
import api from "@/services/api"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type StudentInfo = {
    id: number
    name: string | null
    code?: string | null
    level?: string | null
}

type AttendanceRow = {
    id: number
    circle_id: number
    date: string
    status: string
    circle?: { id: number; name: string }
}

type AssessmentRow = {
    id: number
    circle_id: number
    teacher_id: number | null
    date: string
    type: string | null
    score: number | null
    max_score: number | null
    grade: string | null
    notes: string | null
    circle?: { id: number; name: string }
    teacher?: { id: number; full_name?: string; name?: string }
}

type AttendanceStats = {
    total_sessions: number
    present: number
    absent: number
    late: number
    attendance_rate: number
}

type AssessmentStats = {
    count: number
    avg_score: number | null
    avg_percent: number | null
}

type ProgressStats = {
    attendance: AttendanceStats
    assessments: AssessmentStats
}

type ProgressPayload = {
    student: StudentInfo
    stats: ProgressStats
    recent_attendance: AttendanceRow[]
    recent_assessments: AssessmentRow[]
}

export default function MyProgress() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ProgressPayload | null>(null)

    async function load() {
        try {
            setLoading(true)
            const res = await api.get("/student/progress")
            setData(res.data?.data as ProgressPayload)
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "تعذر تحميل بيانات التقدّم")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    if (loading && !data) {
        return (
            <div className="p-4" dir="rtl">
                جاري تحميل بيانات التقدّم…
            </div>
        )
    }

    if (!data) {
        return (
            <div className="p-4 space-y-3" dir="rtl">
                <div className="text-red-600 font-medium">
                    تعذر تحميل بيانات التقدّم لهذا الطالب.
                </div>
                <Button variant="outline" onClick={load}>
                    إعادة المحاولة
                </Button>
            </div>
        )
    }

    const { student, stats, recent_attendance, recent_assessments } = data
    const att = stats.attendance
    const ass = stats.assessments

    return (
        <div className="space-y-6" dir="rtl">
            {/* العنوان + معلومات أساسية */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold">تقدّم الطالب</h1>
                    <div className="text-sm text-gray-600 mt-1">
                        {student.name && (
                            <>
                                الطالب: <span className="font-semibold">{student.name}</span>
                            </>
                        )}
                        {student.code && (
                            <span className="ms-3">
                                رقم الطالب: <span className="font-mono">{student.code}</span>
                            </span>
                        )}
                        {student.level && (
                            <span className="ms-3">
                                المستوى: <span>{student.level}</span>
                            </span>
                        )}
                    </div>
                </div>
                <Button size="sm" variant="outline" onClick={load}>
                    تحديث
                </Button>
            </div>

            {/* كروت الإحصائيات */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="text-xs text-gray-500">نسبة الحضور العامة</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {att.attendance_rate?.toFixed(1) ?? 0}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            من إجمالي {att.total_sessions} حصة
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="text-xs text-gray-500">حضور / غياب</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <span className="font-semibold">حضور:</span> {att.present}
                        </div>
                        <div className="text-sm">
                            <span className="font-semibold">غياب:</span> {att.absent}
                        </div>
                        <div className="text-sm">
                            <span className="font-semibold">تأخر:</span> {att.late}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="text-xs text-gray-500">التقييمات</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ass.count}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            عدد التقييمات المسجّلة
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="text-xs text-gray-500">متوسط الدرجة</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ass.avg_percent != null
                                ? `${ass.avg_percent.toFixed(1)}%`
                                : ass.avg_score != null
                                    ? ass.avg_score.toFixed(1)
                                    : "-"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            مبني على آخر التقييمات المسجّلة
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* جدول آخر الحضور */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="text-sm font-semibold">آخر سجلات الحضور</div>
                    <div className="text-xs text-gray-500 mt-1">
                        آخر 10 حصص مسجّلة
                    </div>
                </CardHeader>
                <CardContent>
                    {recent_attendance.length === 0 ? (
                        <div className="text-sm text-gray-500">
                            لا توجد سجلات حضور حتى الآن.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border px-3 py-2 text-right">#</th>
                                        <th className="border px-3 py-2 text-right">الحلقة</th>
                                        <th className="border px-3 py-2 text-right">التاريخ</th>
                                        <th className="border px-3 py-2 text-right">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_attendance.map((row, idx) => (
                                        <tr key={row.id}>
                                            <td className="border px-3 py-1">{idx + 1}</td>
                                            <td className="border px-3 py-1">
                                                {row.circle?.name || "—"}
                                            </td>
                                            <td className="border px-3 py-1">
                                                {row.date}
                                            </td>
                                            <td className="border px-3 py-1">
                                                {row.status === "present"
                                                    ? "حاضر"
                                                    : row.status === "absent"
                                                        ? "غائب"
                                                        : row.status === "late"
                                                            ? "متأخّر"
                                                            : row.status === "excused"
                                                                ? "مُعذَر"
                                                                : row.status}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* جدول آخر التقييمات */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="text-sm font-semibold">آخر التقييمات</div>
                    <div className="text-xs text-gray-500 mt-1">
                        آخر 10 تقييمات مسجّلة للطالب
                    </div>
                </CardHeader>
                <CardContent>
                    {recent_assessments.length === 0 ? (
                        <div className="text-sm text-gray-500">
                            لا توجد تقييمات مسجّلة حتى الآن.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border px-3 py-2 text-right">#</th>
                                        <th className="border px-3 py-2 text-right">التاريخ</th>
                                        <th className="border px-3 py-2 text-right">الحلقة</th>
                                        <th className="border px-3 py-2 text-right">النوع</th>
                                        <th className="border px-3 py-2 text-right">الدرجة</th>
                                        <th className="border px-3 py-2 text-right">التقدير</th>
                                        <th className="border px-3 py-2 text-right">المعلّم</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_assessments.map((row, idx) => {
                                        const teacherName =
                                            row.teacher?.full_name ||
                                            row.teacher?.name ||
                                            "—"

                                        const scoreText =
                                            row.score != null && row.max_score != null
                                                ? `${row.score} / ${row.max_score}`
                                                : row.score != null
                                                    ? String(row.score)
                                                    : "—"

                                        return (
                                            <tr key={row.id}>
                                                <td className="border px-3 py-1">{idx + 1}</td>
                                                <td className="border px-3 py-1">{row.date}</td>
                                                <td className="border px-3 py-1">
                                                    {row.circle?.name || "—"}
                                                </td>
                                                <td className="border px-3 py-1">
                                                    {row.type || "—"}
                                                </td>
                                                <td className="border px-3 py-1">{scoreText}</td>
                                                <td className="border px-3 py-1">
                                                    {row.grade || "—"}
                                                </td>
                                                <td className="border px-3 py-1">{teacherName}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
