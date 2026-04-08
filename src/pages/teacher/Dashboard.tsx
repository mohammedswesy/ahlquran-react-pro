import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    listMyStats,
    listMyRecentActivity,
    type TeacherStats,
    type ActivityEntry,
} from "@/services/dashboard"
import { listMyCircles, type TeacherCircle } from "@/services/circles"
import {
    PiUsersThreeBold,
    PiBookOpenTextBold,
    PiCalendarCheckBold,
    PiNotePencilBold,
    PiClipboardTextBold,
    PiBuildingsBold,
    PiArrowLeftBold,
    PiClockCountdownBold,
    PiCheckCircleBold,
    PiWarningCircleBold,
} from "react-icons/pi"

// ─── Brand tokens ────────────────────────────────────────────
const P = "#003d35"
const SURFACE = "rgba(254,254,254,0.98)"

// ─── Shared Skeleton primitive ───────────────────────────────
function Pulse({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
        />
    )
}

// ─── KPI card skeleton ────────────────────────────────────────
function StatSkeleton() {
    return (
        <div
            className="rounded-2xl border p-5 space-y-3"
            style={{ background: SURFACE, borderColor: "var(--border)" }}
        >
            <Pulse className="h-4 w-24" />
            <Pulse className="h-9 w-16" />
            <Pulse className="h-3 w-20" />
        </div>
    )
}

// ─── Circle card skeleton ────────────────────────────────────
function CircleCardSkeleton() {
    return (
        <div
            className="rounded-2xl border p-5 space-y-3"
            style={{ background: SURFACE, borderColor: "var(--border)" }}
        >
            <Pulse className="h-5 w-32" />
            <Pulse className="h-3 w-24" />
            <Pulse className="h-3 w-16" />
            <Pulse className="h-9 w-full mt-2 rounded-xl" />
        </div>
    )
}

// ─── Activity skeleton ────────────────────────────────────────
function ActivitySkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                    <Pulse className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Pulse className="h-3 w-3/4" />
                        <Pulse className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Activity type config ─────────────────────────────────────
const ACTIVITY_CFG: Record<
    ActivityEntry["type"],
    { icon: React.ElementType; color: string; bg: string }
> = {
    attendance: { icon: PiCalendarCheckBold, color: "#059669", bg: "rgba(5,150,105,.1)" },
    memorization: { icon: PiBookOpenTextBold, color: P, bg: "rgba(0,61,53,.09)" },
    review: { icon: PiCheckCircleBold, color: "#7c3aed", bg: "rgba(124,58,237,.09)" },
    assessment: { icon: PiNotePencilBold, color: "#d97706", bg: "rgba(217,119,6,.1)" },
    general: { icon: PiClockCountdownBold, color: "#64748b", bg: "rgba(100,116,139,.09)" },
}

// ─── Format relative time (simple Arabic) ────────────────────
function relativeAr(dateStr: string): string {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const diffMs = Date.now() - d.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return "الآن"
    if (mins < 60) return `منذ ${mins} دقيقة`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `منذ ${hrs} ساعة`
    const days = Math.floor(hrs / 24)
    return `منذ ${days} يوم`
}

// ─── Default stats ────────────────────────────────────────────
const DEFAULT_STATS: TeacherStats = {
    total_students: 0,
    active_circles: 0,
    today_attendance_percent: 0,
    pending_exams: 0,
}

export default function TeacherDashboard() {
    const nav = useNavigate()

    const [stats, setStats] = useState<TeacherStats>(DEFAULT_STATS)
    const [circles, setCircles] = useState<TeacherCircle[]>([])
    const [activity, setActivity] = useState<ActivityEntry[]>([])

    const [loadingStats, setLoadingStats] = useState(true)
    const [loadingCircles, setLoadingCircles] = useState(true)
    const [loadingActivity, setLoadingActivity] = useState(true)

    useEffect(() => {
        listMyStats()
            .then((s) => setStats(s))
            .finally(() => setLoadingStats(false))

        listMyCircles()
            .then((c) => setCircles(c))
            .finally(() => setLoadingCircles(false))

        listMyRecentActivity()
            .then((a) => setActivity(a))
            .finally(() => setLoadingActivity(false))
    }, [])

    // ─── KPI config ───────────────────────────────────────────
    const kpiCards = [
        {
            label: "إجمالي الطلاب",
            value: stats.total_students,
            icon: <PiUsersThreeBold size={22} />,
            color: "#003d35",
            bg: "rgba(0,61,53,.09)",
        },
        {
            label: "الحلقات النشطة",
            value: stats.active_circles,
            icon: <PiBookOpenTextBold size={22} />,
            color: "#059669",
            bg: "rgba(5,150,105,.09)",
        },
        {
            label: "نسبة حضور اليوم",
            value: `${stats.today_attendance_percent}%`,
            icon: <PiCalendarCheckBold size={22} />,
            color: "#d97706",
            bg: "rgba(217,119,6,.09)",
        },
        {
            label: "الاختبارات المعلقة",
            value: stats.pending_exams,
            icon: <PiNotePencilBold size={22} />,
            color: "#dc2626",
            bg: "rgba(220,38,38,.09)",
        },
    ]

    return (
        <AppLayout>
            <Header
                title="لوحة المعلم"
                subtitle="مرحباً — تتبّع حلقاتك وطلابك من هنا"
                right={
                    <Button
                        size="sm"
                        onClick={() =>
                            nav(
                                circles.length
                                    ? `/teacher/attendance?circle_id=${circles[0].id}`
                                    : "/teacher/attendance",
                            )
                        }
                        style={{ background: P, color: "#fff" }}
                    >
                        <PiClipboardTextBold size={16} className="me-1" />
                        تسجيل حضور سريع
                    </Button>
                }
            />

            <div dir="rtl" className="p-5 space-y-6">

                {/* ── KPI Row ───────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {loadingStats
                        ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
                        : kpiCards.map((k) => (
                            <div
                                key={k.label}
                                className="rounded-2xl border p-5 flex flex-col gap-2 transition-shadow hover:shadow-lg"
                                style={{
                                    background: SURFACE,
                                    borderColor: "var(--border)",
                                    boxShadow: "var(--shadow2)",
                                }}
                            >
                                <div
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
                                    style={{ background: k.bg, color: k.color }}
                                >
                                    {k.icon}
                                </div>
                                <div
                                    className="text-3xl font-extrabold leading-none mt-1"
                                    style={{ color: k.color }}
                                >
                                    {k.value}
                                </div>
                                <div className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                                    {k.label}
                                </div>
                            </div>
                        ))}
                </div>

                {/* ── Main Grid ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── My Circles grid (2/3) ───────────────────── */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>حلقاتي</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 text-sm"
                                        style={{ color: P }}
                                        onClick={() => nav("/teacher/circles")}
                                    >
                                        عرض الكل
                                        <PiArrowLeftBold size={14} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {loadingCircles ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <CircleCardSkeleton key={i} />
                                        ))}
                                    </div>
                                ) : circles.length === 0 ? (
                                    <div
                                        className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-xl"
                                        style={{ background: "rgba(0,61,53,.04)" }}
                                    >
                                        <PiWarningCircleBold
                                            size={36}
                                            style={{ color: P, opacity: 0.4 }}
                                        />
                                        <p className="text-sm" style={{ color: "var(--muted)" }}>
                                            لا توجد حلقات مرتبطة بحسابك
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {circles.map((circle) => (
                                            <div
                                                key={circle.id}
                                                className="rounded-2xl border p-5 flex flex-col gap-3 transition-shadow hover:shadow-md"
                                                style={{
                                                    background: SURFACE,
                                                    borderColor: "var(--border)",
                                                }}
                                            >
                                                {/* Circle name + badge */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3
                                                        className="font-extrabold text-base leading-snug"
                                                        style={{ color: P }}
                                                    >
                                                        {circle.name}
                                                    </h3>
                                                    <span
                                                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                                                        style={{
                                                            background: "rgba(0,61,53,.09)",
                                                            color: P,
                                                        }}
                                                    >
                                                        نشطة
                                                    </span>
                                                </div>

                                                {/* Institute */}
                                                {circle.institute_name && (
                                                    <div
                                                        className="flex items-center gap-1.5 text-sm"
                                                        style={{ color: "var(--muted)" }}
                                                    >
                                                        <PiBuildingsBold size={14} />
                                                        {circle.institute_name}
                                                    </div>
                                                )}

                                                {/* Student count */}
                                                <div
                                                    className="flex items-center gap-1.5 text-sm font-semibold"
                                                    style={{ color: "var(--text)" }}
                                                >
                                                    <PiUsersThreeBold
                                                        size={14}
                                                        style={{ color: P }}
                                                    />
                                                    {circle.students_count ?? 0} طالب
                                                </div>

                                                {/* Quick Attendance CTA */}
                                                <Button
                                                    className="w-full mt-1 gap-2 font-bold"
                                                    size="sm"
                                                    style={{ background: P, color: "#fff" }}
                                                    onClick={() =>
                                                        nav(
                                                            `/teacher/attendance?circle_id=${circle.id}`,
                                                        )
                                                    }
                                                >
                                                    <PiClipboardTextBold size={15} />
                                                    تسجيل الحضور
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Recent Activity feed (1/3) ───────────────── */}
                    <div>
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>النشاط الأخير</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {loadingActivity ? (
                                    <ActivitySkeleton />
                                ) : activity.length === 0 ? (
                                    <div
                                        className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-xl"
                                        style={{ background: "rgba(0,61,53,.04)" }}
                                    >
                                        <PiClockCountdownBold
                                            size={32}
                                            style={{ color: P, opacity: 0.35 }}
                                        />
                                        <p className="text-sm" style={{ color: "var(--muted)" }}>
                                            لا يوجد نشاط حديث
                                        </p>
                                    </div>
                                ) : (
                                    <ol
                                        className="relative border-s-2"
                                        style={{ borderColor: "var(--border)" }}
                                    >
                                        {activity.map((item, idx) => {
                                            const cfg =
                                                ACTIVITY_CFG[item.type] ?? ACTIVITY_CFG.general
                                            const Icon = cfg.icon
                                            return (
                                                <li key={item.id ?? idx} className="mb-5 ms-5">
                                                    <span
                                                        className="absolute -start-[18px] flex h-9 w-9 items-center justify-center rounded-full"
                                                        style={{
                                                            background: cfg.bg,
                                                            color: cfg.color,
                                                        }}
                                                    >
                                                        <Icon size={16} />
                                                    </span>
                                                    <p
                                                        className="text-sm font-semibold leading-snug"
                                                        style={{ color: "var(--text)" }}
                                                    >
                                                        {item.description || "—"}
                                                    </p>
                                                    {(item.student_name || item.circle_name) && (
                                                        <p
                                                            className="text-xs mt-0.5"
                                                            style={{ color: "var(--muted)" }}
                                                        >
                                                            {[item.student_name, item.circle_name]
                                                                .filter(Boolean)
                                                                .join(" · ")}
                                                        </p>
                                                    )}
                                                    <time
                                                        className="text-xs mt-1 block"
                                                        style={{
                                                            color: "var(--muted)",
                                                            opacity: 0.7,
                                                        }}
                                                    >
                                                        {relativeAr(item.date)}
                                                    </time>
                                                </li>
                                            )
                                        })}
                                    </ol>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
