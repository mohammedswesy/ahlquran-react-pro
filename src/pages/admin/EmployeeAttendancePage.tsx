import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import {
    listEmployeeAttendances,
    createEmployeeAttendance,
    updateEmployeeAttendance,
    deleteEmployeeAttendance,
    type EmployeeAttendance,
    type EmployeeAttendanceStatus,
} from "@/services/employeeAttendance"

const STATUS_LABEL: Record<EmployeeAttendanceStatus, string> = {
    present: "حاضر",
    absent: "غائب",
    late: "متأخر",
    excused: "مُعذّر",
}

function StatusPill({ v }: { v: EmployeeAttendanceStatus }) {
    const label = STATUS_LABEL[v] ?? v
    return (
        <span
            className="px-2 py-1 rounded-xl text-xs font-semibold"
            style={{
                background: "rgba(0,61,53,.06)",
                border: "1px solid rgba(0,61,53,.14)",
                color: "rgba(0,61,53,.95)",
            }}
        >
            {label}
        </span>
    )
}

type FormState = {
    date: string
    employee_name: string
    start_time: string
    end_time: string
    status: EmployeeAttendanceStatus
    notes: string
}

function emptyForm(): FormState {
    return {
        date: new Date().toISOString().slice(0, 10),
        employee_name: "",
        start_time: "",
        end_time: "",
        status: "present",
        notes: "",
    }
}

export default function EmployeeAttendancePage() {
    const [rows, setRows] = useState<EmployeeAttendance[]>([])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [status, setStatus] = useState<EmployeeAttendanceStatus | "">("")

    const [page, setPage] = useState(1)
    const [perPage] = useState(10)
    const [meta, setMeta] = useState<any>(null)

    const [openCreate, setOpenCreate] = useState(false)
    const [openEdit, setOpenEdit] = useState<EmployeeAttendance | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState<FormState>(emptyForm())

    const load = async () => {
        setLoading(true)
        try {
            const res = await listEmployeeAttendances({
                page,
                per_page: perPage,
                search: search || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                status: status || undefined,
            })
            setRows(res.data ?? [])
            setMeta(res.meta ?? null)
        } catch (e: any) {
            toast.error(e?.message || "تعذر تحميل مواظبة الموظفين")
            setRows([])
            setMeta(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const t = setTimeout(() => load(), 250)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, dateFrom, dateTo, status, page])

    const openCreateModal = () => {
        setForm(emptyForm())
        setOpenCreate(true)
    }

    const openEditModal = (r: EmployeeAttendance) => {
        setOpenEdit(r)
        setForm({
            date: r.date ?? new Date().toISOString().slice(0, 10),
            employee_name: r.employee_name ?? "",
            start_time: r.start_time ?? "",
            end_time: r.end_time ?? "",
            status: (r.status ?? "present") as any,
            notes: r.notes ?? "",
        })
    }

    const submitCreate = async () => {
        if (!form.employee_name.trim()) return toast.error("اسم الموظف مطلوب")
        setSubmitting(true)
        try {
            const created = await createEmployeeAttendance({
                date: form.date,
                employee_name: form.employee_name.trim(),
                start_time: form.start_time || null,
                end_time: form.end_time || null,
                status: form.status,
                notes: form.notes || null,
            })
            setRows((p) => [created, ...p])
            setOpenCreate(false)
            toast.success("تم تسجيل المواظبة")
        } catch (e: any) {
            toast.error(e?.message || "فشل الحفظ")
        } finally {
            setSubmitting(false)
        }
    }

    const submitEdit = async () => {
        if (!openEdit) return
        if (!form.employee_name.trim()) return toast.error("اسم الموظف مطلوب")
        setSubmitting(true)
        try {
            const updated = await updateEmployeeAttendance(openEdit.id, {
                date: form.date,
                employee_name: form.employee_name.trim(),
                start_time: form.start_time || null,
                end_time: form.end_time || null,
                status: form.status,
                notes: form.notes || null,
            })
            setRows((p) => p.map((x) => (x.id === openEdit.id ? updated : x)))
            setOpenEdit(null)
            toast.success("تم التعديل")
        } catch (e: any) {
            toast.error(e?.message || "فشل التعديل")
        } finally {
            setSubmitting(false)
        }
    }

    const onDelete = async (id: number) => {
        if (!confirm("متأكد من حذف السجل؟")) return
        try {
            await deleteEmployeeAttendance(id)
            setRows((p) => p.filter((x) => x.id !== id))
            toast.success("تم الحذف")
        } catch (e: any) {
            toast.error(e?.message || "فشل الحذف")
        }
    }

    const columns = useMemo<ColumnDef<EmployeeAttendance>[]>(() => [
        { id: "idx", header: "#", cell: ({ row }) => row.index + 1 },

        { accessorKey: "employee_name", header: "الموظف" },

        { accessorKey: "date", header: "التاريخ" },

        { accessorKey: "start_time", header: "بداية", cell: ({ getValue }) => (getValue() as any) || "—" },

        { accessorKey: "end_time", header: "نهاية", cell: ({ getValue }) => (getValue() as any) || "—" },

        {
            accessorKey: "status",
            header: "الحالة",
            cell: ({ getValue }) => <StatusPill v={(getValue() as any) || "present"} />,
        },

        {
            id: "actions",
            header: "إجراءات",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(row.original)}>
                        تعديل
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(row.original.id)}>
                        حذف
                    </Button>
                </div>
            ),
        },
    ], [])

    return (
        <AppLayout>
            <Header title="مواظبة الموظفين" subtitle="إضافة / تعديل / حذف + تخزين محلي" />

            <div dir="rtl" className="space-y-3">
                {/* Filters */}
                <div className="flex flex-wrap items-end gap-2">
                    <Input
                        label="بحث"
                        placeholder="ابحث باسم الموظف…"
                        value={search}
                        onChange={(e) => {
                            setPage(1)
                            setSearch(e.target.value)
                        }}
                        className="w-72"
                    />

                    <Input label="من تاريخ" type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value) }} />
                    <Input label="إلى تاريخ" type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value) }} />

                    <div className="min-w-[200px]">
                        <label className="block text-sm text-gray-700 mb-1">الحالة</label>
                        <select
                            className="w-full h-10 rounded-2xl px-3"
                            style={{ border: "1px solid rgba(0,61,53,.22)", background: "#fff" }}
                            value={status}
                            onChange={(e) => { setPage(1); setStatus(e.target.value as any) }}
                        >
                            <option value="">الكل</option>
                            <option value="present">حاضر</option>
                            <option value="absent">غائب</option>
                            <option value="late">متأخر</option>
                            <option value="excused">مُعذّر</option>
                        </select>
                    </div>

                    <Button variant="outline" onClick={load}>تحديث</Button>
                    <Button onClick={openCreateModal}>تسجيل مواظبة</Button>
                </div>

                <DataTable columns={columns} data={rows} isLoading={loading} searchKey="employee_name" searchPlaceholder="بحث باسم الموظف…" />

                {meta && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>صفحة {meta.current_page} من {meta.last_page} — الإجمالي: {meta.total}</div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                السابق
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                                التالي
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="تسجيل مواظبة" footer={null}>
                <FormUI form={form} setForm={setForm} submitting={submitting} onSubmit={submitCreate} />
            </Modal>

            {/* Edit Modal */}
            <Modal open={!!openEdit} onClose={() => setOpenEdit(null)} title="تعديل مواظبة" footer={null}>
                <FormUI form={form} setForm={setForm} submitting={submitting} onSubmit={submitEdit} />
            </Modal>
        </AppLayout>
    )
}

function FormUI({
    form,
    setForm,
    submitting,
    onSubmit,
}: {
    form: FormState
    setForm: (v: FormState) => void
    submitting: boolean
    onSubmit: () => void
}) {
    return (
        <div dir="rtl" className="grid sm:grid-cols-2 gap-3">
            <Input label="التاريخ" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="اسم الموظف" value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} />

            <Input label="وقت الدخول" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="وقت الخروج" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />

            <div className="sm:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">الحالة</label>
                <select
                    className="w-full h-10 rounded-2xl px-3"
                    style={{ border: "1px solid rgba(0,61,53,.22)", background: "#fff" }}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                    <option value="present">حاضر</option>
                    <option value="absent">غائب</option>
                    <option value="late">متأخر</option>
                    <option value="excused">مُعذّر</option>
                </select>
            </div>

            <div className="sm:col-span-2">
                <Input label="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="sm:col-span-2 mt-2 flex gap-2">
                <Button disabled={submitting} onClick={onSubmit}>
                    حفظ
                </Button>
                <Button disabled={submitting} variant="outline" onClick={() => setForm(emptyForm())}>
                    إعادة ضبط
                </Button>
            </div>
        </div>
    )
}
