import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import { Link } from "react-router-dom"
import api from "@/services/api"
import { toast } from "sonner"

type Row = {
    id: number
    name: string
    circle?: string | null
    teacher?: string | null
    status?: string | number | null
}

export default function Children() {
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            setLoading(true)
            try {
                // غيّر المسار لو مختلف
                const { data } = await api.get("/parent/children", { params: { per_page: 100 } })
                const src: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
                setRows(src.map(x => ({
                    id: Number(x?.id ?? x?._id ?? 0),
                    name: String(x?.name ?? "").trim(),
                    circle: x?.circle ?? x?.circle_name ?? null,
                    teacher: x?.teacher ?? x?.teacher_name ?? null,
                    status: x?.status ?? null,
                })))
            } catch {
                toast.info("سيتم ربط قائمة الأبناء حال تجهيز الـ API")
                setRows([])
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const columns = useMemo(() => [
        { key: "name", label: "الاسم" },
        { key: "circle", label: "الحلقة" },
        { key: "teacher", label: "المعلم" },
        { key: "status", label: "الحالة" },
        {
            key: "id",
            label: "",
            render: (r: Row) => (
                <div className="flex gap-2">
                    <Link to={`/parent/reports?child_id=${r.id}`}>
                        <Button size="sm" variant="outline">عرض التقارير</Button>
                    </Link>
                </div>
            )
        }
    ], [])

    return (
        <AppLayout>
            <Header />
            <div className="p-4 space-y-4" dir="rtl">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">أبنائي</h1>
                    <Link to="/parent/reports"><Button variant="outline">التقارير</Button></Link>
                </div>

                <DataTable data={rows} columns={columns as any} isLoading={loading} />
            </div>
        </AppLayout>
    )
}
