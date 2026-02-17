import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import type { ColumnDef } from "@tanstack/react-table"
import api from "@/services/api"
import { toast } from "sonner"

type Task = {
    id: number
    title: string
    status?: "open" | "in_progress" | "done" | string
    due_date?: string | null
    assignee?: string | null
}

export default function Tasks() {
    const [rows, setRows] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    async function load() {
        setLoading(true)
        try {
            const { data } = await api.get("/employee/tasks", { params: { per_page: 100 } })
            const src: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
            setRows(
                src.map(t => ({
                    id: Number(t?.id ?? 0),
                    title: String(t?.title ?? "").trim(),
                    status: t?.status ?? "open",
                    due_date: t?.due_date ?? null,
                    assignee: t?.assignee ?? t?.assignee_name ?? null,
                }))
            )
        } catch {
            toast.info("سيتم ربط المهام حال تجهيز الـ API")
            setRows([
                { id: 1, title: "مراجعة طلبات التسجيل", status: "in_progress", due_date: "2025-11-03", assignee: "أحمد" },
                { id: 2, title: "تنسيق جدول المعلمين", status: "open", due_date: "2025-11-06", assignee: "منى" },
            ])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    async function markDone(id: number) {
        setSaving(true)
        try {
            await api.post(`/employee/tasks/${id}/done`)
            setRows(prev => prev.map(r => r.id === id ? { ...r, status: "done" } : r))
            toast.success("تم تعليم المهمة كمكتملة")
        } catch {
            toast.error("تعذر تحديث المهمة")
        } finally {
            setSaving(false)
        }
    }

    const columns = useMemo<ColumnDef<Task>[]>(() => [
        { header: "#", cell: ({ row }) => row.index + 1 },
        { accessorKey: "title", header: "العنوان" },
        { accessorKey: "assignee", header: "المكلّف", cell: ({ getValue }) => getValue() || "—" },
        { accessorKey: "status", header: "الحالة" },
        { accessorKey: "due_date", header: "الاستحقاق", cell: ({ getValue }) => getValue() || "—" },
        {
            id: "actions",
            header: "إجراءات",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={row.original.status === "done" ? "ghost" : "outline"}
                        disabled={saving || row.original.status === "done"}
                        onClick={() => markDone(row.original.id)}
                    >
                        تعليم كمكتملة
                    </Button>
                </div>
            )
        }
    ], [saving])

    return (
        <AppLayout>
            <Header />
            <div className="p-4 space-y-4" dir="rtl">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">المهام</h1>
                    <Button variant="outline" onClick={load}>تحديث</Button>
                </div>

                <DataTable data={rows} columns={columns} isLoading={loading} />
            </div>
        </AppLayout>
    )
}
