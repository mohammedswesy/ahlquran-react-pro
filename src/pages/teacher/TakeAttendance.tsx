import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LoadingBar from "@/components/ui/loading-bar"

import { listMyCircles, getMyCircle, listCircleStudents, type TeacherCircle } from "@/services/circles"
import { listAttendanceByCircleAndDate, submitBulkAttendance, type AttendanceStatus } from "@/services/attendances"
import { Check, Clock3, Loader2, Users, X } from "lucide-react"
import { PiCheckBold } from "react-icons/pi"

const SURFACE = "rgba(254, 254, 254, 0.98)"

type Row = {
    id: number
    name: string
    status: AttendanceStatus
    notes?: string | null
}

function StudentRowSkeleton() {
    return (
        <div className="rounded-xl border p-3 sm:p-4" style={{ background: SURFACE, borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
        </div>
    )
}

export default function TakeAttendance() {
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const initialCircle = Number(params.get("circle_id") || 0)

    const [circles, setCircles] = useState<TeacherCircle[]>([])
    const [selectedCircle, setSelectedCircle] = useState<TeacherCircle | null>(null)

    const [circleId, setCircleId] = useState<number | undefined>(initialCircle || undefined)
    const [date, setDate] = useState<string>(() => {
        const d = new Date()
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    })

    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingCircles, setLoadingCircles] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        (async () => {
            setLoadingCircles(true)
            try {
                const list = await listMyCircles()
                setCircles(list)
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "تعذر تحميل حلقات المعلّم")
            } finally {
                setLoadingCircles(false)
            }
        })()
    }, [])

    useEffect(() => {
        (async () => {
            if (!circleId) {
                setRows([])
                setSelectedCircle(null)
                return
            }
            setLoading(true)
            try {
                const [circle, students, attendanceRows] = await Promise.all([
                    getMyCircle(circleId),
                    listCircleStudents(circleId),
                    listAttendanceByCircleAndDate({ circle_id: circleId, date }),
                ])

                const statusMap = new Map<number, { status: AttendanceStatus; notes?: string | null }>()
                for (const rec of attendanceRows) {
                    statusMap.set(Number(rec.student_id), {
                        status: (rec.status ?? "present") as AttendanceStatus,
                        notes: rec.notes ?? null,
                    })
                }

                setSelectedCircle(circle)
                setRows(
                    students.map((s) => {
                        const existing = statusMap.get(Number(s.id))
                        return {
                            id: Number(s.id),
                            name: s.name,
                            status: existing?.status ?? "present",
                            notes: existing?.notes ?? null,
                        }
                    }),
                )

                const p = new URLSearchParams(params)
                p.set("circle_id", String(circleId))
                setParams(p, { replace: true })
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "تعذر تحميل بيانات الحلقة")
                setRows([])
                setSelectedCircle(null)
            } finally {
                setLoading(false)
            }
        })()
    }, [circleId, date, params, setParams])

    const setStatus = (studentId: number, status: AttendanceStatus) => {
        setRows((prev) => prev.map((r) => (r.id === studentId ? { ...r, status } : r)))
    }

    const setAllPresent = () => {
        setRows((prev) => prev.map((r) => ({ ...r, status: "present" })))
    }

    async function onSubmit() {
        if (!circleId || !date || !rows.length) {
            toast.warning("تأكد من اختيار الحلقة والتاريخ ووجود طلاب")
            return
        }
        setSaving(true)
        try {
            await submitBulkAttendance({
                date,
                circle_id: circleId,
                records: rows.map((r) => ({
                    student_id: r.id,
                    status: r.status,
                    notes: r.notes ?? null,
                })),
            })
            toast.success("تم حفظ التحضير بنجاح")
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل حفظ الحضور")
        } finally {
            setSaving(false)
        }
    }

    const stats = useMemo(() => {
        const total = rows.length
        const present = rows.filter((r) => r.status === "present").length
        const absent = rows.filter((r) => r.status === "absent").length
        const late = rows.filter((r) => r.status === "late").length
        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0
        return { total, present, absent, late, attendanceRate }
    }, [rows])

    const statusButtons: Array<{
        key: AttendanceStatus
        label: string
        icon: typeof Check
        activeClass: string
    }> = [
            { key: "present", label: "حاضر", icon: Check, activeClass: "bg-emerald-600 border-emerald-600 text-white" },
            { key: "absent", label: "غائب", icon: X, activeClass: "bg-red-600 border-red-600 text-white" },
            { key: "late", label: "متأخر", icon: Clock3, activeClass: "bg-amber-500 border-amber-500 text-white" },
        ]

    return (
        <AppLayout>
            <Header title="الحضور اليومي" subtitle="إدارة تحضير الحلقة بسرعة وبشكل احترافي" />
            <div className="p-4 sm:p-5 pb-28 space-y-5" dir="rtl">
                <LoadingBar active={loading || saving || loadingCircles} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "الطلاب", value: stats.total },
                        { label: "حاضر", value: stats.present },
                        { label: "غائب", value: stats.absent },
                        { label: "متأخر", value: stats.late },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-xl border p-3"
                            style={{ background: SURFACE, borderColor: "var(--border)" }}
                        >
                            <div className="text-xs" style={{ color: "var(--muted)" }}>{item.label}</div>
                            <div className="text-2xl font-extrabold" style={{ color: "#065f46" }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>الحلقة والتاريخ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="md:col-span-2">
                                <label className="block text-sm mb-1" style={{ color: "var(--muted)" }}>
                                    اختر الحلقة
                                </label>
                                <Select
                                    value={circleId ? String(circleId) : undefined}
                                    onValueChange={(v) => setCircleId(v ? Number(v) : undefined)}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="اختر الحلقة..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {circles.map((circle) => (
                                            <SelectItem key={circle.id} value={String(circle.id)}>
                                                {circle.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1" style={{ color: "var(--muted)" }}>
                                    التاريخ
                                </label>
                                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
                            </div>
                        </div>

                        {!!selectedCircle && (
                            <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "rgba(16,185,129,.06)" }}>
                                <span className="font-semibold text-emerald-700">الحلقة المختارة:</span> {selectedCircle.name}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="w-full sm:w-auto" onClick={setAllPresent} disabled={!rows.length || loading}>
                                <PiCheckBold size={16} className="ms-1" />
                                تحديد الكل حاضر
                            </Button>
                            <Button
                                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800"
                                onClick={onSubmit}
                                disabled={saving || !circleId || !rows.length}
                            >
                                {saving ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
                                حفظ التحضير
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {loading || loadingCircles ? (
                        <>
                            {[1, 2, 3, 4, 5, 6].map((n) => <StudentRowSkeleton key={n} />)}
                        </>
                    ) : !circleId ? (
                        <Card>
                            <CardContent className="py-10 text-center text-sm" style={{ color: "var(--muted)" }}>
                                اختر الحلقة أولاً لعرض الطلاب
                            </CardContent>
                        </Card>
                    ) : rows.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-sm" style={{ color: "var(--muted)" }}>
                                لا يوجد طلاب في هذه الحلقة
                            </CardContent>
                        </Card>
                    ) : (
                        rows.map((student) => (
                            <Card key={student.id} className="rounded-2xl border" style={{ background: SURFACE, borderColor: "var(--border)" }}>
                                <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#065f46" }}>
                                        {student.name.slice(0, 1)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate" style={{ color: "var(--text)" }}>{student.name}</div>
                                        <div className="text-xs" style={{ color: "var(--muted)" }}>#{student.id}</div>
                                    </div>
                                    <Users style={{ color: "var(--muted)" }} size={16} />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {statusButtons.map((option) => {
                                        const Icon = option.icon
                                        const active = student.status === option.key

                                        return (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() => setStatus(student.id, option.key)}
                                                className={cn(
                                                    "h-10 rounded-lg border text-sm font-bold transition flex items-center justify-center gap-1",
                                                    active
                                                        ? option.activeClass
                                                        : "bg-white border-[var(--border)] text-[var(--text)]",
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {option.label}
                                            </button>
                                        )
                                    })}
                                </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <div className="fixed bottom-0 right-0 left-0 p-3 border-t backdrop-blur md:static md:p-0 md:border-0 md:bg-transparent" style={{ background: "rgba(254,254,254,0.95)", borderColor: "var(--border)" }}>
                    <div className="max-w-3xl ms-auto">
                        <Button className="w-full h-12 text-base font-bold md:w-auto md:px-8 bg-emerald-700 hover:bg-emerald-800" onClick={onSubmit} disabled={saving || !circleId || !rows.length}>
                            {saving ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : null}
                            {saving ? "جاري الحفظ..." : "حفظ التحضير"}
                        </Button>
                        <div className="text-xs mt-1 md:hidden" style={{ color: "var(--muted)" }}>
                            نسبة الحضور: {stats.attendanceRate}%
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}