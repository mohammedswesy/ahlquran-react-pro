import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/ui/datatable"
import api from "@/services/api"
import { toast } from "sonner"
import { PiClipboardTextBold, PiCheckCircleBold, PiUsersThreeBold } from "react-icons/pi"

type TaskRow = { id: number; title: string; status?: string; due_date?: string | null }

export default function EmployeeDashboard() {
    const [loading, setLoading] = useState(true)
    const [totals, setTotals] = useState<any>({ tasks: 0, done: 0, people: 0 })
    const [recentTasks, setRecentTasks] = useState<TaskRow[]>([])

    useEffect(() => {
        (async () => {
            setLoading(true)
            try {
                // غيّر المسار لو مختلف عندك
                const { data } = await api.get("/employee/dashboard")
                setTotals(data?.totals ?? { tasks: 0, done: 0, people: 0 })
                const src: any[] = Array.isArray(data?.recentTasks) ? data.recentTasks : []
                setRecentTasks(
                    src.map(x => ({
                        id: Number(x?.id ?? 0),
                        title: String(x?.title ?? "").trim(),
                        status: String(x?.status ?? "open"),
                        due_date: x?.due_date ?? null,
                    }))
                )
            } catch {
                toast.info("سيتم ربط لوحة الموظف حال تجهيز الـ API")
                setTotals({ tasks: 8, done: 5, people: 23 })
                setRecentTasks([
                    { id: 1, title: "تحضير تقرير أسبوعي", status: "open", due_date: "2025-11-05" },
                    { id: 2, title: "أرشفة مستندات الطلبة", status: "done", due_date: "2025-10-28" },
                ])
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const cols = useMemo(
        () => [
            { key: "title", label: "المهمة" },
            { key: "status", label: "الحالة" },
            { key: "due_date", label: "تاريخ الاستحقاق" },
        ],
        []
    )

    return (
        <AppLayout>
            <Header />

            <div className="space-y-6" dir="rtl">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-extrabold text-gray-800">لوحة الموظف</h1>
                    <div className="flex gap-2">
                        <Link to="/employee/tasks"><Button variant="outline">المهام</Button></Link>
                        <Link to="/employee/people"><Button variant="outline">الأشخاص</Button></Link>
                    </div>
                </div>

                {/* بطاقات سريعة */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: "إجمالي المهام", value: totals.tasks, Icon: PiClipboardTextBold },
                        { title: "المهام المنجزة", value: totals.done, Icon: PiCheckCircleBold },
                        { title: "الأشخاص", value: totals.people, Icon: PiUsersThreeBold },
                    ].map((s, i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">{s.title}</div>
                                <s.Icon className="text-[var(--primary)]" size={18} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold">{s.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* آخر المهام */}
                <Card>
                    <CardHeader className="font-bold">آخر المهام</CardHeader>
                    <CardContent>
                        <DataTable data={recentTasks} columns={cols as any} isLoading={loading} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
