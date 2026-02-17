import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createParent, linkParentChildren } from "@/services/parents"
import { fetchStudents, type StudentRow } from "@/services/students"

type Relation = "father" | "mother" | "guardian"

export default function ParentCreate() {
    const nav = useNavigate()
    const [loading, setLoading] = useState(false)

    // parent user data
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [mobile, setMobile] = useState("")
    const [password, setPassword] = useState("12345678")

    // parent profile
    const [relation, setRelation] = useState<Relation>("father")

    // children
    const [students, setStudents] = useState<StudentRow[]>([])
    const [selected, setSelected] = useState<number[]>([])
    const [search, setSearch] = useState("")

    useEffect(() => {
        ; (async () => {
            try {
                const res = await fetchStudents({ per_page: 500 })
                setStudents(res.data || [])
            } catch {
                setStudents([])
            }
        })()
    }, [])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return students
        return students.filter((s) => String(s.name ?? "").toLowerCase().includes(q))
    }, [students, search])

    const toggle = (id: number) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return toast.error("الاسم مطلوب")
        if (!mobile.trim() && !email.trim()) return toast.error("أدخل رقم جوال أو بريد")
        if (selected.length === 0) return toast.error("اختر طفلًا واحدًا على الأقل")

        setLoading(true)
        try {
            // 1) create parent (user + parent profile)
            const parent = await createParent({
                name,
                email: email || null,
                mobile: mobile || null,
                password,
                relation_type: relation,
            })

            // 2) link children
            await linkParentChildren(parent.id, selected)

            toast.success("تم إنشاء ولي الأمر وربطه بالأبناء بنجاح ✅")
            nav("/admin/parents", { replace: true })
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "فشل الحفظ")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AppLayout>
            <Header title="إضافة ولي أمر" subtitle="إنشاء حساب ولي أمر وربطه بأبنائه" />

            <form onSubmit={submit} className="mt-4 space-y-4" dir="rtl">
                {/* Parent info */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Input label="اسم ولي الأمر" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد محمد" />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="الجوال" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="059xxxxxxx" />
                        <Input label="البريد (اختياري)" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                    </div>
                    <Input label="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
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

                {/* Children picker */}
                <div
                    className="rounded-[28px] border border-[var(--border)] p-4"
                    style={{ background: "rgba(255,255,255,.06)", backdropFilter: "blur(12px)" }}
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <div className="font-extrabold text-[var(--text)]">ربط الأبناء</div>
                            <div className="text-xs text-[var(--muted)] mt-1">اختر طفلًا أو أكثر لربطهم بولي الأمر</div>
                        </div>

                        <div className="w-full md:w-80">
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن طالب…" />
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
                                        {active ? "✅ تم الاختيار" : "اضغط للاختيار"}
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-4 text-xs text-[var(--muted)]">
                        المحدد: <span className="font-semibold text-[var(--text)]">{selected.length}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button disabled={loading}>{loading ? "جارٍ الحفظ..." : "حفظ"}</Button>
                    <Button type="button" variant="outline" onClick={() => nav(-1)}>رجوع</Button>
                </div>
            </form>
        </AppLayout>
    )
}
