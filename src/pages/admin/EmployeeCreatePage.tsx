import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import EmployeeForm, { type EmployeeFormValues } from "./EmployeeForm"
import { createEmployee } from "@/services/employees"

export default function EmployeeCreatePage() {
    const nav = useNavigate()

    const handleCreate = async (v: EmployeeFormValues) => {
        try {
            await createEmployee(v)
            toast.success("تم إنشاء الموظف بنجاح")
            nav("/admin/employees")
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل إنشاء الموظف")
        }
    }

    return <EmployeeForm onSubmit={handleCreate} />
}
