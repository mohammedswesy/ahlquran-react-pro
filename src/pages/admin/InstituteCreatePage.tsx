import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import InstituteForm, { type InstituteFormValues } from "./InstituteForm"
import { createInstitute } from "@/services/institutes"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function InstituteCreatePage() {
    const nav = useNavigate()
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)

    const handleCreate = async (v: InstituteFormValues) => {
        try {
            const created = await createInstitute(v)
            toast.success("تم إنشاء المعهد بنجاح")

            if (created.admin_credentials?.email && created.admin_credentials?.password) {
                setCredentials(created.admin_credentials)
                return
            }

            nav("/admin/institutes")
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل إنشاء المعهد")
        }
    }

    return (
        <>
            <InstituteForm mode="create" onSubmit={handleCreate} />

            <Modal
                open={!!credentials}
                onClose={() => setCredentials(null)}
                title="بيانات مدير المعهد"
                description="تُعرض مرة واحدة فقط. يرجى حفظها الآن."
                footer={null}
            >
                <div className="space-y-3" dir="rtl">
                    <div className="rounded-lg border p-3 bg-slate-50">
                        <div className="text-xs text-gray-500 mb-1">البريد الإلكتروني</div>
                        <div className="font-mono text-sm">{credentials?.email ?? "—"}</div>
                    </div>
                    <div className="rounded-lg border p-3 bg-slate-50">
                        <div className="text-xs text-gray-500 mb-1">كلمة المرور</div>
                        <div className="font-mono text-sm">{credentials?.password ?? "—"}</div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(
                                        `email: ${credentials?.email ?? ""}\npassword: ${credentials?.password ?? ""}`
                                    )
                                    toast.success("تم نسخ البيانات")
                                } catch {
                                    toast.error("تعذر النسخ")
                                }
                            }}
                        >
                            نسخ
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setCredentials(null)
                                nav("/admin/institutes")
                            }}
                        >
                            تم
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
