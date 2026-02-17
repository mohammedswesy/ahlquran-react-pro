import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/ui/datatable"
import { toast } from "sonner"
import {
    fetchStudentDashboard,
    type StudentDashboardResponse,
    type StudentAttendanceRow,
} from "@/services/students"
import { PiBookOpenTextBold, PiCalendarCheckBold, PiTrophyBold } from "react-icons/pi"

export default function StudentDashboard() {
    const [loading, setLoading] = useState(true)
    const [totals, setTotals] = useState<StudentDashboardResponse["totals"]>({})
    const [recentAttendance, setRecentAttendance] = useState<StudentAttendanceRow[]>([])
    const [recentAssessments, setRecentAssessments] = useState<StudentDashboardResponse["recentAssessments"]>([])

    useEffect(() => {
        (async () => {
            setLoading(true)
            try {
                const res = await fetchStudentDashboard()
                setTotals(res.totals || {})
                setRecentAttendance(res.recentAttendance || [])
                setRecentAssessments(res.recentAssessments || [])
            } catch (e: any) {
                toast.info("سيتم ربط لوحة الطالب حال تجهيز الـ API")
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const attendanceCols = useMemo(
        () => [
            { key: "date", label: "التاريخ" },
            { key: "circle", label: "الحلقة" },
            { key: "status", label: "الحالة" },
        ],
        []
    )

    const assessmentCols = useMemo(
        () => [
            { key: "date", label: "التاريخ" },
            { key: "kind", label: "النوع" },
            { key: "title", label: "العنوان" },
            { key: "score", label: "الدرجة" },
            { key: "grade", label: "التقدير" },
        ],
        []
    )

    return (
        <AppLayout>
            <Header />
            <div className="space-y-6" dir="rtl">
                {/* عنوان وروابط سريعة */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-extrabold text-gray-800">لوحة الطالب</h1>
                    <div className="flex gap-2">
                        <Link to="/student/progress"><Button variant="outline">تقدّمي</Button></Link>
                        <Link to="/student/schedule"><Button variant="outline">جدولي</Button></Link>
                    </div>
                </div>

                {/* بطاقات سريعة */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: "عدد الحلقات", value: totals?.circles ?? "—", Icon: PiBookOpenTextBold },
                        { title: "نسبة الحضور", value: totals?.attendance_rate != null ? `${totals.attendance_rate}%` : "—", Icon: PiCalendarCheckBold },
                        { title: "عدد التقييمات", value: totals?.assessments_count ?? "—", Icon: PiTrophyBold },
                        { title: "أيام حضور/غياب", value: `${totals?.present_days ?? 0} / ${totals?.absent_days ?? 0}`, Icon: PiCalendarCheckBold },
                    ].map((s, i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">{s.title}</div>
                                <s.Icon className="text-[var(--primary)]" size={18} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold">{s.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* آخر حضور/غياب */}
                <Card>
                    <CardHeader className="font-bold">آخر حضور/غياب</CardHeader>
                    <CardContent>
                        <DataTable data={recentAttendance} columns={attendanceCols as any} isLoading={loading} />
                    </CardContent>
                </Card>

                {/* آخر التقييمات */}
                <Card>
                    <CardHeader className="font-bold">آخر التقييمات</CardHeader>
                    <CardContent>
                        <DataTable data={recentAssessments as any[]} columns={assessmentCols as any} isLoading={loading} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
