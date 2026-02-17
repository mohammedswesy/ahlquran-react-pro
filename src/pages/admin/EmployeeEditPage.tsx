import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import EmployeeForm, { type EmployeeFormValues } from "./EmployeeForm"
import { getEmployee, updateEmployee, type Employee } from "@/services/employees"
import { Button } from "@/components/ui/button"

export default function EmployeeEditPage() {
    const { id } = useParams()
    const nav = useNavigate()
    const [item, setItem] = useState<Employee | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        (async () => {
            try {
                if (!id) return
                const data = await getEmployee(Number(id))
                setItem(data)
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "تعذر تحميل بيانات الموظف")
            } finally {
                setLoading(false)
            }
        })()
    }, [id])

    const handleUpdate = async (v: EmployeeFormValues) => {
        if (!id) return
        setSaving(true)
        try {
            await updateEmployee(Number(id), v)
            toast.success("تم تحديث الموظف بنجاح")
            nav("/admin/employees")
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل التحديث")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-4" dir="rtl">جارِ التحميل…</div>

    if (!item) {
        return (
            <div className="p-4 space-y-3" dir="rtl">
                <div className="text-red-600 font-medium">لم يتم العثور على الموظف</div>
                <Button variant="outline" onClick={() => nav("/admin/employees")}>رجوع</Button>
            </div>
        )
    }

    return <EmployeeForm defaultValues={item} onSubmit={handleUpdate} submitting={saving} />
}
