import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
    getMyProgress,
    getMyAttendance,
    getUpcomingExams,
    type StudentProgressItem,
    type StudentAttendanceSummary,
    type UpcomingExam,
} from "@/services/student"
import { PiCalendarCheckBold, PiWarningCircleBold, PiInfoBold } from "react-icons/pi"

export default function StudentDashboard() {
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState<StudentProgressItem[]>([])
    const [attendance, setAttendance] = useState<StudentAttendanceSummary>({
        total_days: 0,
        absences: 0,
        lates: 0,
        attendance_percent: 0,
    })
    const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([])

    useEffect(() => {
        (async () => {
            setLoading(true)
            try {
                const [p, a, e] = await Promise.all([
                    getMyProgress(),
                    getMyAttendance(),
                    getUpcomingExams(),
                ])
                setProgress(p)
                setAttendance(a)
                setUpcomingExams(e)
            } catch (e: any) {
                toast.info("تعذر تحميل بعض بيانات لوحة الطالب")
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const presentDays = useMemo(() => {
        const missed = attendance.absences + attendance.lates
        return Math.max(0, attendance.total_days - missed)
    }, [attendance])

    return (
        <AppLayout>
            <Header title="لوحة الطالب" subtitle="استمر في التقدم، إنجازك اليومي يصنع الفرق" />

            <div className="p-4 sm:p-5 space-y-5" dir="rtl">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#003d35" }}>رحلة تقدّمك القرآنية</h1>
                    <div className="flex gap-2">
                        <Link to="/student/progress"><Button variant="outline">تقدّمي</Button></Link>
                        <Link to="/student/schedule"><Button variant="outline">جدولي</Button></Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>آخر إنجازاتك</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : progress.length === 0 ? (
                                <div className="text-sm" style={{ color: "var(--muted)" }}>
                                    لا توجد سجلات جديدة حتى الآن. واصل تقدمك.
                                </div>
                            ) : (
                                <ol className="relative border-s-2" style={{ borderColor: "rgba(0,61,53,.2)" }}>
                                    {progress.map((item, index) => (
                                        <li key={`${item.id}-${index}`} className="mb-5 ms-4">
                                            <span className="absolute -start-[7px] mt-1 h-3 w-3 rounded-full" style={{ background: "#003d35" }} />
                                            <div className="font-semibold" style={{ color: "#003d35" }}>{item.title}</div>
                                            {item.details && (
                                                <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                                                    {item.details}
                                                </div>
                                            )}
                                            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                                                {item.date ? new Date(item.date).toLocaleDateString("ar-SA") : ""}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>الحضور</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-28 w-28 rounded-full mx-auto" />
                                    <Skeleton className="h-4 w-40 mx-auto" />
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="mx-auto h-28 w-28 rounded-full flex items-center justify-center"
                                        style={{
                                            background: `conic-gradient(#003d35 ${attendance.attendance_percent}%, rgba(0,61,53,.12) 0)`,
                                        }}
                                    >
                                        <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center font-extrabold" style={{ color: "#003d35" }}>
                                            {Math.round(attendance.attendance_percent)}%
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                                        <div className="rounded-lg p-2" style={{ background: "rgba(0,61,53,.06)" }}>
                                            <div style={{ color: "var(--muted)" }}>الإجمالي</div>
                                            <div className="font-bold">{attendance.total_days}</div>
                                        </div>
                                        <div className="rounded-lg p-2" style={{ background: "rgba(16,185,129,.1)" }}>
                                            <div style={{ color: "var(--muted)" }}>حضور</div>
                                            <div className="font-bold">{presentDays}</div>
                                        </div>
                                        <div className="rounded-lg p-2" style={{ background: "rgba(239,68,68,.1)" }}>
                                            <div style={{ color: "var(--muted)" }}>غياب/تأخر</div>
                                            <div className="font-bold">{attendance.absences + attendance.lates}</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>تنبيهات الاختبارات القادمة</CardTitle>
                        <PiCalendarCheckBold style={{ color: "#003d35" }} size={18} />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        ) : upcomingExams.length === 0 ? (
                            <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "rgba(16,185,129,.2)", background: "rgba(16,185,129,.08)", color: "#047857" }}>
                                <div className="font-semibold flex items-center gap-1"><PiInfoBold size={16} /> لا يوجد امتحانات قادمة</div>
                                <div className="mt-1">استمر في المراجعة اليومية للحفاظ على مستواك.</div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {upcomingExams.map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="rounded-xl border p-3"
                                        style={{ borderColor: "rgba(217,119,6,.2)", background: "rgba(217,119,6,.08)" }}
                                    >
                                        <div className="font-semibold flex items-center gap-1" style={{ color: "#92400e" }}>
                                            <PiWarningCircleBold size={16} />
                                            {exam.subject}
                                        </div>
                                        <div className="text-sm mt-1" style={{ color: "#78350f" }}>
                                            الموعد: {exam.date ? new Date(exam.date).toLocaleDateString("ar-SA") : "—"}
                                            {exam.type ? ` • ${exam.type}` : ""}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
