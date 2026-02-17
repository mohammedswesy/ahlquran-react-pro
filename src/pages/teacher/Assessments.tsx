import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/datatable"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { listMyCircles, type TeacherCircle } from "@/services/circles"
import { listStudentsByCircleForAttendance, type MiniStudent } from "@/services/students"
import { submitAssessment, type AssessmentKind } from "@/services/assessments"

import {
    Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover"
import {
    Command, CommandInput, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"

type Row = {
    id: number
    name: string
    score?: number | null
    grade?: string | null
    notes?: string | null
}

const KINDS: { value: AssessmentKind; label: string }[] = [
    { value: "memorization", label: "حفظ" },
    { value: "revision", label: "مراجعة" },
    { value: "tajweed", label: "تجويد" },
    { value: "custom", label: "مخصّص" },
]

export default function Assessments() {
    const [params, setParams] = useSearchParams()
    const initialCircle = Number(params.get("circle_id") || 0)

    // Lookups
    const [circles, setCircles] = useState<TeacherCircle[]>([])
    const [openCircle, setOpenCircle] = useState(false)

    const [openKind, setOpenKind] = useState(false)

    // Form fields
    const [circleId, setCircleId] = useState<number | undefined>(initialCircle || undefined)
    const [date, setDate] = useState<string>(() => {
        const d = new Date()
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    })
    const [kind, setKind] = useState<AssessmentKind>("memorization")
    const [title, setTitle] = useState<string>("")

    // Table
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Load my circles
    useEffect(() => {
        (async () => {
            try {
                const list = await listMyCircles()
                setCircles(list)
            } catch {/* ignore */ }
        })()
    }, [])

    // Load students on circle change
    useEffect(() => {
        (async () => {
            if (!circleId) { setRows([]); return }
            setLoading(true)
            try {
                const studs: MiniStudent[] = await listStudentsByCircleForAttendance(circleId)
                setRows(studs.map(s => ({ id: s.id, name: s.name, score: null, grade: null, notes: null })))
                const p = new URLSearchParams(params)
                p.set("circle_id", String(circleId))
                setParams(p, { replace: true })
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "تعذر تحميل الطلاب")
            } finally {
                setLoading(false)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [circleId])

    // Columns
    const columns = useMemo<ColumnDef<Row>[]>(() => [
        { header: "#", cell: ({ row }) => row.index + 1 },
        { accessorKey: "name", header: "اسم الطالب" },
        {
            id: "score",
            header: "الدرجة",
            cell: ({ row }) => (
                <Input
                    type="number"
                    value={row.original.score ?? ""}
                    onChange={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value)
                        setRows(prev => prev.map(r => r.id === row.original.id ? { ...r, score: v } : r))
                    }}
                    className="h-8 w-24"
                />
            )
        },
        {
            id: "grade",
            header: "التقدير",
            cell: ({ row }) => (
                <Input
                    placeholder="A/B/C.."
                    value={row.original.grade ?? ""}
                    onChange={(e) => {
                        const v = e.target.value || null
                        setRows(prev => prev.map(r => r.id === row.original.id ? { ...r, grade: v } : r))
                    }}
                    className="h-8 w-24"
                />
            )
        },
        {
            id: "notes",
            header: "ملاحظات",
            cell: ({ row }) => (
                <Input
                    placeholder="ملاحظة للطالب"
                    value={row.original.notes ?? ""}
                    onChange={(e) => {
                        const v = e.target.value || null
                        setRows(prev => prev.map(r => r.id === row.original.id ? { ...r, notes: v } : r))
                    }}
                    className="h-8"
                />
            )
        },
    ], [])

    const circleName = (id?: number) =>
        circles.find(c => c.id === id)?.name || "اختر الحلقة…"

    async function onSubmit() {
        if (!circleId) { toast.warning("اختر الحلقة أولًا"); return }
        if (!date) { toast.warning("اختر التاريخ"); return }
        if (!rows.length) { toast.warning("لا يوجد طلاب لإدخال التقييم"); return }

        setSaving(true)
        try {
            await submitAssessment({
                circle_id: circleId,
                date,
                kind,
                title: title?.trim() || null,
                items: rows.map(r => ({
                    student_id: r.id,
                    score: r.score ?? null,
                    grade: r.grade ?? null,
                    notes: r.notes ?? null,
                }))
            })
            toast.success("تم حفظ التقييم")
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل حفظ التقييم")
        } finally {
            setSaving(false)
        }
    }

    return (
        <AppLayout>
            <Header />
            <div className="p-4 space-y-4" dir="rtl">
                {/* Filters / form header */}
                <div className="flex flex-wrap items-end gap-3">
                    {/* الحلقة */}
                    <div className="min-w-[260px]">
                        <label className="block text-sm text-gray-700 mb-1">الحلقة</label>
                        <Popover open={openCircle} onOpenChange={setOpenCircle}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    {circleName(circleId)}
                                    <ChevronsUpDown className="opacity-50 size-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="ابحث عن حلقة…" className="text-right" />
                                    <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                                    <CommandGroup>
                                        {circles.map(c => (
                                            <CommandItem
                                                key={c.id}
                                                value={c.name}
                                                onSelect={() => { setCircleId(c.id); setOpenCircle(false) }}
                                            >
                                                <Check className={cn("ml-2 size-4", c.id === circleId ? "opacity-100" : "opacity-0")} />
                                                {c.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* التاريخ */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">التاريخ</label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>

                    {/* نوع التقييم */}
                    <div className="min-w-[200px]">
                        <label className="block text-sm text-gray-700 mb-1">نوع التقييم</label>
                        <Popover open={openKind} onOpenChange={setOpenKind}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    {KINDS.find(k => k.value === kind)?.label || "اختر النوع"}
                                    <ChevronsUpDown className="opacity-50 size-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[220px] p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="نوع التقييم…" className="text-right" />
                                    <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                                    <CommandGroup>
                                        {KINDS.map(k => (
                                            <CommandItem
                                                key={k.value}
                                                value={k.label}
                                                onSelect={() => { setKind(k.value); setOpenKind(false) }}
                                            >
                                                <Check className={cn("ml-2 size-4", k.value === kind ? "opacity-100" : "opacity-0")} />
                                                {k.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* عنوان اختياري */}
                    <div className="min-w-[240px]">
                        <label className="block text-sm text-gray-700 mb-1">عنوان (اختياري)</label>
                        <Input placeholder="مثال: اختبار جزء عم" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div className="ml-auto">
                        <Button onClick={onSubmit} disabled={saving || !circleId}>
                            {saving ? "يتم الحفظ…" : "حفظ التقييم"}
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <DataTable data={rows} columns={columns} isLoading={loading} />
            </div>
        </AppLayout>
    )
}
