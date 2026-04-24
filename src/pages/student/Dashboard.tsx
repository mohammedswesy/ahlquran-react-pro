import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    PiArrowLeftBold,
    PiCertificateBold,
    PiChartDonutBold,
    PiClockCountdownBold,
    PiExamBold,
    PiStudentBold,
} from "react-icons/pi"
import {
    getStudentAttendanceSummary,
    getStudentExams,
    getStudentProfile,
    type StudentAttendanceSummary,
    type StudentExam,
    type StudentProfile,
} from "@/services/studentService"
import { getCircleTrackColor } from "@/lib/circleTracks"
import { useAuth } from "@/store/auth"

function AttendanceBar({ present, absent }: { present: number; absent: number }) {
    const total = Math.max(1, present + absent)
    const presentWidth = `${Math.round((present / total) * 100)}%`
    const absentWidth = `${Math.round((absent / total) * 100)}%`

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
                <span>حضور</span>
                <span>غياب</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full" style={{ background: "rgba(0,61,53,.08)" }}>
                <div style={{ width: presentWidth, background: "#16a34a" }} />
                <div style={{ width: absentWidth, background: "#dc2626" }} />
            </div>
        </div>
    )
}

export default function StudentDashboard() {
    const instituteName = useAuth((s) => s.instituteName)
    const brandName = useAuth((s) => s.brandName)
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<StudentProfile | null>(null)
    const [attendance, setAttendance] = useState<StudentAttendanceSummary | null>(null)
    const [exams, setExams] = useState<StudentExam[]>([])

    useEffect(() => {
        ; (async () => {
            setLoading(true)
            try {
                const [profileData, attendanceData, examsData] = await Promise.all([
                    getStudentProfile(),
                    getStudentAttendanceSummary(),
                    getStudentExams(),
                ])
                setProfile(profileData)
                setAttendance(attendanceData)
                setExams(examsData)
            } catch (error: any) {
                toast.error(error?.response?.data?.message || "تعذر تحميل بوابة الطالب")
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const latestExam = exams[0] ?? null
    const trackColor = useMemo(() => getCircleTrackColor(profile?.track), [profile?.track])
    const presentCount = attendance?.present ?? 0
    const absentCount = (attendance?.absent ?? 0) + (attendance?.late ?? 0)

    return (
        <AppLayout>
            <div dir="rtl" className="space-y-6">
                <Header title="بوابة الطالب" subtitle="واجهة مبسطة لمتابعة المسار والنتائج والحضور" />

                <Card className="overflow-hidden border-0">
                    <CardContent className="relative px-5 py-6 sm:px-8 sm:py-8">
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    "radial-gradient(circle at top right, rgba(220,203,160,.45), transparent 28%), linear-gradient(135deg, #003d35 0%, #0b5b50 70%, #0e7467 100%)",
                            }}
                        />
                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white/90" style={{ background: "rgba(255,255,255,.12)" }}>
                                    <PiStudentBold size={16} />
                                    {instituteName || brandName}
                                </div>
                                {loading ? (
                                    <div className="space-y-3">
                                        <Skeleton className="h-8 w-72 bg-white/20" />
                                        <Skeleton className="h-4 w-64 bg-white/15" />
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl">
                                            مرحباً بك {profile?.name || "بك"} في {profile?.institute_name || instituteName || brandName}
                                        </h1>
                                        <p className="mt-3 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
                                            تابع تقدمك الدراسي ونتائجك وشهاداتك اليومية من واجهة مصممة لتكون واضحة وسريعة على الهاتف والكمبيوتر.
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                                <div className="rounded-3xl border px-4 py-4 text-white" style={{ background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.12)" }}>
                                    <div className="text-xs text-white/70">الحلقة الحالية</div>
                                    <div className="mt-2 text-base font-bold">{loading ? "..." : profile?.circle_name || "غير محددة"}</div>
                                </div>
                                <div className="rounded-3xl border px-4 py-4 text-white" style={{ background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.12)" }}>
                                    <div className="text-xs text-white/70">المعهد</div>
                                    <div className="mt-2 text-base font-bold">{loading ? "..." : profile?.institute_name || instituteName || brandName}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <Card className="xl:col-span-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <PiChartDonutBold size={18} />
                                المسار الحالي
                            </CardTitle>
                            <CardDescription>المشروع التعليمي الذي تتابع فيه حالياً</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-8 w-32" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            ) : (
                                <>
                                    <Badge
                                        className="w-fit"
                                        style={{
                                            background: trackColor.background,
                                            borderColor: trackColor.border,
                                            color: trackColor.text,
                                        }}
                                    >
                                        {profile?.track_name}
                                    </Badge>
                                    <div className="text-sm leading-7" style={{ color: "var(--text)" }}>
                                        {profile?.track_description || "سيظهر وصف المسار هنا عند توفره من النظام."}
                                    </div>
                                    {profile?.level && (
                                        <div className="rounded-2xl px-3 py-3 text-sm" style={{ background: "rgba(0,61,53,.05)", color: "var(--text)" }}>
                                            المستوى الحالي: <span className="font-bold">{profile.level}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <PiClockCountdownBold size={18} />
                                ملخص الحضور
                            </CardTitle>
                            <CardDescription>نسبة الالتزام بالحضور مقابل الغياب</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading || !attendance ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-xs" style={{ color: "var(--muted)" }}>الالتزام العام</div>
                                            <div className="text-3xl font-black" style={{ color: "#15803d" }}>
                                                {Math.round(attendance.presence_percent)}%
                                            </div>
                                        </div>
                                        <div className="text-left text-sm" style={{ color: "var(--muted)" }}>
                                            <div>حضور: {attendance.present}</div>
                                            <div>غياب: {attendance.absent}</div>
                                            <div>تأخر: {attendance.late}</div>
                                        </div>
                                    </div>
                                    <AttendanceBar present={presentCount} absent={absentCount} />
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <PiExamBold size={18} />
                                نتيجة سريعة
                            </CardTitle>
                            <CardDescription>آخر اختبار تم تسجيله لك</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-6 w-36" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : latestExam ? (
                                <>
                                    <div>
                                        <div className="font-bold" style={{ color: "var(--text)" }}>{latestExam.exam_name}</div>
                                        <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                                            {latestExam.exam_date ? new Date(latestExam.exam_date).toLocaleDateString("ar-SA") : "بدون تاريخ"}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl p-4" style={{ background: latestExam.result === "passed" ? "rgba(22,163,74,.08)" : "rgba(220,38,38,.08)" }}>
                                        <div className="text-xs" style={{ color: "var(--muted)" }}>الدرجة</div>
                                        <div className="mt-2 text-3xl font-black" style={{ color: latestExam.result === "passed" ? "#15803d" : "#b91c1c" }}>
                                            {latestExam.score}/{latestExam.max_score}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm leading-7" style={{ color: "var(--muted)" }}>
                                    لا توجد نتائج اختبارات بعد. ستظهر هنا أول نتيجة يتم اعتمادها.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">اختصارات سريعة</CardTitle>
                            <CardDescription>وصول مباشر إلى أكثر الصفحات استخداماً</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            <Link to="/student/exams">
                                <div className="rounded-2xl border p-4 transition hover:shadow-md" style={{ borderColor: "var(--border)" }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold" style={{ color: "var(--text)" }}>اختباراتي وشهاداتي</div>
                                            <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>اطلع على النتائج وحمّل الشهادات</div>
                                        </div>
                                        <PiCertificateBold size={20} style={{ color: "var(--brand)" }} />
                                    </div>
                                </div>
                            </Link>

                            <Link to="/student/attendance">
                                <div className="rounded-2xl border p-4 transition hover:shadow-md" style={{ borderColor: "var(--border)" }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold" style={{ color: "var(--text)" }}>سجل حضوري</div>
                                            <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>راجع التزامك اليومي بالتفصيل</div>
                                        </div>
                                        <PiArrowLeftBold size={18} style={{ color: "var(--brand)" }} />
                                    </div>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">صورة سريعة</CardTitle>
                            <CardDescription>ملخص مناسب للعرض على الهاتف لولي الأمر أو الطالب</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "rgba(0,61,53,.05)" }}>
                                <span style={{ color: "var(--muted)" }}>آخر اختبار</span>
                                <span className="font-bold" style={{ color: "var(--text)" }}>{latestExam?.exam_name || "لا يوجد"}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "rgba(0,61,53,.05)" }}>
                                <span style={{ color: "var(--muted)" }}>المسار</span>
                                <span className="font-bold" style={{ color: "var(--text)" }}>{profile?.track_name || "غير محدد"}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "rgba(0,61,53,.05)" }}>
                                <span style={{ color: "var(--muted)" }}>الحضور</span>
                                <span className="font-bold" style={{ color: "var(--text)" }}>{attendance ? `${Math.round(attendance.presence_percent)}%` : "—"}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="pb-6 text-center text-xs" style={{ color: "var(--muted)" }}>
                    معاهد الخليل لتعليم القرآن الكريم
                </div>
            </div>
        </AppLayout>
    )
}
