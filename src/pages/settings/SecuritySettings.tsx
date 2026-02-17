import { useState } from "react"
import { PageHeader } from "@/components/ui/page"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"
import api from "@/services/api"

export default function SecuritySettings() {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [current_password, setCurrent] = useState("")
    const [password, setPassword] = useState("")
    const [password_confirmation, setConfirm] = useState("")

    async function save() {
        setSaving(true)
        setError(null)
        setSuccess(null)
        try {
            // احتمالين شائعين
            try {
                await api.post("/auth/change-password", { current_password, password, password_confirmation })
            } catch {
                await api.post("/change-password", { current_password, password, password_confirmation })
            }
            setSuccess("تم تحديث كلمة المرور بنجاح")
            setCurrent("")
            setPassword("")
            setConfirm("")
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? "فشل العملية")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-4 sm:p-6">
            <PageHeader
                title="الأمان"
                subtitle="تغيير كلمة المرور"
                actions={
                    <Button onClick={save} disabled={saving}>
                        {saving ? "جارٍ الحفظ..." : "حفظ"}
                    </Button>
                }
            />

            {error && <EmptyState title="تعذر حفظ التغييرات" description={error} />}
            {success && <div className="mb-3 rounded-2xl border border-[var(--border)] p-3 text-sm">{success}</div>}

            <Card className="rounded-[28px]">
                <CardHeader className="pb-2">
                    <div className="text-base font-bold">تغيير كلمة المرور</div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <div className="mb-2 text-sm font-semibold">كلمة المرور الحالية</div>
                        <Input type="password" value={current_password} onChange={(e) => setCurrent(e.target.value)} />
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-semibold">كلمة مرور جديدة</div>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-semibold">تأكيد كلمة المرور</div>
                        <Input type="password" value={password_confirmation} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
