import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/ui/datatable"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
    fetchTeacherDashboard,
    type TeacherDashboard,
    type TeacherAttendancePoint,
} from "@/services/dashboard"
import { PiUsersThreeBold, PiBookOpenTextBold, PiSquaresFourBold } from "react-icons/pi"

type TeacherAssessmentPoint = {
    date: string
    circle: string
    kind?: string | null
    title?: string | null
    avg_score?: number | null
}

// ✅ ألوان الهوية المعتمدة
const BRAND = {
    primary: "#003d35",
    secondary: "#dccba0",
    white: "#fefefe",
}

export default function TeacherDashboard() {
    const [stats, setStats] = useState<TeacherDashboard["totals"]>({ circles: 0, students: 0 })
    const [recentAttendance, setRecentAttendance] = useState<TeacherAttendancePoint[]>([])
    const [recentAssessments, setRecentAssessments] = useState<TeacherAssessmentPoint[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        ; (async () => {
            setLoading(true)
            try {
                const res = await fetchTeacherDashboard()
                const totals = (res as any)?.totals ?? { circles: 0, students: 0 }
                const att = (res as any)?.recentAttendance ?? (res as any)?.attendance_recent ?? []
                const asses = (res as any)?.recentAssessments ?? (res as any)?.assessments_recent ?? []

                setStats(totals)
                setRecentAttendance(Array.isArray(att) ? att : [])
                setRecentAssessments(
                    (Array.isArray(asses) ? asses : []).map((a: any) => ({
                        date: String(a?.date ?? a?.day ?? ""),
                        circle: String(a?.circle ?? a?.circle_name ?? a?.class ?? ""),
                        kind: a?.kind ?? a?.type ?? null,
                        title: a?.title ?? null,
                        avg_score: a?.avg_score ?? a?.average ?? null,
                    }))
                )
            } catch {
                toast.info("سيتم ربط إحصاءات لوحة المعلم حال تجهيز الـ API")
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    // ✅ ملاحظة: DataTable عندك يطلب ColumnDef غالبًا (مش key/label)
    // إذا اشتغل معك key/label تمام. إذا رجع نفس خطأ tanstack، خبرني وبعطيك ColumnDef جاهز.
    const colsAttendance = useMemo(
        () => [
            { key: "date", label: "التاريخ" },
            { key: "circle", label: "الحلقة" },
            { key: "present", label: "حاضر" },
            { key: "absent", label: "غائب" },
            { key: "late", label: "متأخر" },
            { key: "excused", label: "مُعذَّر" },
        ],
        []
    )

    const colsAssessments = useMemo(
        () => [
            { key: "date", label: "التاريخ" },
            { key: "circle", label: "الحلقة" },
            { key: "kind", label: "النوع" },
            { key: "title", label: "العنوان" },
            { key: "avg_score", label: "متوسط الدرجة" },
        ],
        []
    )

    const softCardStyle: React.CSSProperties = {
        background: BRAND.white,
        border: "1px solid rgba(0,61,53,.14)",
        boxShadow: "0 10px 30px rgba(0,0,0,.06)",
        borderRadius: 24,
    }

    const bigLinkBase: React.CSSProperties = {
        borderRadius: 24,
        padding: 20,
        color: BRAND.white,
        transition: "all .2s ease",
        boxShadow: "0 14px 34px rgba(0,0,0,.10)",
    }

    return (
        <AppLayout>
            <Header />

            <div className="space-y-6" dir="rtl">
                {/* العنوان + أكشنز */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-extrabold" style={{ color: BRAND.primary }}>
                        لوحة المعلم
                    </h1>

                    <div className="flex gap-2">
                        <Link to="/teacher/circles">
                            <Button variant="outline">حلقاتي</Button>
                        </Link>
                        <Link to="/teacher/attendance">
                            <Button variant="outline">تسجيل الحضور</Button>
                        </Link>
                        <Link to="/teacher/memorization">
                            <Button variant="outline">تسجيل الحفظ</Button>
                        </Link>
                        <Link to="/teacher/assessments">
                            <Button variant="outline">التقييمات</Button>
                        </Link>
                    </div>
                </div>

                {/* بطاقات سريعة */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: "حلقاتي", value: stats.circles, Icon: PiBookOpenTextBold },
                        { title: "طلابـي", value: stats.students, Icon: PiUsersThreeBold },
                        { title: "لوحاتي", value: "روابط سريعة", Icon: PiSquaresFourBold },
                    ].map((s, i) => (
                        <Card key={i} className="overflow-hidden" style={softCardStyle}>
                            <CardHeader className="flex items-center justify-between">
                                <div className="text-sm" style={{ color: "rgba(0,61,53,.75)" }}>
                                    {s.title}
                                </div>
                                <s.Icon style={{ color: BRAND.primary }} size={18} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold" style={{ color: BRAND.primary }}>
                                    {s.value}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* روابط كبسات كبيرة */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/teacher/circles" className="block">
                        <div
                            style={{
                                ...bigLinkBase,
                                background: BRAND.secondary,
                                color: BRAND.primary,
                            }}
                            className="hover:scale-[1.01]"
                        >
                            <div className="text-lg font-extrabold">حلقاتي</div>
                            <div className="text-sm opacity-90">عرض وإدارة الحلقات</div>
                        </div>
                    </Link>

                    <Link to="/teacher/attendance" className="block">
                        <div
                            style={{
                                ...bigLinkBase,
                                background: BRAND.primary,
                            }}
                            className="hover:scale-[1.01]"
                        >
                            <div className="text-lg font-extrabold">تسجيل الحضور</div>
                            <div className="text-sm opacity-90">تسجيل الحضور/الغياب اليومي</div>
                        </div>
                    </Link>

                    <Link to="/teacher/memorization" className="block">
                        <div
                            style={{
                                ...bigLinkBase,
                                background: "linear-gradient(135deg, rgba(0,61,53,1), rgba(0,61,53,.85))",
                            }}
                            className="hover:scale-[1.01]"
                        >
                            <div className="text-lg font-extrabold">تسجيل الحفظ</div>
                            <div className="text-sm opacity-90">إضافة وحفظ مقاطع الحفظ اليومية</div>
                        </div>
                    </Link>

                    <Link to="/teacher/assessments" className="block">
                        <div
                            style={{
                                ...bigLinkBase,
                                background: BRAND.secondary,
                                color: BRAND.primary,
                            }}
                            className="hover:scale-[1.01]"
                        >
                            <div className="text-lg font-extrabold">التقييمات</div>
                            <div className="text-sm opacity-90">إضافة/تحديث تقييمات الطلاب</div>
                        </div>
                    </Link>
                </div>

                {/* آخر حضور/غياب */}
                <Card style={softCardStyle}>
                    <CardHeader className="font-bold" style={{ color: BRAND.primary }}>
                        آخر حضور/غياب
                    </CardHeader>
                    <CardContent>
                        <DataTable data={recentAttendance} columns={colsAttendance as any} isLoading={loading} />
                    </CardContent>
                </Card>

                {/* آخر التقييمات */}
                <Card style={softCardStyle}>
                    <CardHeader className="font-bold" style={{ color: BRAND.primary }}>
                        آخر التقييمات
                    </CardHeader>
                    <CardContent>
                        <DataTable data={recentAssessments} columns={colsAssessments as any} isLoading={loading} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
