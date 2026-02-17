import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { deleteParent, getParent } from "@/services/parents"

function relToAr(rel?: string | null) {
    const v = (rel || "").toLowerCase()
    if (v === "father") return "أب"
    if (v === "mother") return "أم"
    if (v === "guardian") return "ولي"
    return rel || "—"
}

export default function ParentShow() {
    const { id } = useParams()
    const parentId = Number(id)
    const nav = useNavigate()

    const [loading, setLoading] = useState(true)
    const [p, setP] = useState<any>(null)

    const load = async () => {
        setLoading(true)
        try {
            const parent = await getParent(parentId)
            setP(parent)
        } catch (e: any) {
            toast.error("تعذر تحميل بيانات ولي الأمر")
            setP(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (parentId) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentId])

    const onDelete = async () => {
        if (!confirm("هل أنت متأكد من حذف ولي الأمر؟")) return
        try {
            await deleteParent(parentId)
            toast.success("تم الحذف ✅")
            nav("/admin/parents", { replace: true })
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل الحذف")
        }
    }

    const u = p?.user
    const kids = Array.isArray(p?.students) ? p.students : []

    return (
        <AppLayout>
            <Header
                title="عرض ولي أمر"
                subtitle="تفاصيل ولي الأمر"
                right={
                    <div className="flex items-center gap-2">
                        <Link to={`/admin/parents/${parentId}/edit`}>
                            <Button variant="outline">تعديل / ربط الأبناء</Button>
                        </Link>
                        <Button variant="outline" onClick={onDelete}>حذف</Button>
                        <Link to="/admin/parents">
                            <Button variant="outline">رجوع</Button>
                        </Link>
                    </div>
                }
            />

            {loading ? (
                <div className="mt-6 text-sm text-[var(--muted)]">جارٍ التحميل…</div>
            ) : !p ? (
                <div className="mt-6 text-sm text-[var(--muted)]">غير موجود</div>
            ) : (
                <div className="mt-4 space-y-4" dir="rtl">
                    {/* Info */}
                    <div
                        className="rounded-[28px] border border-[var(--border)] p-5"
                        style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(12px)" }}
                    >
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-[var(--muted)]">الاسم</div>
                                <div className="text-lg font-extrabold text-[var(--text)]">{u?.name ?? "—"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--muted)]">صلة القرابة</div>
                                <div className="text-lg font-extrabold text-[var(--text)]">{relToAr(p?.relation_type)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--muted)]">الجوال</div>
                                <div className="text-[var(--text)]">{u?.mobile ?? "—"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--muted)]">الإيميل</div>
                                <div className="text-[var(--text)]">{u?.email ?? "—"}</div>
                            </div>
                        </div>
                    </div>

                    {/* Children (عرض فقط) */}
                    <div
                        className="rounded-[28px] border border-[var(--border)] p-5"
                        style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(12px)" }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="font-extrabold text-[var(--text)]">الأبناء</div>
                                <div className="text-xs text-[var(--muted)] mt-1">الأبناء المرتبطون بهذا الولي</div>
                            </div>

                            <Link to={`/admin/parents/${parentId}/edit`}>
                                <Button size="sm" variant="outline">تعديل الربط</Button>
                            </Link>
                        </div>

                        <div className="mt-4">
                            {kids.length === 0 ? (
                                <div className="text-sm text-[var(--muted)]">لا يوجد أبناء مرتبطين.</div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {kids.map((s: any) => (
                                        <span
                                            key={s.id}
                                            className="rounded-full border px-3 py-1 text-sm"
                                            style={{ background: "rgba(255,255,255,.04)", borderColor: "var(--border)", color: "var(--text)" }}
                                        >
                                            {s.name ?? `Student #${s.id}`}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
