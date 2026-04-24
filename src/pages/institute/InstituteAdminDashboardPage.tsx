import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import LoadingBar from "@/components/ui/loading-bar"
import {
    BookOpenCheck,
    CalendarCheck2,
    ClipboardCheck,
    GraduationCap,
    Layers3,
    ShieldCheck,
    UserRoundCheck,
    Users,
} from "lucide-react"
import {
    PiArrowClockwiseBold,
    PiArrowLeftBold,
    PiBookOpenTextBold,
    PiClipboardTextBold,
    PiNotePencilBold,
    PiUsersThreeBold,
} from "react-icons/pi"

import useDashboardStats from "@/hooks/useDashboardStats"
import { useAuth } from "@/store/auth"
import api from "@/services/api"

type DashboardCardStats = {
    teachers_count: number
    students_count: number
    active_circles_count: number
}

export default function InstituteAdminDashboardPage() {
    const nav = useNavigate()
    const { stats, loading, error, refresh } = useDashboardStats()
    const [cardStats, setCardStats] = useState<DashboardCardStats>({
        teachers_count: 0,
        students_count: 0,
        active_circles_count: 0,
    })
    const fallbackInstituteName = useAuth((s) => s.instituteName)
    const instituteName = stats.context.instituteName || fallbackInstituteName || "المعهد"

    const loadCardStats = async () => {
        try {
            const { data } = await api.get("/dashboard/stats")
            const root = data?.data ?? data ?? {}
            setCardStats({
                teachers_count: Number(root?.teachers_count ?? root?.teachers ?? 0),
                students_count: Number(root?.students_count ?? root?.students ?? 0),
                active_circles_count: Number(root?.active_circles_count ?? root?.circles ?? 0),
            })
        } catch {
            // fallback to existing dashboard hook values when dedicated stats endpoint fails
            setCardStats((prev) => ({
                ...prev,
                teachers_count: Number(stats.totals.teachers ?? 0),
                students_count: Number(stats.totals.students ?? 0),
                active_circles_count: Number(stats.totals.circles ?? 0),
            }))
        }
    }

    useEffect(() => {
        loadCardStats()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    useEffect(() => {
        if (!loading) {
            setCardStats((prev) => ({
                teachers_count: prev.teachers_count || Number(stats.totals.teachers ?? 0),
                students_count: prev.students_count || Number(stats.totals.students ?? 0),
                active_circles_count: prev.active_circles_count || Number(stats.totals.circles ?? 0),
            }))
        }
    }, [loading, stats])

    const kpis = useMemo(
        () => [
            {
                label: "إجمالي المعلمين",
                value: cardStats.teachers_count,
                icon: GraduationCap,
                tone: "sand",
                to: "/admin/teachers",
            },
            {
                label: "إجمالي الطلاب",
                value: cardStats.students_count,
                icon: Users,
                tone: "emerald",
                to: "/admin/students",
            },
            {
                label: "الحلقات النشطة",
                value: cardStats.active_circles_count,
                icon: Layers3,
                tone: "emerald",
                to: "/admin/circles",
            },
        ],
        [cardStats],
    )

    const modules = useMemo(
        () => [
            {
                title: "الحفظ والمراجعة",
                subtitle: "مستوى الإنجاز العام في برامج الحفظ والمراجعة",
                stat: `${Math.round(stats.modules.memorizationProgressPercent)}% إنجاز` ,
                icon: BookOpenCheck,
                to: "/admin/memorization-reports",
                accent: "emerald",
            },
            {
                title: "الحضور والغياب",
                subtitle: "نسبة حضور اليوم على مستوى المعهد",
                stat: `${Math.round(stats.modules.attendanceTodayPercent)}% حضور اليوم`,
                icon: CalendarCheck2,
                to: "/admin/attendance-reports",
                accent: "sand",
            },
            {
                title: "الاختبارات والتقييمات",
                subtitle: "متوسط نتائج التقييمات والاختبارات",
                stat: `${Math.round(stats.modules.evaluationsAveragePercent)}% متوسط الأداء`,
                icon: ClipboardCheck,
                to: "/admin/exam-reports",
                accent: "emerald",
            },
            {
                title: "مواظبة الموظفين",
                subtitle: "مؤشر التزام الفريق الإداري والموظفين",
                stat: `${Math.round(stats.modules.staffAttendancePercent)}% التزام الموظفين`,
                icon: ShieldCheck,
                to: "/admin/staff-attendance-reports",
                accent: "sand",
            },
        ],
        [stats],
    )

    const quickLinks = useMemo(
        () => [
            { label: "إدارة المعلمين", to: "/admin/teachers", icon: PiUsersThreeBold },
            { label: "إضافة موظف", to: "/admin/employees?create=1", icon: PiUsersThreeBold },
            { label: "سجل الحضور", to: "/admin/attendance/take", icon: PiClipboardTextBold },
            { label: "التقارير الشاملة", to: "/admin/reports", icon: PiNotePencilBold },
        ],
        [],
    )

    const cardTone = (tone: "emerald" | "sand") =>
        tone === "emerald"
            ? {
                border: "rgba(5, 150, 105, 0.18)",
                background: "linear-gradient(180deg, rgba(236, 253, 245, 0.95), rgba(255,255,255,0.98))",
                badge: "rgba(5, 150, 105, 0.12)",
                icon: "#047857",
                text: "#065f46",
            }
            : {
                border: "rgba(217, 119, 6, 0.18)",
                background: "linear-gradient(180deg, rgba(255, 251, 235, 0.96), rgba(255,255,255,0.98))",
                badge: "rgba(217, 119, 6, 0.12)",
                icon: "#b45309",
                text: "#92400e",
            }

    return (
        <AppLayout>
            <Header title={`لوحة ${instituteName}`} subtitle="إحصاءات المعهد وأدوات فريقك التعليمية" />

            <div className="p-4 sm:p-5 space-y-5" dir="rtl">
                <LoadingBar active={loading} />

                <section
                    className="relative overflow-hidden rounded-[28px] border px-5 py-6 sm:px-7 sm:py-7"
                    style={{
                        borderColor: "rgba(5, 150, 105, 0.15)",
                        background: "linear-gradient(135deg, rgba(6, 95, 70, 0.96), rgba(16, 185, 129, 0.86) 54%, rgba(245, 158, 11, 0.22))",
                        boxShadow: "0 22px 40px rgba(6, 95, 70, 0.18)",
                    }}
                >
                    <div className="absolute -left-12 top-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-amber-200/20 blur-2xl" />

                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3 max-w-3xl text-white">
                            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                                ملخص يومي مباشر من النظام التعليمي
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">إدارة الشؤون التعليمية - {instituteName}</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
                                    متابعة موحّدة للحضور، الحفظ والمراجعة، الاختبارات، وانضباط فريق العمل من لوحة واحدة سريعة.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                onClick={async () => {
                                    await refresh()
                                    await loadCardStats()
                                }}
                                className="gap-2 border-0 bg-white text-emerald-900 hover:bg-white/90"
                            >
                                <PiArrowClockwiseBold />
                                تحديث البيانات
                            </Button>
                            <Link to="/admin/reports">
                                <Button size="sm" variant="outline" className="gap-2 border-white/30 bg-transparent text-white hover:bg-white/10">
                                    الانتقال للتقارير
                                    <PiArrowLeftBold />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {loading
                        ? [1, 2, 3].map((item) => (
                            <Card key={item} className="overflow-hidden border-0 shadow-sm">
                                <CardContent className="space-y-4 pt-6">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-12 w-12 rounded-2xl" />
                                    </div>
                                    <Skeleton className="h-8 w-28" />
                                    <Skeleton className="h-3 w-32" />
                                </CardContent>
                            </Card>
                        ))
                        : kpis.map((item) => {
                            const tone = cardTone(item.tone as "emerald" | "sand")
                            const Icon = item.icon

                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => nav(item.to)}
                                    className="text-right"
                                >
                                    <Card
                                        className="overflow-hidden rounded-3xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                                        style={{
                                            borderColor: tone.border,
                                            background: tone.background,
                                        }}
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="text-sm font-semibold" style={{ color: tone.text }}>{item.label}</div>
                                                    <div className="mt-3 text-3xl font-black tracking-tight" style={{ color: tone.text }}>
                                                        {Number(item.value || 0).toLocaleString("ar-SA")}
                                                    </div>
                                                </div>
                                                <div className="rounded-2xl p-3" style={{ background: tone.badge, color: tone.icon }}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </button>
                            )
                        })}
                </div>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-[var(--text)]">الوحدات التعليمية</h2>
                            <p className="text-sm text-[var(--muted)]">بطاقات تنفيذية سريعة للوصول إلى أهم ملفات المتابعة اليومية.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {loading
                            ? [1, 2, 3, 4].map((item) => (
                                <Card key={item} className="rounded-3xl border border-[var(--border)]">
                                    <CardContent className="space-y-4 pt-6">
                                        <Skeleton className="h-12 w-12 rounded-2xl" />
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-28" />
                                    </CardContent>
                                </Card>
                            ))
                            : modules.map((module) => {
                                const Icon = module.icon
                                const tone = cardTone(module.accent as "emerald" | "sand")

                                return (
                                    <Link
                                        key={module.title}
                                        to={module.to}
                                        className="block text-right"
                                    >
                                        <Card
                                            className="group h-full rounded-3xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                                            style={{
                                                borderColor: tone.border,
                                                background: tone.background,
                                            }}
                                        >
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-3">
                                                        <div className="rounded-2xl p-3 w-fit" style={{ background: tone.badge, color: tone.icon }}>
                                                            <Icon className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black" style={{ color: tone.text }}>{module.title}</h3>
                                                            <p className="mt-2 text-sm leading-6 text-slate-600">{module.subtitle}</p>
                                                        </div>
                                                    </div>
                                                    <PiArrowLeftBold className="mt-1 text-slate-400 transition-transform group-hover:-translate-x-1" />
                                                </div>
                                                <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
                                                    <span className="text-sm font-bold" style={{ color: tone.text }}>{module.stat}</span>
                                                    <span className="text-xs text-slate-500">فتح الوحدة</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                )
                            })}
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_.9fr]">
                    <Card className="rounded-3xl border border-emerald-200/60 bg-white/95">
                        <CardHeader>
                            <CardTitle>المؤشرات السريعة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {[1, 2, 3].map((item) => <Skeleton key={item} className="h-24 w-full rounded-2xl" />)}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {quickLinks.map((item) => (
                                        <Link
                                            key={item.label}
                                            to={item.to}
                                            className="rounded-2xl border border-[var(--border)] px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className="text-lg text-emerald-700" />
                                                <span className="font-semibold text-[var(--text)]">{item.label}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border border-amber-200/60 bg-white/95">
                        <CardHeader>
                            <CardTitle>بطاقة اليوم</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-12 w-28" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-4xl font-black text-emerald-800">
                                        {Math.round(stats.modules.attendanceTodayPercent)}%
                                    </div>
                                    <p className="text-sm leading-7 text-slate-600">
                                        نسبة الحضور اليومية الحالية. يمكنك التوجه مباشرة إلى سجلات الحضور أو متابعة الموظفين لمعالجة أي تراجع في الانضباط.
                                    </p>
                                    <div className="h-3 overflow-hidden rounded-full bg-amber-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-amber-500"
                                            style={{ width: `${Math.max(0, Math.min(100, stats.modules.attendanceTodayPercent))}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
}
