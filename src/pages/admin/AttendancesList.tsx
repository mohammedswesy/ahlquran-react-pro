import { useCallback, useEffect, useMemo, useState } from "react"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import ModalFormShell from "@/components/ui/modal-form-shell"

import {
    listAttendances,
    updateAttendance,
    deleteAttendance,
    type Attendance,
} from "@/services/attendances"

import { listInstitutesOptions } from "@/services/institutes"
import { listCirclesByInstitute } from "@/services/circles"
import { listStudentsOptions } from "@/services/students"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"

import AttendanceForm, { type AttendanceFormValues } from "./AttendanceForm"
import AttendanceChart from "./AttendanceChart"
import LoadingBar from "@/components/ui/loading-bar"

type AttendancePoint = {
    date: string
    present: number
    absent: number
    late: number
    excused: number
}

const STATUS_LABEL: Record<string, string> = {
    present: "حاضر",
    absent: "غائب",
    late: "متأخر",
    excused: "مُعذّر",
}

export default function AttendancesList() {
    const [rows, setRows] = useState<Attendance[]>([])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [perPage] = useState(10)
    const [meta, setMeta] = useState<any>(null)

    // Filters
    const [dateFrom, setDateFrom] = useState<string>("")
    const [dateTo, setDateTo] = useState<string>("")
    const [status, setStatus] = useState<string | undefined>(undefined)
    const [instId, setInstId] = useState<number | undefined>(undefined)
    const [circleId, setCircleId] = useState<number | undefined>(undefined)
    const [studentId, setStudentId] = useState<number | undefined>(undefined)

    // Lookups
    const [instOptions, setInstOptions] = useState<Array<{ id: number; name: string }>>([])
    const [circleOptions, setCircleOptions] = useState<Array<{ id: number; name: string }>>([])
    const [studentOptions, setStudentOptions] = useState<Array<{ id: number; name: string }>>([])

    const [openStatus, setOpenStatus] = useState(false)
    const [openInst, setOpenInst] = useState(false)
    const [openCircle, setOpenCircle] = useState(false)
    const [openStudent, setOpenStudent] = useState(false)

    useEffect(() => {
        ; (async () => setInstOptions(await listInstitutesOptions()))()
    }, [])

    useEffect(() => {
        if (!instId) {
            setCircleOptions([])
            setCircleId(undefined)
            return
        }
        ; (async () => setCircleOptions(await listCirclesByInstitute(instId)))()
    }, [instId])

    useEffect(() => {
        if (!circleId) {
            setStudentOptions([])
            setStudentId(undefined)
            return
        }
        ; (async () => setStudentOptions(await listStudentsOptions({ circle_id: circleId })))()
    }, [circleId])

    const [openEdit, setOpenEdit] = useState<Attendance | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await listAttendances({
                page,
                per_page: perPage,
                search,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                status: status || undefined,
                institute_id: instId,
                circle_id: circleId,
                student_id: studentId,
            } as any)

            const next =
                (res && Array.isArray((res as any).data) && (res as any).data) ||
                (Array.isArray(res) ? res : [])

            setRows(next as Attendance[])
            setMeta((res as any)?.meta ?? null)
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "تعذر تحميل الحضور")
        } finally {
            setLoading(false)
        }
    }, [circleId, dateFrom, dateTo, page, perPage, search, status, studentId, instId])

    useEffect(() => {
        const id = setTimeout(() => load(), 350)
        return () => clearTimeout(id)
    }, [load])

    const columns = useMemo<ColumnDef<Attendance>[]>(
        () => [
            { id: "idx", header: "#", cell: ({ row }) => row.index + 1 },

            { id: "student", header: "الطالب", cell: ({ row }) => row.original.student?.name || "—" },
            { id: "circle", header: "الحلقة", cell: ({ row }) => row.original.circle?.name || "—" },

            { accessorKey: "date", header: "التاريخ" },
            { accessorKey: "start_time", header: "بداية", cell: ({ getValue }) => (getValue() as any) || "—" },
            { accessorKey: "end_time", header: "نهاية", cell: ({ getValue }) => (getValue() as any) || "—" },

            { id: "status", header: "الحالة", cell: ({ row }) => STATUS_LABEL[row.original.status || ""] || "—" },

            {
                id: "actions",
                header: "إجراءات",
                cell: ({ row }) => {
                    const r = row.original
                    return (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setOpenEdit(r)}>
                                تعديل
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => onDelete(r.id)}>
                                حذف
                            </Button>
                        </div>
                    )
                },
            },
        ],
        []
    )

    const chartData = useMemo<AttendancePoint[]>(() => {
        const map = new Map<string, AttendancePoint>()
        for (const r of rows) {
            const d = String((r as any).date ?? "")
            if (!d) continue
            if (!map.has(d)) map.set(d, { date: d, present: 0, absent: 0, late: 0, excused: 0 })
            const p = map.get(d)!
            const st = String((r as any).status ?? "")
            if (st === "present") p.present++
            else if (st === "absent") p.absent++
            else if (st === "late") p.late++
            else if (st === "excused") p.excused++
        }
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
    }, [rows])

    const onEdit = async (v: AttendanceFormValues) => {
        if (!openEdit) return
        setSubmitting(true)
        try {
            await updateAttendance(openEdit.id, v as any)
            toast.success("تم التعديل بنجاح")
            setOpenEdit(null)
            await load()
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل التعديل")
        } finally {
            setSubmitting(false)
        }
    }

    async function onDelete(id: number) {
        if (!confirm("متأكد من حذف هذا السجل؟")) return
        try {
            await deleteAttendance(id)
            toast.success("تم الحذف")
            await load()
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل الحذف")
        }
    }

    const labelOf = (arr: Array<{ id: number; name: string }>, id?: number) =>
        arr.find((x) => x.id === id)?.name || "اختر…"

    return (
        <div className="space-y-4" dir="rtl">
            <LoadingBar active={loading} />
            {chartData.length > 0 && <AttendanceChart data={chartData as any} />}

            <div className="flex flex-wrap items-end gap-2">
                <Input
                    label="بحث"
                    placeholder="ابحث باسم الطالب…"
                    value={search}
                    onChange={(e) => {
                        setPage(1)
                        setSearch(e.target.value)
                    }}
                    className="w-64"
                />

                <Input
                    label="من تاريخ"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                        setPage(1)
                        setDateFrom(e.target.value)
                    }}
                />
                <Input
                    label="إلى تاريخ"
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                        setPage(1)
                        setDateTo(e.target.value)
                    }}
                />

                {/* الحالة */}
                <div className="min-w-[180px]">
                    <label className="block text-sm text-[var(--muted)] mb-1">الحالة</label>
                    <Popover open={openStatus} onOpenChange={setOpenStatus}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {STATUS_LABEL[status || ""] || "الكل"} <ChevronsUpDown className="opacity-50 size-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="ابحث عن حالة…" className="text-right" />
                                <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                                <CommandGroup>
                                    {[
                                        { key: undefined, label: "الكل" },
                                        { key: "present", label: "حاضر" },
                                        { key: "absent", label: "غائب" },
                                        { key: "late", label: "متأخر" },
                                        { key: "excused", label: "مُعذّر" },
                                    ].map((s) => (
                                        <CommandItem
                                            key={String(s.key)}
                                            value={s.label}
                                            onSelect={() => {
                                                setStatus(s.key as any)
                                                setOpenStatus(false)
                                                setPage(1)
                                            }}
                                        >
                                            <Check className={cn("ml-2 size-4", status === s.key ? "opacity-100" : "opacity-0")} />
                                            {s.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* المعهد */}
                <div className="min-w-[220px]">
                    <label className="block text-sm text-[var(--muted)] mb-1">المعهد</label>
                    <Popover open={openInst} onOpenChange={setOpenInst}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {labelOf(instOptions, instId)} <ChevronsUpDown className="opacity-50 size-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[260px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="ابحث عن معهد…" className="text-right" />
                                <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="الكل"
                                        onSelect={() => {
                                            setInstId(undefined)
                                            setCircleId(undefined)
                                            setOpenInst(false)
                                            setPage(1)
                                        }}
                                    >
                                        <Check className={cn("ml-2 size-4", !instId ? "opacity-100" : "opacity-0")} /> الكل
                                    </CommandItem>

                                    {instOptions.map((i) => (
                                        <CommandItem
                                            key={i.id}
                                            value={i.name}
                                            onSelect={() => {
                                                setInstId(i.id)
                                                setOpenInst(false)
                                                setPage(1)
                                            }}
                                        >
                                            <Check className={cn("ml-2 size-4", instId === i.id ? "opacity-100" : "opacity-0")} />
                                            {i.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* الحلقة */}
                <div className="min-w-[220px]">
                    <label className="block text-sm text-[var(--muted)] mb-1">الحلقة</label>
                    <Popover open={openCircle} onOpenChange={setOpenCircle}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!instId}>
                                {labelOf(circleOptions, circleId)} <ChevronsUpDown className="opacity-50 size-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[260px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="ابحث عن حلقة…" className="text-right" />
                                <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="الكل"
                                        onSelect={() => {
                                            setCircleId(undefined)
                                            setOpenCircle(false)
                                            setPage(1)
                                        }}
                                    >
                                        <Check className={cn("ml-2 size-4", !circleId ? "opacity-100" : "opacity-0")} /> الكل
                                    </CommandItem>

                                    {circleOptions.map((c) => (
                                        <CommandItem
                                            key={c.id}
                                            value={c.name}
                                            onSelect={() => {
                                                setCircleId(c.id)
                                                setOpenCircle(false)
                                                setPage(1)
                                            }}
                                        >
                                            <Check className={cn("ml-2 size-4", circleId === c.id ? "opacity-100" : "opacity-0")} />
                                            {c.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* الطالب */}
                <div className="min-w-[220px]">
                    <label className="block text-sm text-[var(--muted)] mb-1">الطالب</label>
                    <Popover open={openStudent} onOpenChange={setOpenStudent}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!circleId}>
                                {labelOf(studentOptions, studentId)} <ChevronsUpDown className="opacity-50 size-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="ابحث عن طالب…" className="text-right" />
                                <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="الكل"
                                        onSelect={() => {
                                            setStudentId(undefined)
                                            setOpenStudent(false)
                                            setPage(1)
                                        }}
                                    >
                                        <Check className={cn("ml-2 size-4", !studentId ? "opacity-100" : "opacity-0")} /> الكل
                                    </CommandItem>

                                    {studentOptions.map((s) => (
                                        <CommandItem
                                            key={s.id}
                                            value={s.name}
                                            onSelect={() => {
                                                setStudentId(s.id)
                                                setOpenStudent(false)
                                                setPage(1)
                                            }}
                                        >
                                            <Check className={cn("ml-2 size-4", studentId === s.id ? "opacity-100" : "opacity-0")} />
                                            {s.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <Button onClick={load} variant="outline">
                    تحديث
                </Button>

                {/* ❌مفيش POST للأدمن، فبنخفي زر الإضافة */}
                {/* <Button onClick={() => setOpenCreate(true)}>تسجيل حضور</Button> */}
            </div>

            <DataTable columns={columns} data={rows} isLoading={loading} />

            {meta && (
                <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                    <div>صفحة {meta.current_page} من {meta.last_page}</div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                            السابق
                        </Button>
                        <Button variant="outline" size="sm" disabled={meta && page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                            التالي
                        </Button>
                    </div>
                </div>
            )}

            <ModalFormShell
                open={!!openEdit}
                onClose={() => setOpenEdit(null)}
                title="تعديل حضور"
                formId="attendance-edit-form"
                submitting={submitting}
            >
                <AttendanceForm formId="attendance-edit-form" showActions={false} submitting={submitting} defaultValues={openEdit ?? undefined} onSubmit={onEdit} />
            </ModalFormShell>
        </div>
    )
}
