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
import { createMemorizationRecord } from "@/services/memorization"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"

type Row = {
    id: number
    name: string
    from_surah: string
    from_ayah: string
    to_surah: string
    to_ayah: string
    evaluation: string
    mistakes_count: string
    notes: string
}

export default function Memorization() {
    const [params, setParams] = useSearchParams()
    const initialCircle = Number(params.get("circle_id") || 0)

    // Lookups
    const [circles, setCircles] = useState<TeacherCircle[]>([])
    const [openCircle, setOpenCircle] = useState(false)

    // Form state
    const [circleId, setCircleId] = useState<number | undefined>(initialCircle || undefined)
    const [date, setDate] = useState<string>(() => {
        const d = new Date()
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    })

    // Table state
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // load teacher circles
    useEffect(() => {
        (async () => {
            try {
                const data = await listMyCircles()
                setCircles(data)
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "تعذر تحميل الحلقات")
            }
        })()
    }, [])

    // load students when circle changes
    useEffect(() => {
        (async () => {
            if (!circleId) {
                setRows([])
                return
            }
            setLoading(true)
            try {
                const studs: MiniStudent[] = await listStudentsByCircleForAttendance(circleId)
                setRows(
                    studs.map((s) => ({
                        id: s.id,
                        name: s.name,
                        from_surah: "",
                        from_ayah: "",
                        to_surah: "",
                        to_ayah: "",
                        evaluation: "",
                        mistakes_count: "",
                        notes: "",
                    })),
                )
                // sync url
                const p = new URLSearchParams(params)
                p.set("circle_id", String(circleId))
                setParams(p, { replace: true })
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "تعذر تحميل طلاب الحلقة")
            } finally {
                setLoading(false)
            }
        })()
    }, [circleId])

    function updateRow(id: number, field: keyof Row, value: string) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
    }

    const columns: ColumnDef<Row>[] = useMemo(
        () => [
            { header: "#", cell: ({ row }) => row.index + 1 },
            { accessorKey: "name", header: "اسم الطالب" },
            {
                id: "from",
                header: "من (سورة/آية)",
                cell: ({ row }) => (
                    <div className="flex gap-1">
                        <Input
                            type="number"
                            min={1}
                            max={114}
                            placeholder="سورة"
                            value={row.original.from_surah}
                            className="w-20 h-8"
                            onChange={(e) => updateRow(row.original.id, "from_surah", e.target.value)}
                        />
                        <Input
                            type="number"
                            min={1}
                            placeholder="آية"
                            value={row.original.from_ayah}
                            className="w-20 h-8"
                            onChange={(e) => updateRow(row.original.id, "from_ayah", e.target.value)}
                        />
                    </div>
                ),
            },
            {
                id: "to",
                header: "إلى (سورة/آية)",
                cell: ({ row }) => (
                    <div className="flex gap-1">
                        <Input
                            type="number"
                            min={1}
                            max={114}
                            placeholder="سورة"
                            value={row.original.to_surah}
                            className="w-20 h-8"
                            onChange={(e) => updateRow(row.original.id, "to_surah", e.target.value)}
                        />
                        <Input
                            type="number"
                            min={1}
                            placeholder="آية"
                            value={row.original.to_ayah}
                            className="w-20 h-8"
                            onChange={(e) => updateRow(row.original.id, "to_ayah", e.target.value)}
                        />
                    </div>
                ),
            },
            {
                id: "evaluation",
                header: "التقييم (1–5)",
                cell: ({ row }) => (
                    <Input
                        type="number"
                        min={1}
                        max={5}
                        className="w-20 h-8"
                        value={row.original.evaluation}
                        onChange={(e) => updateRow(row.original.id, "evaluation", e.target.value)}
                    />
                ),
            },
            {
                id: "mistakes",
                header: "عدد الأخطاء",
                cell: ({ row }) => (
                    <Input
                        type="number"
                        min={0}
                        className="w-20 h-8"
                        value={row.original.mistakes_count}
                        onChange={(e) => updateRow(row.original.id, "mistakes_count", e.target.value)}
                    />
                ),
            },
            {
                id: "notes",
                header: "ملاحظات",
                cell: ({ row }) => (
                    <Input
                        type="text"
                        className="w-64 h-8"
                        value={row.original.notes}
                        onChange={(e) => updateRow(row.original.id, "notes", e.target.value)}
                    />
                ),
            },
        ],
        [],
    )

    const circleName = (id?: number) => {
        if (!id) return "اختر الحلقة"
        const c = circles.find((x) => x.id === id)
        return c?.name || `حلقة #${id}`
    }

    async function onSubmit() {
        if (!circleId) {
            toast.warning("اختر الحلقة أولًا")
            return
        }
        if (!date) {
            toast.warning("اختر التاريخ")
            return
        }

        // تأكد إنه في بيانات على الأقل
        const hasAny = rows.some((r) => r.from_surah && r.from_ayah && r.to_surah && r.to_ayah)
        if (!hasAny) {
            toast.warning("أدخل نطاق الحفظ على الأقل لطالب واحد")
            return
        }

        setSaving(true)
        try {
            for (const r of rows) {
                if (!r.from_surah || !r.from_ayah || !r.to_surah || !r.to_ayah) continue

                await createMemorizationRecord({
                    circle_id: circleId,
                    student_id: r.id,
                    session_date: date,
                    from_surah: Number(r.from_surah),
                    from_ayah: Number(r.from_ayah),
                    to_surah: Number(r.to_surah),
                    to_ayah: Number(r.to_ayah),
                    evaluation: r.evaluation ? Number(r.evaluation) : null,
                    mistakes_count: r.mistakes_count ? Number(r.mistakes_count) : 0,
                    notes: r.notes || null,
                })
            }
            toast.success("تم حفظ سجلات الحفظ")
        } catch (e: any) {
            console.error(e)
            toast.error(e?.response?.data?.message || "فشل حفظ الحفظ")
        } finally {
            setSaving(false)
        }
    }

    return (
        <AppLayout>
            <Header />
            <div className="p-4 space-y-4" dir="rtl">
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
                                    <CommandInput placeholder="ابحث عن الحلقة..." />
                                    <CommandEmpty>لا توجد نتائج</CommandEmpty>
                                    <CommandGroup>
                                        {circles.map((c) => (
                                            <CommandItem
                                                key={c.id}
                                                value={String(c.id)}
                                                onSelect={() => {
                                                    setCircleId(c.id)
                                                    setOpenCircle(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        c.id === circleId ? "opacity-100" : "opacity-0",
                                                    )}
                                                />
                                                <span>{c.name}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* التاريخ */}
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">تاريخ الجلسة</label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>

                    <div className="ml-auto">
                        <Button onClick={onSubmit} disabled={saving || !circleId}>
                            {saving ? "يتم الحفظ…" : "حفظ سجلات الحفظ"}
                        </Button>
                    </div>
                </div>

                <DataTable data={rows} columns={columns} isLoading={loading} />
            </div>
        </AppLayout>
    )
}
