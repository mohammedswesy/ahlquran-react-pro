import { useEffect, useState } from "react"
import { PageHeader } from "@/components/ui/page"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"
import api from "@/services/api"

type Me = {
    id: number
    name?: string
    email?: string
    mobile?: string
}

export default function ProfileSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [me, setMe] = useState<Me | null>(null)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [mobile, setMobile] = useState("")

    async function load() {
        setLoading(true)
        setError(null)
        try {
            // أغلب مشاريعكم فيها /auth/me
            const res = await api.get("/auth/me")
            const data = (res as any)?.data?.data ?? (res as any)?.data ?? null
            setMe(data)
            setName(data?.name ?? "")
            setEmail(data?.email ?? "")
            setMobile(data?.mobile ?? data?.phone ?? "")
        } catch (e: any) {
            setError(e?.message ?? "تعذر تحميل البيانات")
        } finally {
            setLoading(false)
        }
    }

    async function save() {
        if (!me?.id) return
        setSaving(true)
        setError(null)
        try {
            // هذا endpoint قد يختلف عندك:
            // جرّبت أفضل احتمالين شائعين:
            // 1) PATCH /users/{id}
            // 2) PATCH /profile
            try {
                await api.patch(`/users/${me.id}`, { name, email, mobile })
            } catch {
                await api.patch(`/profile`, { name, email, mobile })
            }
            await load()
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? "فشل الحفظ")
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    return (
        <div className="p-4 sm:p-6">
            <PageHeader
                title="إعدادات الحساب"
                subtitle="تحديث بياناتك الشخصية"
                actions={
                    <Button onClick={save} disabled={saving || loading}>
                        {saving ? "جارٍ الحفظ..." : "حفظ"}
                    </Button>
                }
            />

            {loading ? (
                <Card className="rounded-[28px]">
                    <CardContent className="py-10 opacity-70">جارٍ التحميل...</CardContent>
                </Card>
            ) : error ? (
                <EmptyState title="حدث خطأ" description={error} />
            ) : (
                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2">
                        <div className="text-base font-bold">البيانات الأساسية</div>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <div className="mb-2 text-sm font-semibold">الاسم</div>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" />
                        </div>

                        <div>
                            <div className="mb-2 text-sm font-semibold">البريد</div>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                        </div>

                        <div className="md:col-span-2">
                            <div className="mb-2 text-sm font-semibold">الجوال</div>
                            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="05xxxxxx" />
                        </div>

                        <div className="md:col-span-2 text-xs opacity-70">
                            إذا ظهر خطأ عند الحفظ، غالبًا Endpoint التحديث مختلف في الباك — ابعتلي رسالة الخطأ وسأوصلك بالـ endpoint الصحيح فورًا.
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
