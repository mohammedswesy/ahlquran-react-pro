/**
 * Memorization & Review Reports Dashboard
 * 
 * Backend Requirements:
 * - Ensure these endpoints are accessible to admin users (not just teachers):
 *   • GET /api/circles - list all circles
 *   • GET /api/teacher/circles/{id}/memorization - fetch memorization records
 *   • GET /api/teacher/circles/{id}/reviews - fetch review records
 * 
 * - These endpoints may require admin-scoped versions if 403 errors occur:
 *   • GET /api/admin/circles/{id}/memorization (alternative)
 *   • GET /api/admin/circles/{id}/reviews (alternative)
 * 
 * - Backend must return data with these fields:
 *   • Memorization: id, student_id, circle_id, session_date, from_surah, to_surah, from_ayah, to_ayah, pages_count, evaluation
 *   • Reviews: id, student_id, session_date, pages_count, evaluation, range: { from_surah, to_surah, from_ayah, to_ayah }, student: { name }
 * 
 * Debug Tips: Press F12 in browser and check Console tab for [MemorizationReports] logs
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/datatable"
import EmptyState from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
    PieChart,
    Pie,
} from "recharts"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    BookOpen,
    Award,
    TrendingUp,
    Users,
    Eye,
    RefreshCw,
    BookMarked,
    ChevronLeft,
    FileText,
    Loader2,
} from "lucide-react"

import { listCircleMemorization } from "@/services/memorization"
import { listCircleReviews } from "@/services/reviews"
import { listCircles, type Circle } from "@/services/circles"
import { downloadStudentMonthlyReport } from "@/services/reports"

// === Types ===

type RecordType = "memorization" | "review"

type CombinedRecord = {
    id: string
    type: RecordType
    studentId: number | null
    studentName: string
    circleName: string
    circleId: number
    date: string
    fromSurah: number
    fromAyah: number
    toSurah: number
    toAyah: number
    pagesCount: number | null
    evaluation: number | string | null
    notes: string | null
}

// === Evaluation Config ===

type EvalConfig = {
    label: string
    color: string
    background: string
    border: string
    tailwind: string
    icon: string
    order: number
}

function getEvalConfig(evaluation: number | string | null | undefined): EvalConfig {
    const val = typeof evaluation === "string" ? evaluation.trim().toLowerCase() : evaluation
    if (val === 5 || val === "excellent" || val === "ممتاز")
        return { label: "ممتاز", color: "#15803d", background: "#dcfce7", border: "#86efac", tailwind: "text-green-700 bg-green-100 border-green-200", icon: "🌟", order: 5 }
    if (val === 4 || val === "very_good" || val === "جيد جداً" || val === "جيد جدا")
        return { label: "جيد جداً", color: "#1d4ed8", background: "#dbeafe", border: "#93c5fd", tailwind: "text-blue-700 bg-blue-100 border-blue-200", icon: "⭐", order: 4 }
    if (val === 3 || val === "good" || val === "جيد")
        return { label: "جيد", color: "#b45309", background: "#fef3c7", border: "#fde68a", tailwind: "text-amber-700 bg-amber-100 border-amber-200", icon: "👍", order: 3 }
    if (val === 2 || val === "fair" || val === "acceptable" || val === "مقبول")
        return { label: "مقبول", color: "#7c3aed", background: "#ede9fe", border: "#c4b5fd", tailwind: "text-violet-700 bg-violet-100 border-violet-200", icon: "🔷", order: 2 }
    if (val === 1 || val === "weak" || val === "ضعيف")
        return { label: "ضعيف", color: "#b91c1c", background: "#fee2e2", border: "#fca5a5", tailwind: "text-red-700 bg-red-100 border-red-200", icon: "⚠️", order: 1 }
    return { label: "—", color: "#6b7280", background: "#f3f4f6", border: "#d1d5db", tailwind: "text-gray-500 bg-gray-100 border-gray-200", icon: "—", order: 0 }
}

const EVAL_BAR_COLORS: Record<string, string> = {
    "ممتاز": "#16a34a",
    "جيد جداً": "#2563eb",
    "جيد": "#d97706",
    "مقبول": "#7c3aed",
    "ضعيف": "#dc2626",
    "—": "#9ca3af",
}

// === Radial Gauge ===

function RadialGauge({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
    const r = (size - 16) / 2
    const cx = size / 2
    const cy = size / 2
    const circ = 2 * Math.PI * r
    const dash = (pct / 100) * circ
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={9} />
            <circle
                cx={cx} cy={cy} r={r} fill="none"
                stroke={color} strokeWidth={9}
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
        </svg>
    )
}

// === Student Detail Modal ===

function StudentDetailModal({
    open, onClose, studentId, studentName, rows,
}: {
    open: boolean
    onClose: () => void
    studentId: number | null
    studentName: string
    rows: CombinedRecord[]
}) {
    const [reportMonth, setReportMonth] = useState(() => {
        const now = new Date()
        const month = String(now.getMonth() + 1).padStart(2, "0")
        return `${now.getFullYear()}-${month}`
    })
    const [generatingReport, setGeneratingReport] = useState(false)

    const studentRows = rows.filter((r) => r.studentId === studentId && studentId !== null)
    const memRows = studentRows.filter((r) => r.type === "memorization")
    const revRows = studentRows.filter((r) => r.type === "review")

    const onDownloadReport = async () => {
        if (!studentId) {
            toast.warning("معرّف الطالب غير متاح")
            return
        }
        if (!reportMonth) {
            toast.warning("اختر الشهر أولاً")
            return
        }

        setGeneratingReport(true)
        try {
            await downloadStudentMonthlyReport(reportMonth, studentId)
            toast.success("تم تجهيز التقرير وبدء التحميل")
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "فشل إنشاء التقرير")
        } finally {
            setGeneratingReport(false)
        }
    }

    function RecordCard({ r }: { r: CombinedRecord }) {
        const cfg = getEvalConfig(r.evaluation)
        const pct = r.pagesCount ? Math.min((r.pagesCount / 20) * 100, 100) : 0
        return (
            <div className="rounded-xl border p-3 space-y-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--muted)]">{r.date || "—"}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.tailwind}`}>
                        {cfg.icon} {cfg.label}
                    </span>
                </div>
                <div className="text-sm font-medium text-[var(--text)]">
                    س{r.fromSurah}:آ{r.fromAyah} ← س{r.toSurah}:آ{r.toAyah}
                    {r.pagesCount ? <span className="mr-2 text-xs text-[var(--muted)]">({r.pagesCount} صفحة)</span> : null}
                </div>
                {r.pagesCount != null && r.pagesCount > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                )}
                {r.notes && <p className="text-xs text-[var(--muted)] bg-gray-50 rounded-lg px-2 py-1">{r.notes}</p>}
            </div>
        )
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="تفاصيل الطالب"
            description={studentName !== "—" ? studentName : studentId ? `طالب #${studentId}` : ""}
            size="lg"
        >
            {studentRows.length === 0 ? (
                <EmptyState title="لا توجد سجلات" desc="لا توجد بيانات لهذا الطالب." />
            ) : (
                <div dir="rtl">
                    <div className="rounded-xl border p-3 mb-4" style={{ background: "rgba(248, 250, 252, 0.9)", borderColor: "var(--border)" }}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="text-sm font-bold text-[var(--text)]">تقرير PDF الشهري</div>
                                <div className="text-xs text-[var(--muted)] mt-0.5">اختر الشهر لتنزيل تقرير الطالب</div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="month"
                                    value={reportMonth}
                                    onChange={(event) => setReportMonth(event.target.value)}
                                    className="h-10 rounded-lg border px-3 text-sm"
                                    style={{ borderColor: "var(--border)" }}
                                />
                                <Button
                                    onClick={() => void onDownloadReport()}
                                    disabled={generatingReport || studentId === null}
                                    className="h-10 rounded-lg bg-sky-600 hover:bg-sky-700 text-white"
                                >
                                    {generatingReport ? <Loader2 size={14} className="ml-1 animate-spin" /> : <FileText size={14} className="ml-1" />}
                                    {generatingReport ? "Generating PDF..." : "Download Monthly Report"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                            { label: "إجمالي الجلسات", value: studentRows.length, color: "#2563eb" },
                            { label: "حفظ", value: memRows.length, color: "#0369a1" },
                            { label: "مراجعة", value: revRows.length, color: "#7c3aed" },
                        ].map((s) => (
                            <div key={s.label} className="rounded-xl border p-3 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                                <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-xs text-[var(--muted)] mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                    {memRows.length > 0 && (
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-[var(--text)]">
                                <BookOpen size={14} className="text-sky-600" />
                                <span>سجلات الحفظ</span>
                                <span className="mr-auto text-xs font-normal text-[var(--muted)]">{memRows.length} سجل</span>
                            </div>
                            <div className="space-y-2">{memRows.map((r) => <RecordCard key={r.id} r={r} />)}</div>
                        </div>
                    )}
                    {revRows.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-[var(--text)]">
                                <BookMarked size={14} className="text-violet-600" />
                                <span>سجلات المراجعة</span>
                                <span className="mr-auto text-xs font-normal text-[var(--muted)]">{revRows.length} سجل</span>
                            </div>
                            <div className="space-y-2">{revRows.map((r) => <RecordCard key={r.id} r={r} />)}</div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    )
}

// === Main Page ===

function MemorizationReports() {
    const [rows, setRows] = useState<CombinedRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "success" | "empty" | "error">("idle")
    const [circles, setCircles] = useState<Circle[]>([])

    const [filterCircle, setFilterCircle] = useState<string>("all")
    const [filterType, setFilterType] = useState<string>("all")
    const [filterDate, setFilterDate] = useState("")

    const [drawerStudent, setDrawerStudent] = useState<{ id: number | null; name: string } | null>(null)

    useEffect(() => {
        ; (async () => {
            try {
                console.log("[MemorizationReports] Loading circles list...")
                const res = await listCircles({ per_page: 200 })
                console.log(`[MemorizationReports] Successfully loaded ${res.data.length} circles`)
                setCircles(res.data)
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error)
                console.error("[MemorizationReports] Failed to load circles:", errorMsg, error)
                toast.error("تعذر تحميل الحلقات. تحقق من الاتصال بالخادم.")
            }
        })()
    }, [])

    const fetchForCircle = useCallback(
        async (circle: Circle): Promise<CombinedRecord[]> => {
            const date = filterDate || undefined
            const combined: CombinedRecord[] = []
            const [memRecords, revRecords] = await Promise.allSettled([
                filterType !== "review" ? listCircleMemorization(circle.id, date) : Promise.resolve([]),
                filterType !== "memorization" ? listCircleReviews(circle.id, date) : Promise.resolve([]),
            ])

            // Log any rejected promises for debugging
            if (memRecords.status === "rejected") {
                console.error(`[MemorizationReports] Failed to fetch memorization for circle ${circle.id}:`, memRecords.reason)
            }
            if (revRecords.status === "rejected") {
                console.error(`[MemorizationReports] Failed to fetch reviews for circle ${circle.id}:`, revRecords.reason)
            }

            if (memRecords.status === "fulfilled") {
                memRecords.value.forEach((r) => {
                    combined.push({
                        id: `mem-${r.id}`,
                        type: "memorization",
                        studentId: r.student_id,
                        studentName: "—",
                        circleName: circle.name,
                        circleId: circle.id,
                        date: r.session_date,
                        fromSurah: r.from_surah,
                        fromAyah: r.from_ayah,
                        toSurah: r.to_surah,
                        toAyah: r.to_ayah,
                        pagesCount: r.pages_count ?? null,
                        evaluation: r.evaluation ?? null,
                        notes: r.notes ?? null,
                    })
                })
            }
            if (revRecords.status === "fulfilled") {
                revRecords.value.forEach((r) => {
                    combined.push({
                        id: `rev-${r.id}`,
                        type: "review",
                        studentId: r.student_id ?? null,
                        studentName: r.student?.name ?? "—",
                        circleName: circle.name,
                        circleId: circle.id,
                        date: r.session_date,
                        fromSurah: r.range?.from_surah ?? 0,
                        fromAyah: r.range?.from_ayah ?? 0,
                        toSurah: r.range?.to_surah ?? 0,
                        toAyah: r.range?.to_ayah ?? 0,
                        pagesCount: r.pages_count ?? null,
                        evaluation: r.evaluation ?? null,
                        notes: r.notes ?? null,
                    })
                })
            }
            return combined
        },
        [filterDate, filterType]
    )

    const loadData = useCallback(async () => {
        if (circles.length === 0) {
            console.warn("[MemorizationReports] No circles loaded yet")
            return
        }
        setLoading(true)
        setRequestStatus("loading")
        try {
            console.log(`[MemorizationReports] Loading data for ${circles.length} circles...`)
            const targetCircles =
                filterCircle === "all" ? circles : circles.filter((c) => c.id === Number(filterCircle))
            console.log(`[MemorizationReports] Fetching data for ${targetCircles.length} selected circles`)
            const results = await Promise.all(targetCircles.map(fetchForCircle))
            const flat = results.flat()
            console.log(`[MemorizationReports] Successfully loaded ${flat.length} records`)
            setRows(flat)
            setRequestStatus(flat.length === 0 ? "empty" : "success")
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            console.error("[MemorizationReports] Error loading data:", errorMsg, error)
            toast.error("تعذر تحميل بيانات الحفظ والمراجعة. تحقق من وحدة تحكم المتصفح (F12) للمزيد من التفاصيل.")
            setRequestStatus("error")
            setRows([])
        } finally {
            setLoading(false)
        }
    }, [circles, filterCircle, fetchForCircle])

    useEffect(() => {
        if (circles.length > 0) loadData()
    }, [circles, loadData])

    // KPIs
    const stats = useMemo(() => {
        const total = rows.length
        if (total === 0)
            return { total: 0, avgPages: 0, topEval: null, uniqueStudents: 0, evalCounts: [], excellentPct: 0 }

        const pagesRows = rows.filter((r) => r.pagesCount != null && r.pagesCount > 0)
        const avgPages =
            pagesRows.length > 0
                ? Math.round(pagesRows.reduce((s, r) => s + (r.pagesCount ?? 0), 0) / pagesRows.length)
                : 0

        const uniqueStudents = new Set(rows.map((r) => r.studentId).filter(Boolean)).size

        const evalMap = new Map<string, number>()
        rows.forEach((r) => {
            const cfg = getEvalConfig(r.evaluation)
            evalMap.set(cfg.label, (evalMap.get(cfg.label) ?? 0) + 1)
        })

        const evalCounts = Array.from(evalMap.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => getEvalConfig(b.label).order - getEvalConfig(a.label).order)

        const topEval =
            evalCounts.length > 0
                ? evalCounts.reduce(
                    (best, cur) =>
                        getEvalConfig(cur.label).order > getEvalConfig(best.label).order ? cur : best,
                    evalCounts[0]
                )
                : null

        const excellentCount = evalMap.get("ممتاز") ?? 0
        const excellentPct = total > 0 ? Math.round((excellentCount / total) * 100) : 0

        return { total, avgPages, topEval, uniqueStudents, evalCounts, excellentPct }
    }, [rows])

    // Table columns
    const columns = useMemo<ColumnDef<CombinedRecord>[]>(
        () => [
            {
                id: "index",
                header: "#",
                cell: ({ row }) => (
                    <span className="text-xs text-[var(--muted)] font-medium w-6 inline-block text-center">
                        {row.index + 1}
                    </span>
                ),
            },
            {
                accessorKey: "date",
                header: "التاريخ",
                cell: ({ getValue }) => (
                    <span className="text-xs font-medium text-[var(--muted)] tabular-nums">
                        {String(getValue() || "—")}
                    </span>
                ),
            },
            {
                id: "student",
                header: "اسم الطالب",
                cell: ({ row }) => {
                    const name =
                        row.original.studentName !== "—"
                            ? row.original.studentName
                            : row.original.studentId
                                ? `طالب #${row.original.studentId}`
                                : "—"
                    return <span className="font-bold text-[var(--text)] text-sm">{name}</span>
                },
            },
            {
                id: "circle",
                header: "الحلقة",
                cell: ({ row }) => (
                    <span className="text-sm text-[var(--text)]">{row.original.circleName}</span>
                ),
            },
            {
                id: "type",
                header: "النوع",
                cell: ({ row }) =>
                    row.original.type === "memorization" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border text-sky-700 bg-sky-50 border-sky-200">
                            <BookOpen size={11} /> حفظ
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border text-violet-700 bg-violet-50 border-violet-200">
                            <BookMarked size={11} /> مراجعة
                        </span>
                    ),
            },
            {
                id: "range",
                header: "مقدار الحفظ (من – إلى)",
                cell: ({ row }) => {
                    const r = row.original
                    const cfg = getEvalConfig(r.evaluation)
                    const pct = r.pagesCount ? Math.min((r.pagesCount / 20) * 100, 100) : null
                    return (
                        <div className="min-w-[160px] space-y-1.5" dir="rtl">
                            <div className="text-sm font-medium text-[var(--text)]">
                                س{r.fromSurah}:آ{r.fromAyah}
                                <span className="text-[var(--muted)] mx-1.5 text-xs">←</span>
                                س{r.toSurah}:آ{r.toAyah}
                            </div>
                            {pct !== null && (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-2.5 rounded-full transition-all duration-700"
                                            style={{
                                                width: `${pct}%`,
                                                background: cfg.color,
                                                boxShadow: `0 0 12px ${cfg.color}66, inset 0 1px 0 rgba(255,255,255,0.4)`
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-semibold tabular-nums w-10 text-left">
                                        {r.pagesCount}ص
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                },
            },
            {
                id: "evaluation",
                header: "التقييم",
                cell: ({ row }) => {
                    const cfg = getEvalConfig(row.original.evaluation)
                    return (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.tailwind}`}>
                            {cfg.icon} {cfg.label}
                        </span>
                    )
                },
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => {
                    const r = row.original
                    const name =
                        r.studentName !== "—" ? r.studentName : r.studentId ? `طالب #${r.studentId}` : "—"
                    return (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 rounded-lg"
                            onClick={() => setDrawerStudent({ id: r.studentId, name })}
                            disabled={r.studentId === null}
                        >
                            <Eye size={12} />
                            عرض
                        </Button>
                    )
                },
            },
        ],
        []
    )

    // Gradient card configs
    const kpiCards = [
        {
            label: "إجمالي السجلات",
            sub: "حفظ ومراجعة",
            value: loading ? null : stats.total,
            icon: <FileText size={22} />,
            gradient: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            shadow: "#bfdbfe55",
        },
        {
            label: "متوسط الحفظ",
            sub: "صفحة / جلسة",
            value: loading ? null : stats.avgPages > 0 ? stats.avgPages : "—",
            icon: <TrendingUp size={22} />,
            gradient: "linear-gradient(135deg, #065f46 0%, #10b981 100%)",
            shadow: "#a7f3d055",
        },
        {
            label: "عدد الطلاب",
            sub: "طالب نشط",
            value: loading ? null : stats.uniqueStudents > 0 ? stats.uniqueStudents : rows.length > 0 ? "—" : 0,
            icon: <Users size={22} />,
            gradient: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
            shadow: "#ede9fe55",
        },
    ]

    return (
        <AppLayout>
            <div dir="rtl" className="min-h-screen pb-10 overflow-hidden" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }}>
                {/* Floating Background Shapes */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)" }} />
                    <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)" }} />
                    <div className="absolute -bottom-40 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)" }} />
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-8 px-4 md:px-6 pt-6">
                    <Header
                        title="تقارير الحفظ والمراجعة"
                        subtitle="متابعة مستوى الطلاب وتقييمات الحفظ والمراجعة"
                    />

                    {/* Hero KPI Section - Floating 3D Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Excellent Gauge Card */}
                        <div
                            className="group relative h-48 rounded-3xl p-8 overflow-hidden cursor-default transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                            style={{
                                background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
                                boxShadow: "0 20px 60px rgba(16, 185, 129, 0.3), 0 0 1px rgba(0,0,0,0.1)"
                            }}
                        >
                            {/* Background Icon */}
                            <div className="absolute -top-8 -right-8 opacity-20 group-hover:opacity-30 transition-opacity">
                                <Award size={120} className="text-white" />
                            </div>

                            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                                <div className="relative mb-4">
                                    <RadialGauge pct={loading ? 0 : stats.excellentPct} color="#ffffff" size={100} />
                                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                                        {loading ? "..." : `${stats.excellentPct}%`}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <p className="text-white text-xs font-semibold opacity-90 mb-1">نسبة الممتاز</p>
                                    <p className="text-white text-lg font-bold">أعلى تقييم</p>
                                    {stats.topEval && !loading && (
                                        <p className="text-white text-xs opacity-75 mt-2">{stats.topEval.count} سجل ممتاز 🌟</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* KPI Cards */}
                        {kpiCards.map((card, idx) => {
                            const gradients = [
                                "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                            ]
                            return (
                                <div
                                    key={card.label}
                                    className="group relative h-48 rounded-3xl p-8 overflow-hidden cursor-default transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                    style={{
                                        background: gradients[idx] || card.gradient,
                                        boxShadow: `0 20px 60px rgba(59, 130, 246, ${idx === 0 ? 0.3 : idx === 1 ? 0.3 : 0.3}), 0 0 1px rgba(0,0,0,0.1)`
                                    }}
                                >
                                    {/* Background Icon */}
                                    <div className="absolute -top-8 -right-8 opacity-20 group-hover:opacity-30 transition-opacity">
                                        {card.icon}
                                    </div>

                                    <div className="relative z-10 flex flex-col justify-between h-full">
                                        <div>
                                            <p className="text-white text-xs font-semibold opacity-90">{card.label}</p>
                                            <p className="text-white text-xs opacity-75 mt-1">{card.sub}</p>
                                        </div>
                                        <div>
                                            {card.value === null ? (
                                                <div className="h-10 w-24 rounded-xl bg-white/20 animate-pulse" />
                                            ) : (
                                                <p className="text-white text-4xl font-bold">{card.value}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Glassmorphism Filter Bar */}
                    <div
                        className="rounded-3xl border backdrop-blur-2xl p-6 sticky top-6 z-20 transform transition-all duration-300"
                        style={{
                            background: "rgba(255, 255, 255, 0.8)",
                            borderColor: "rgba(255, 255, 255, 0.5)",
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.5)"
                        }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-2 text-slate-700">الحلقة</label>
                                <Select value={filterCircle} onValueChange={setFilterCircle}>
                                    <SelectTrigger className="rounded-2xl border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <SelectValue placeholder="جميع الحلقات" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">جميع الحلقات</SelectItem>
                                        {circles.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2 text-slate-700">النوع</label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="rounded-2xl border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <SelectValue placeholder="الكل" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل (حفظ ومراجعة)</SelectItem>
                                        <SelectItem value="memorization">📖 حفظ فقط</SelectItem>
                                        <SelectItem value="review">🔁 مراجعة فقط</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2 text-slate-700">التاريخ</label>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="w-full rounded-2xl border-0 bg-white px-4 py-2.5 text-sm shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={loadData} disabled={loading} className="rounded-2xl gap-2 h-10 text-sm flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all">
                                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                    {loading ? "جارٍ التحميل..." : "تحديث"}
                                </Button>
                                {filterDate && (
                                    <Button variant="ghost" size="sm" className="rounded-2xl text-xs gap-1" onClick={() => setFilterDate("")}>
                                        <ChevronLeft size={12} /> مسح
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    {requestStatus !== "error" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Distribution Chart */}
                            <div
                                className="rounded-3xl border p-8 backdrop-blur-sm overflow-hidden transform transition-all hover:shadow-2xl"
                                style={{
                                    background: "rgba(255, 255, 255, 0.9)",
                                    borderColor: "rgba(255, 255, 255, 0.5)",
                                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.5)"
                                }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
                                        <Award size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">توزيع التقييمات</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">إحصائية تقييم الحفظ والمراجعة</p>
                                    </div>
                                </div>
                                {loading ? (
                                    <Skeleton className="h-[220px] w-full rounded-2xl" />
                                ) : stats.evalCounts.length === 0 ? (
                                    <div className="h-[220px] flex items-center justify-center text-slate-400">
                                        <p className="text-sm">لا توجد بيانات للعرض</p>
                                    </div>
                                ) : (
                                    <div style={{ height: 220 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.evalCounts} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: "inherit" }} />
                                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                                <Tooltip
                                                    formatter={(v: number) => [`${v} سجل`, "العدد"]}
                                                    contentStyle={{ fontFamily: "inherit", direction: "rtl", borderRadius: 16 }}
                                                />
                                                <Bar dataKey="count" radius={[12, 12, 0, 0]} maxBarSize={52}>
                                                    {stats.evalCounts.map((e) => (
                                                        <Cell key={e.label} fill={EVAL_BAR_COLORS[e.label] ?? "#9ca3af"} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            {/* Pie Chart */}
                            <div
                                className="rounded-3xl border p-8 backdrop-blur-sm overflow-hidden transform transition-all hover:shadow-2xl"
                                style={{
                                    background: "rgba(255, 255, 255, 0.9)",
                                    borderColor: "rgba(255, 255, 255, 0.5)",
                                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.5)"
                                }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl" style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)" }}>
                                        <TrendingUp size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">نسب التقييم</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">توزيع النسب المئوية للتقييمات</p>
                                    </div>
                                </div>
                                {loading ? (
                                    <Skeleton className="h-[220px] w-full rounded-2xl" />
                                ) : stats.evalCounts.length === 0 ? (
                                    <div className="h-[220px] flex items-center justify-center text-slate-400">
                                        <p className="text-sm">لا توجد بيانات للعرض</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4" style={{ height: 220 }}>
                                        <ResponsiveContainer width="55%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.evalCounts}
                                                    dataKey="count"
                                                    nameKey="label"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={48}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                >
                                                    {stats.evalCounts.map((e) => (
                                                        <Cell key={e.label} fill={EVAL_BAR_COLORS[e.label] ?? "#9ca3af"} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(v: number) => [`${v} سجل`, ""]}
                                                    contentStyle={{ fontFamily: "inherit", borderRadius: 16 }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex-1 space-y-2">
                                            {stats.evalCounts.map((e) => {
                                                const pct = stats.total > 0 ? Math.round((e.count / stats.total) * 100) : 0
                                                return (
                                                    <div key={e.label} className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: EVAL_BAR_COLORS[e.label] ?? "#9ca3af" }} />
                                                        <span className="text-xs text-slate-700 flex-1 font-medium">{e.label}</span>
                                                        <span className="text-xs font-bold tabular-nums text-slate-900">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {requestStatus === "error" && (
                        <div
                            className="rounded-3xl border p-8 backdrop-blur-sm"
                            style={{
                                background: "linear-gradient(135deg, rgba(254, 232, 232, 0.9) 0%, rgba(254, 226, 226, 0.9) 100%)",
                                borderColor: "rgba(239, 68, 68, 0.3)",
                                boxShadow: "0 20px 60px rgba(239, 68, 68, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.5)"
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}>
                                    <FileText size={20} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-900 text-lg mb-2">⚠️ خطأ في تحميل البيانات</h3>
                                    <p className="text-sm text-red-800 mb-4">يرجى التحقق من:</p>
                                    <ul className="space-y-2 mb-4 text-sm text-red-800">
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-600">•</span>
                                            تحقق من اتصالك بالإنترنت
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-600">•</span>
                                            افتح وحدة تحكم المتصفح (اضغط F12) للمزيد من التفاصيل
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-600">•</span>
                                            تأكد من أن لديك صلاحيات كافية
                                        </li>
                                    </ul>
                                    <Button
                                        onClick={() => window.location.reload()}
                                        className="rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                                    >
                                        إعادة محاولة
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {requestStatus === "empty" && !loading && (
                        <div
                            className="rounded-3xl border p-12 text-center backdrop-blur-sm"
                            style={{
                                background: "rgba(255, 255, 255, 0.9)",
                                borderColor: "rgba(255, 255, 255, 0.5)",
                                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.5)"
                            }}
                        >
                            <div className="flex justify-center mb-6">
                                <div className="p-5 rounded-3xl" style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #cffafe 100%)" }}>
                                    <BookOpen size={48} className="text-sky-600" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">لا توجد سجلات</h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                                لا توجد سجلات حفظ أو مراجعة ضمن الفلاتر الحالية. جرّب تغيير معايير البحث.
                            </p>
                            <Button
                                onClick={() => setFilterDate("")}
                                className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg"
                            >
                                تصفير الفلاتر
                            </Button>
                        </div>
                    )}

                    {/* Table Section */}
                    {requestStatus !== "error" && requestStatus !== "empty" && (
                        <div>
                            {/* Desktop Table */}
                            <div
                                className="hidden md:block rounded-3xl border backdrop-blur-sm overflow-hidden transform transition-all"
                                style={{
                                    background: "rgba(255, 255, 255, 0.9)",
                                    borderColor: "rgba(255, 255, 255, 0.5)",
                                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
                                }}
                            >
                                <div
                                    className="px-8 py-6 border-b bg-gradient-to-r from-slate-50 to-white"
                                    style={{ borderColor: "rgba(255, 255, 255, 0.5)" }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="p-3 rounded-2xl"
                                                style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" }}
                                            >
                                                <BookOpen size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">تفاصيل الحفظ والمراجعة</h3>
                                                <p className="text-xs text-slate-500 mt-0.5">قائمة سجلات الطلاب</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-4 py-2 rounded-full">
                                            {rows.length} سجل
                                        </span>
                                    </div>
                                </div>
                                <DataTable
                                    columns={columns}
                                    data={rows}
                                    isLoading={loading}
                                    searchKey="studentName"
                                    searchPlaceholder="بحث باسم الطالب..."
                                />
                            </div>

                            {/* Mobile Card List */}
                            <div className="md:hidden space-y-3">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
                                ) : rows.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">لا توجد سجلات</div>
                                ) : (
                                    rows.map((row, idx) => {
                                        const cfg = getEvalConfig(row.evaluation)
                                        const pct = row.pagesCount ? Math.min((row.pagesCount / 20) * 100, 100) : null
                                        const name = row.studentName !== "—" ? row.studentName : row.studentId ? `طالب #${row.studentId}` : "—"

                                        return (
                                            <div
                                                key={row.id}
                                                className={`rounded-2xl p-4 shadow-sm border transform transition-all hover:shadow-md hover:scale-102 ${idx % 2 === 0 ? "bg-slate-50/80" : "bg-white"}`}
                                                style={{ borderColor: "rgba(255, 255, 255, 0.5)" }}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{name}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{row.date}</p>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border ${cfg.tailwind}`}
                                                    >
                                                        {cfg.icon}
                                                    </span>
                                                </div>

                                                <div className="mb-3 text-xs text-slate-600">
                                                    س{row.fromSurah}:آ{row.fromAyah} ← س{row.toSurah}:آ{row.toAyah}
                                                </div>

                                                {pct !== null && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="h-2 rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${pct}%`,
                                                                    background: cfg.color,
                                                                    boxShadow: `0 0 8px ${cfg.color}66`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">{row.pagesCount}ص</span>
                                                    </div>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full mt-3 rounded-xl h-8 text-xs gap-1"
                                                    onClick={() => setDrawerStudent({ id: row.studentId, name })}
                                                    disabled={row.studentId === null}
                                                >
                                                    <Eye size={12} /> عرض التفاصيل
                                                </Button>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* Student Modal */}
                    {drawerStudent && (
                        <StudentDetailModal
                            open={drawerStudent !== null}
                            onClose={() => setDrawerStudent(null)}
                            studentId={drawerStudent.id}
                            studentName={drawerStudent.name}
                            rows={rows}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    )
}


export default MemorizationReports
