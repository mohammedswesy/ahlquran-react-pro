import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import InstituteForm, { type InstituteFormValues } from "./InstituteForm"
import { createInstitute } from "@/services/institutes"

export default function InstituteCreatePage() {
    const nav = useNavigate()

    const handleCreate = async (v: InstituteFormValues) => {
        try {
            await createInstitute(v)
            toast.success("تم إنشاء المعهد بنجاح")
            nav("/admin/institutes")
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل إنشاء المعهد")
        }
    }

    return <InstituteForm mode="create" onSubmit={handleCreate} />
}
