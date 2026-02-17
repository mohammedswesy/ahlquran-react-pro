import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import InstituteForm, { type InstituteFormValues } from "./InstituteForm"
import { getInstitute, updateInstitute, type Institute } from "@/services/institutes"
import { Button } from "@/components/ui/button"

export default function InstituteEditPage() {
    const { id } = useParams()
    const nav = useNavigate()
    const [item, setItem] = useState<Institute | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        (async () => {
            try {
                if (!id) return
                const data = await getInstitute(Number(id))
                setItem(data)
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "تعذر تحميل بيانات المعهد")
            } finally {
                setLoading(false)
            }
        })()
    }, [id])

    const handleUpdate = async (v: InstituteFormValues) => {
        if (!id) return
        setSaving(true)
        try {
            await updateInstitute(Number(id), v)
            toast.success("تم تحديث المعهد بنجاح")
            nav("/admin/institutes")
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل التحديث")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="p-4" dir="rtl">
                جاري التحميل…
            </div>
        )
    }

    if (!item) {
        return (
            <div className="p-4 space-y-3" dir="rtl">
                <div className="text-red-600 font-medium">لم يتم العثور على المعهد</div>
                <Button variant="outline" onClick={() => nav("/admin/institutes")}>رجوع</Button>
            </div>
        )
    }

    return <InstituteForm defaultValues={item} onSubmit={handleUpdate} submitting={saving} />
}
