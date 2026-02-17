import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/ui/page"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import EmptyState from "@/components/ui/empty-state"
import SkeletonTable from "@/components/ui/skeleton-table"
import { toast } from "sonner"

import {
    listLibrarySubCategories,
    createLibrarySubCategory,
    updateLibrarySubCategory,
    deleteLibrarySubCategory,
    type LibrarySubCategory,
} from "@/services/librarySubCategories"

// ✅ لو عندك خدمة Categories جاهزة استعملها بدل هاي
import { listLibraryCategories, type LibraryCategory } from "@/services/libraryCategories"

type FormState = {
    id?: number
    category_id: number | ""
    name: string
    order?: number | ""
    is_active?: boolean
    // للسوبر أدمن (اختياري)
    institute_id?: number | ""
}

export default function LibrarySubCategoriesPage() {
    const [loading, setLoading] = useState(true)
    const [rows, setRows] = useState<LibrarySubCategory[]>([])
    const [meta, setMeta] = useState<any>(null)

    const [categories, setCategories] = useState<LibraryCategory[]>([])

    const [page, setPage] = useState(1)
    const [perPage] = useState(15)
    const [search, setSearch] = useState("")
    const [categoryId, setCategoryId] = useState<string>("all")

    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<FormState>({
        category_id: "",
        name: "",
        order: "",
        is_active: true,
    })

    async function loadCategories() {
        try {
            const res = await listLibraryCategories({ per_page: 1000 })
            const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
            setCategories(data)
        } catch {
            setCategories([])
        }
    }

    async function load() {
        setLoading(true)
        try {
            const params: any = { page, per_page: perPage }
            if (search.trim()) params.search = search.trim()
            if (categoryId !== "all") params.category_id = Number(categoryId)

            const res = await listLibrarySubCategories(params)

            // يدعم paginate أو array
            if (Array.isArray(res?.data)) {
                setRows(res.data)
                setMeta(res.meta ?? res)
            } else if (Array.isArray(res)) {
                setRows(res)
                setMeta(null)
            } else {
                setRows(res?.data ?? [])
                setMeta(res?.meta ?? null)
            }
        } catch (e: any) {
            toast.error(e?.message ?? "فشل تحميل التصنيفات الفرعية")
            setRows([])
            setMeta(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCategories()
    }, [])

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, perPage])

    useEffect(() => {
        setPage(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, categoryId])

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, categoryId])

    const canPaginate = !!(meta?.last_page || meta?.current_page)

    const total = useMemo(() => meta?.total ?? rows.length, [meta, rows.length])

    function openCreate() {
        setForm({ category_id: "", name: "", order: "", is_active: true })
        setOpen(true)
    }

    function openEdit(r: LibrarySubCategory) {
        setForm({
            id: r.id,
            category_id: r.category_id ?? "",
            name: r.name ?? "",
            order: (r as any).order ?? "",
            is_active: (r as any).is_active ?? true,
        })
        setOpen(true)
    }

    async function onSubmit() {
        if (!form.category_id) return toast.error("اختر التصنيف الرئيسي أولاً")
        if (!form.name.trim()) return toast.error("اسم التصنيف الفرعي مطلوب")

        setSaving(true)
        try {
            const payload: any = {
                category_id: Number(form.category_id),
                name: form.name.trim(),
                order: form.order === "" || form.order === undefined ? undefined : Number(form.order),
                is_active: form.is_active ?? true,
            }

            if (form.id) {
                await updateLibrarySubCategory(form.id, payload)
                toast.success("تم تحديث التصنيف الفرعي")
            } else {
                await createLibrarySubCategory(payload)
                toast.success("تم إنشاء التصنيف الفرعي")
            }

            setOpen(false)
            await load()
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? e?.message ?? "فشل الحفظ")
        } finally {
            setSaving(false)
        }
    }

    async function onDelete(id: number) {
        if (!confirm("متأكد بدك تحذف التصنيف الفرعي؟")) return
        try {
            await deleteLibrarySubCategory(id)
            toast.success("تم الحذف")
            await load()
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? e?.message ?? "فشل الحذف")
        }
    }

    return (
        <div className="p-4 sm:p-6" dir="rtl">
            <PageHeader
                title="التصنيفات الفرعية"
                subtitle={`إدارة SubCategories داخل مكتبة المعهد (الإجمالي: ${total})`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={load} disabled={loading}>
                            تحديث
                        </Button>
                        <Button onClick={openCreate}>+ إضافة تصنيف فرعي</Button>
                    </div>
                }
            />

            {/* Filters */}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2">
                        <div className="text-base font-bold">بحث</div>
                    </CardHeader>
                    <CardContent>
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ابحث بالاسم..."
                        />
                    </CardContent>
                </Card>

                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2">
                        <div className="text-base font-bold">التصنيف الرئيسي</div>
                    </CardHeader>
                    <CardContent>
                        <select
                            className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            <option value="all">الكل</option>
                            {categories.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </CardContent>
                </Card>

                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2">
                        <div className="text-base font-bold">ملاحظة</div>
                    </CardHeader>
                    <CardContent className="text-sm text-[var(--muted)]">
                        التصنيفات الفرعية مربوطة بتصنيف رئيسي + Multi-tenant (حسب المعهد).
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="mt-4">
                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2">
                        <div className="text-base font-bold">القائمة</div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <SkeletonTable rows={8} />
                        ) : rows.length === 0 ? (
                            <EmptyState title="لا يوجد بيانات" description="ابدأ بإضافة تصنيف فرعي جديد." />
                        ) : (
                            <div className="overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-right border-b border-[var(--border)]">
                                            <th className="py-2">#</th>
                                            <th className="py-2">الاسم</th>
                                            <th className="py-2">التصنيف الرئيسي</th>
                                            <th className="py-2">الترتيب</th>
                                            <th className="py-2">الحالة</th>
                                            <th className="py-2">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r, idx) => (
                                            <tr key={r.id} className="border-b border-[var(--border)]">
                                                <td className="py-2">{idx + 1}</td>
                                                <td className="py-2 font-semibold">{r.name}</td>
                                                <td className="py-2">{r.category?.name ?? r.category_id}</td>
                                                <td className="py-2">{(r as any).order ?? "—"}</td>
                                                <td className="py-2">
                                                    <Badge variant="secondary">
                                                        {(r as any).is_active === false ? "موقوف" : "مفعّل"}
                                                    </Badge>
                                                </td>
                                                <td className="py-2">
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                                                            تعديل
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => onDelete(r.id)}>
                                                            حذف
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {canPaginate && (
                                    <div className="flex items-center justify-between mt-4">
                                        <Button
                                            variant="outline"
                                            disabled={!meta?.prev_page_url && (meta?.current_page ?? 1) <= 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        >
                                            السابق
                                        </Button>

                                        <div className="text-sm text-[var(--muted)]">
                                            صفحة {meta?.current_page ?? page} من {meta?.last_page ?? "—"}
                                        </div>

                                        <Button
                                            variant="outline"
                                            disabled={!meta?.next_page_url && meta?.current_page >= meta?.last_page}
                                            onClick={() => setPage((p) => p + 1)}
                                        >
                                            التالي
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Simple Modal (بدون shadcn dialog عشان ما نعتمد على تركيبك) */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-[28px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow2)]">
                        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                            <div className="font-extrabold">
                                {form.id ? "تعديل تصنيف فرعي" : "إضافة تصنيف فرعي"}
                            </div>
                            <button
                                className="text-sm text-[var(--muted)] hover:opacity-80"
                                onClick={() => setOpen(false)}
                            >
                                إغلاق
                            </button>
                        </div>

                        <div className="p-5 space-y-3">
                            <div className="space-y-1">
                                <div className="text-sm font-bold">التصنيف الرئيسي</div>
                                <select
                                    className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                                    value={String(form.category_id)}
                                    onChange={(e) =>
                                        setForm((s) => ({ ...s, category_id: e.target.value ? Number(e.target.value) : "" }))
                                    }
                                >
                                    <option value="">اختر...</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="text-sm font-bold">الاسم</div>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                                    placeholder="مثال: مخارج الحروف"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="text-sm font-bold">الترتيب</div>
                                    <Input
                                        type="number"
                                        value={String(form.order ?? "")}
                                        onChange={(e) => setForm((s) => ({ ...s, order: e.target.value === "" ? "" : Number(e.target.value) }))}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm font-bold">الحالة</div>
                                    <select
                                        className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2"
                                        value={(form.is_active ?? true) ? "1" : "0"}
                                        onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.value === "1" }))}
                                    >
                                        <option value="1">مفعّل</option>
                                        <option value="0">موقوف</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-[var(--border)] flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                                إلغاء
                            </Button>
                            <Button onClick={onSubmit} disabled={saving}>
                                {saving ? "جارٍ الحفظ..." : "حفظ"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
