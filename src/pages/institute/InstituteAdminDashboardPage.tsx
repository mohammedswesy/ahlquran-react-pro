import { useEffect, useState } from "react"
import api from "@/services/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type InstituteRow = {
    id: number
    name: string
    country?: { name: string }
    city?: { name: string }
    organization?: { name: string }
    status?: number
    created_at?: string
}

type Stats = {
    institutes_count: number
    circles_count: number
    students_count: number
    teachers_count: number
}

type DashboardPayload = {
    stats: Stats
    institutes: InstituteRow[]
}

export default function InstituteAdminDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<DashboardPayload | null>(null)

    async function load() {
        try {
            setLoading(true)
            const res = await api.get("/institute/dashboard")
            setData(res.data?.data as DashboardPayload)
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "تعذر تحميل لوحة مدير المعهد")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    if (loading && !data) {
        return (
            <div className="p-4" dir="rtl">
                جاري تحميل لوحة مدير المعهد…
            </div>
        )
    }

    if (!data) {
        return (
            <div className="p-4 space-y-3" dir="rtl">
                <div className="text-red-600 font-medium">
                    لم يتم العثور على بيانات للمعاهد التي تديرها.
                </div>
                <Button variant="outline" onClick={load}>
                    إعادة المحاولة
                </Button>
            </div>
        )
    }

    const { stats, institutes } = data

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl font-bold">لوحة مدير المعهد</h1>
                <Button variant="outline" size="sm" onClick={load}>
                    تحديث
                </Button>
            </div>

            {/* الكروت العلوية */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="border-b p-4">
                        <div className="text-sm font-medium">عدد المعاهد</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.institutes_count}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b p-4">
                        <div className="text-sm font-medium">عدد الحلقات</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.circles_count}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b p-4">
                        <div className="text-sm font-medium">عدد الطلاب</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.students_count}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b p-4">
                        <div className="text-sm font-medium">عدد المعلمين</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.teachers_count}</div>
                    </CardContent>
                </Card>
            </div>

            {/* جدول المعاهد */}
            <Card>
                <CardHeader className="border-b p-4">
                    <div className="text-sm font-medium">المعاهد التي تديرها</div>
                </CardHeader>
                <CardContent>
                    {institutes.length === 0 ? (
                        <div className="text-sm text-gray-500">
                            لا توجد معاهد مرتبطة بحسابك كمدير.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border px-3 py-2 text-right">#</th>
                                        <th className="border px-3 py-2 text-right">اسم المعهد</th>
                                        <th className="border px-3 py-2 text-right">الدولة</th>
                                        <th className="border px-3 py-2 text-right">المدينة</th>
                                        <th className="border px-3 py-2 text-right">المنظمة</th>
                                        <th className="border px-3 py-2 text-right">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {institutes.map((inst, idx) => (
                                        <tr key={inst.id}>
                                            <td className="border px-3 py-1">{idx + 1}</td>
                                            <td className="border px-3 py-1">{inst.name}</td>
                                            <td className="border px-3 py-1">
                                                {inst.country?.name || "—"}
                                            </td>
                                            <td className="border px-3 py-1">
                                                {inst.city?.name || "—"}
                                            </td>
                                            <td className="border px-3 py-1">
                                                {inst.organization?.name || "—"}
                                            </td>
                                            <td className="border px-3 py-1">
                                                {inst.status === 1 ? "نشط" : "موقوف"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
