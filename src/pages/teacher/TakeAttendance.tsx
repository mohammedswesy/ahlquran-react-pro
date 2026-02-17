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
import { submitAttendance, type AttendanceStatus } from "@/services/attendances"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"

type Row = {
    id: number
    name: string
    status: AttendanceStatus
    notes?: string | null
}

export default function TakeAttendance() {
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

    // load my circles
    useEffect(() => {
        ; (async () => {
            try {
                const list = await listMyCircles()
                setCircles(list)
                // لو ما في circleId بالـ URL اختار أول حلقة تلقائياً
                if (!circleId && list.length) setCircleId(list[0].id)
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "تعذر تحميل حلقات المعلّم")
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // load students when circle changes
    useEffect(() => {
        ; (async () => {
            if (!circleId) {
                setRows([])
                return
            }
            setLoading(true)
            try {
                const studs: MiniStudent[] = await listStudentsByCircleForAttendance(circleId)

                setRows(studs.map((s) => ({ id: s.id, name: s.name, status: "present", notes: null })))

                // sync url
                const p = new URLSearchParams(params)
                p.set("circle_id", String(circleId))
                setParams(p, { replace: true })
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "تعذر تحميل طلاب الحلقة")
                setRows([])
            } finally {
                setLoading(false)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [circleId])

    const labelOf = (s: AttendanceStatus) => {
        switch (s) {
            case "present":
                return "حاضر"
            case "absent":
                return "غائب"
            case "late":
                return "متأخر"
            case "excused":
                return "مُعذّر"
            default:
                return String(s)
        }
    }

    // ✅ مهم: لازم كل ColumnDef يكون عنده id لو header مش string
    const columns = useMemo<ColumnDef<Row>[]>(() => [
        {
            id: "idx",
            header: "#",
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "name",
            header: "اسم الطالب",
        },
        {
            id: "status",
            header: "الحالة",
            cell: ({ row }) => {
                const s = row.original.status
                return (
                    <div className="flex flex-wrap gap-2">
                        {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((v) => (
                            <Button
                                key={v}
                                size="sm"
                                variant={s === v ? "primary" : "outline"}
                                onClick={() => {
                                    setRows((prev) => prev.map((r) => (r.id === row.original.id ? { ...r, status: v } : r)))
                                }}
                            >
                                {labelOf(v)}
                            </Button>
                        ))}
                    </div>
                )
            },
        },
        {
            id: "notes",
            header: "ملاحظات",
            cell: ({ row }) => (
                <Input
                    placeholder="ملاحظة"
                    value={row.original.notes ?? ""}
                    onChange={(e) => {
                        const v = e.target.value || null
                        setRows((prev) => prev.map((r) => (r.id === row.original.id ? { ...r, notes: v } : r)))
                    }}
                    className="h-8"
                />
            ),
        },
    ], [])

    async function onSubmit() {
        if (!circleId) {
            toast.warning("اختر الحلقة أولًا")
            return
        }
        if (!date) {
            toast.warning("اختر التاريخ")
            return
        }
        if (!rows.length) {
            toast.warning("لا يوجد طلاب")
            return
        }

        setSaving(true)
        try {
            // ✅ هذا يطابق باكك: POST /api/attendance
            await submitAttendance({
                date,
                circle_id: circleId,
                records: rows.map((r) => ({
                    student_id: r.id,
                    status: r.status,
                    notes: r.notes ?? null,
                })),
            })

            toast.success("تم حفظ الحضور ✅")
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل حفظ الحضور")
        } finally {
            setSaving(false)
        }
    }

    const circleName = (id?: number) => circles.find((c) => c.id === id)?.name || "اختر الحلقة…"

    const setAll = (st: AttendanceStatus) => setRows((prev) => prev.map((r) => ({ ...r, status: st })))

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
                                    <CommandInput placeholder="ابحث عن حلقة…" className="text-right" />
                                    <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                                    <CommandGroup>
                                        {circles.map((c) => (
                                            <CommandItem
                                                key={c.id}
                                                value={c.name}
                                                onSelect={() => {
                                                    setCircleId(c.id)
                                                    setOpenCircle(false)
                                                }}
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

                    {/* أزرار سريعة */}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setAll("present")}>الكل حاضر</Button>
                        <Button variant="outline" onClick={() => setAll("absent")}>الكل غائب</Button>
                    </div>

                    <div className="ml-auto">
                        <Button onClick={onSubmit} disabled={saving || !circleId}>
                            {saving ? "يتم الحفظ…" : "حفظ الحضور"}
                        </Button>
                    </div>
                </div>

                <DataTable data={rows} columns={columns} isLoading={loading} searchKey="name" />
            </div>
        </AppLayout>
    )
}
