import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getParent, updateParent, linkParentChildren } from "@/services/parents"
import { fetchStudents, type StudentRow } from "@/services/students"

type Relation = "father" | "mother" | "guardian"

export default function ParentEdit() {
    const { id } = useParams()
    const parentId = Number(id)
    const nav = useNavigate()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [savingChildren, setSavingChildren] = useState(false)

    // parent fields
    const [name, setName] = useState("")
    const [email, setEmail] = useState<string>("")
    const [mobile, setMobile] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [relation, setRelation] = useState<Relation>("father")

    // children link
    const [students, setStudents] = useState<StudentRow[]>([])
    const [selected, setSelected] = useState<number[]>([])
    const [search, setSearch] = useState("")

    const load = async () => {
        setLoading(true)
        try {
            const p = await getParent(parentId)

            // parent data
            setName(p.user?.name ?? "")
            setEmail(p.user?.email ?? "")
            setMobile(p.user?.mobile ?? "")
            setRelation(((p.relation_type as any) ?? "father") as Relation)

            // current children (students)
            const current = Array.isArray(p?.students) ? p.students.map((s: any) => Number(s.id)) : []
            setSelected(current)

            // all students for selection
            const res = await fetchStudents({ per_page: 500 })
            setStudents(res.data || [])
        } catch (e: any) {
            toast.error("تعذر تحميل ولي الأمر")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (parentId) load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentId])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return students
        return students.filter((s) => String(s.name ?? "").toLowerCase().includes(q))
    }, [students, search])

    const toggle = (sid: number) => {
        setSelected((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]))
    }

    const saveParent = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await updateParent(parentId, {
                name,
                email: email || null,
                mobile: mobile || null,
                password: password ? password : null,
                relation_type: relation,
            })
            toast.success("تم تحديث بيانات ولي الأمر ✅")
            setPassword("")
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل تحديث البيانات")
        } finally {
            setSaving(false)
        }
    }

    const saveChildren = async () => {
        setSavingChildren(true)
        try {
            await linkParentChildren(parentId, selected)
            toast.success("تم تحديث ربط الأبناء ✅")
            // إعادة تحميل لتحديث الواجهة + التأكد من الرد
            await load()
        } catch (e: any) {
            // لو في 422 (طلاب مربوطين بولي آخر) رح يطلع message
            toast.error(e?.response?.data?.message || "فشل تحديث الأبناء")
        } finally {
            setSavingChildren(false)
        }
    }

    return (
        <AppLayout>
            <Header
                title="تعديل ولي أمر"
                subtitle="تحديث البيانات + إضافة/حذف الأبناء"
                right={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => nav(`/admin/parents/${parentId}`)}>
                            عرض
                        </Button>
                        <Button variant="outline" onClick={() => nav(-1)}>
                            رجوع
                        </Button>
                    </div>
                }
            />

            {loading ? (
                <div className="mt-6 text-sm text-[var(--muted)]">جارٍ التحميل…</div>
            ) : (
                <div className="mt-4 space-y-4" dir="rtl">
                    {/* ===== Parent Info ===== */}
                    <form onSubmit={saveParent} className="space-y-4">
                        <div
                            className="rounded-[28px] border border-[var(--border)] p-5"
                            style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(12px)" }}
                        >
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
                                <Input label="الجوال" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                                <Input label="الإيميل" value={email} onChange={(e) => setEmail(e.target.value)} />
                                <Input
                                    label="كلمة مرور جديدة (اختياري)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                <label className="block space-y-1">
                                    <span className="text-sm text-[var(--muted)]">صلة القرابة</span>
                                    <select
                                        className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none"
                                        style={{ background: "rgba(255,255,255,.06)", color: "var(--text)" }}
                                        value={relation}
                                        onChange={(e) => setRelation(e.target.value as Relation)}
                                    >
                                        <option value="father">أب</option>
                                        <option value="mother">أم</option>
                                        <option value="guardian">ولي</option>
                                    </select>
                                </label>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <Button disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ بيانات ولي الأمر"}</Button>
                            </div>
                        </div>
                    </form>

                    {/* ===== Children Link ===== */}
                    <div
                        className="rounded-[28px] border border-[var(--border)] p-5"
                        style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(12px)" }}
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <div className="font-extrabold text-[var(--text)]">الأبناء</div>
                                <div className="text-xs text-[var(--muted)] mt-1">
                                    اضغط على الطالب لإضافته/إزالته ثم اضغط “حفظ ربط الأبناء”
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="بحث عن طالب…"
                                    className="h-10 w-64 rounded-2xl border border-[var(--border)] px-4 text-sm outline-none"
                                    style={{ background: "rgba(255,255,255,.06)", color: "var(--text)" }}
                                />
                                <Button onClick={saveChildren} disabled={savingChildren}>
                                    {savingChildren ? "جارٍ الحفظ…" : "حفظ ربط الأبناء"}
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {filtered.map((s) => {
                                const active = selected.includes(s.id)
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => toggle(s.id)}
                                        className="text-right rounded-2xl border px-4 py-3 transition"
                                        style={{
                                            borderColor: active ? "rgba(99,91,255,.55)" : "var(--border)",
                                            background: active ? "rgba(99,91,255,.18)" : "rgba(255,255,255,.04)",
                                            color: "var(--text)",
                                        }}
                                    >
                                        <div className="font-semibold">{s.name ?? `Student #${s.id}`}</div>
                                        <div className="text-xs text-[var(--muted)] mt-1">
                                            {active ? "✅ مرتبط (اضغط للإزالة)" : "اضغط للإضافة"}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-4 text-xs text-[var(--muted)]">
                            المحدد: <span className="font-semibold text-[var(--text)]">{selected.length}</span>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
