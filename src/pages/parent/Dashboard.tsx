import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/ui/datatable"
import { toast } from "sonner"
import api from "@/services/api"

import { PiUsersThreeBold, PiBellRingingBold, PiCalendarCheckBold } from "react-icons/pi"
import type { ColumnDef } from "@tanstack/react-table"

/* ================= Types ================= */
type AttendanceRow = {
    date: string
    child: string
    circle?: string | null
    status: string
}

type AssessmentRow = {
    date: string
    child: string
    kind?: string
    title?: string | null
    score?: number | null
    grade?: string | null
}

export default function ParentDashboard() {
    const [loading, setLoading] = useState(true)

    const [totals, setTotals] = useState({
        children: 0,
        unread_notifications: 0,
        upcoming_sessions: 0,
    })

    const [recentAttendance, setRecentAttendance] = useState<AttendanceRow[]>([])
    const [recentAssessments, setRecentAssessments] = useState<AssessmentRow[]>([])

    /* ================= Load data ================= */
    useEffect(() => {
        ; (async () => {
            setLoading(true)
            try {
                const [childrenRes, reportsRes, notificationsRes] = await Promise.all([
                    api.get("/parent/children"),
                    api.get("/parent/reports"),
                    api.get("/parent/notifications"),
                ])

                const children = Array.isArray(childrenRes.data) ? childrenRes.data : []
                const reports = Array.isArray(reportsRes.data) ? reportsRes.data : []
                const notifications = Array.isArray(notificationsRes.data) ? notificationsRes.data : []

                setTotals({
                    children: children.length,
                    unread_notifications: notifications.filter((n: any) => !n.read_at).length,
                    upcoming_sessions: 0, // جاهز لاحقًا
                })

                // حضور (اختصرناه من التقارير)
                setRecentAttendance(
                    reports.slice(0, 5).map((r: any) => ({
                        date: String(r.date ?? ""),
                        child: String(r.student_name ?? r.child ?? ""),
                        circle: r.circle_name ?? null,
                        status: String(r.status ?? "—"),
                    }))
                )

                // تقييمات (لو موجودة)
                setRecentAssessments(
                    reports.slice(0, 5).map((r: any) => ({
                        date: String(r.created_at ?? r.date ?? ""),
                        child: String(r.student_name ?? ""),
                        kind: r.kind ?? "—",
                        title: r.title ?? null,
                        score: r.score ?? null,
                        grade: r.grade ?? null,
                    }))
                )
            } catch (e) {
                toast.error("فشل تحميل لوحة وليّ الأمر")
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    /* ================= Columns ================= */
    const attendanceColumns = useMemo<ColumnDef<AttendanceRow>[]>(() => [
        { id: "date", accessorKey: "date", header: "التاريخ" },
        { id: "child", accessorKey: "child", header: "الابن" },
        { id: "circle", accessorKey: "circle", header: "الحلقة" },
        { id: "status", accessorKey: "status", header: "الحالة" },
    ], [])

    const assessmentColumns = useMemo<ColumnDef<AssessmentRow>[]>(() => [
        { id: "date", accessorKey: "date", header: "التاريخ" },
        { id: "child", accessorKey: "child", header: "الابن" },
        { id: "kind", accessorKey: "kind", header: "النوع" },
        { id: "title", accessorKey: "title", header: "العنوان" },
        { id: "score", accessorKey: "score", header: "الدرجة" },
        { id: "grade", accessorKey: "grade", header: "التقدير" },
    ], [])

    /* ================= UI ================= */
    return (
        <AppLayout>
            <Header title="لوحة وليّ الأمر" />
            <div className="space-y-6" dir="rtl">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-extrabold text-[var(--text)]">لوحة وليّ الأمر</h1>
                    <div className="flex gap-2">
                        <Link to="/parent/children"><Button variant="outline">أبنائي</Button></Link>
                        <Link to="/parent/reports"><Button variant="outline">التقارير</Button></Link>
                    </div>
                </div>

                {/* ===== Cards ===== */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: "عدد الأبناء", value: totals.children, Icon: PiUsersThreeBold },
                        { title: "إشعارات غير مقروءة", value: totals.unread_notifications, Icon: PiBellRingingBold },
                        { title: "حصص قادمة", value: totals.upcoming_sessions, Icon: PiCalendarCheckBold },
                    ].map((s, i) => (
                        <Card key={i}>
                            <CardHeader className="flex items-center justify-between">
                                <span className="text-sm text-[var(--muted)]">{s.title}</span>
                                <s.Icon size={18} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold">{s.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ===== Attendance ===== */}
                <Card>
                    <CardHeader className="font-bold">آخر حضور / غياب</CardHeader>
                    <CardContent>
                        <DataTable
                            data={recentAttendance}
                            columns={attendanceColumns}
                            isLoading={loading}
                            searchKey="child"
                        />
                    </CardContent>
                </Card>

                {/* ===== Assessments ===== */}
                <Card>
                    <CardHeader className="font-bold">آخر التقييمات</CardHeader>
                    <CardContent>
                        <DataTable
                            data={recentAssessments}
                            columns={assessmentColumns}
                            isLoading={loading}
                            searchKey="child"
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
