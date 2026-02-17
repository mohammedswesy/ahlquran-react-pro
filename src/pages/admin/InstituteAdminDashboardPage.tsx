import { useEffect, useState } from "react"
import { fetchInstituteAdminDashboard, type InstituteAdminDashboardResponse } from "@/services/instituteAdminDashboard"
import { Button } from "@/components/ui/button"
import SkeletonTable from "@/components/ui/skeleton-table"
import { toast } from "sonner"

export default function InstituteAdminDashboardPage() {
    const [data, setData] = useState<InstituteAdminDashboardResponse | null>(null)
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetchInstituteAdminDashboard()
            setData(res)
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "تعذر تحميل لوحة مدير المعهد")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    return (
        <div className="space-y-4" dir="rtl">
            <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl font-semibold">لوحة مدير المعهد</h1>
                <Button size="sm" variant="outline" onClick={load}>تحديث</Button>
            </div>

            {/* الكروت */}
            {data ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="المعاهد التي تديرها" value={data.stats.institutes_count} />
                    <StatCard label="عدد الحلقات" value={data.stats.circles_count} />
                    <StatCard label="عدد الطلاب" value={data.stats.students_count} />
                    <StatCard label="عدد المعلمين" value={data.stats.teachers_count} />
                </div>
            ) : loading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                    <div className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                    <div className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                    <div className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                </div>
            ) : null}

            {/* جدول المعاهد */}
            {loading ? (
                <SkeletonTable rows={4} cols={4} />
            ) : !data || data.institutes.length === 0 ? (
                <div className="border rounded-xl p-6 text-center text-sm text-gray-500">
                    لا توجد معاهد مرتبطة بحسابك كمدير.
                </div>
            ) : (
                <div className="border rounded-xl bg-white overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-right font-semibold">#</th>
                                <th className="px-3 py-2 text-right font-semibold">اسم المعهد</th>
                                <th className="px-3 py-2 text-right font-semibold">الدولة</th>
                                <th className="px-3 py-2 text-right font-semibold">المدينة</th>
                                <th className="px-3 py-2 text-right font-semibold">المنظمة</th>
                                <th className="px-3 py-2 text-right font-semibold">الموظفون</th>
                                <th className="px-3 py-2 text-right font-semibold">الحلقات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.institutes.map((inst, idx) => (
                                <tr key={inst.id} className="border-t">
                                    <td className="px-3 py-2">{idx + 1}</td>
                                    <td className="px-3 py-2 font-medium">{inst.name}</td>
                                    <td className="px-3 py-2">
                                        {inst.country?.name ?? "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                        {inst.city?.name ?? "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                        {inst.organization?.name ?? "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                        {inst.employees_count ?? 0}
                                    </td>
                                    <td className="px-3 py-2">
                                        {inst.circles_count ?? 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border bg-white px-4 py-3">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-2xl font-semibold">{value}</div>
        </div>
    )
}
