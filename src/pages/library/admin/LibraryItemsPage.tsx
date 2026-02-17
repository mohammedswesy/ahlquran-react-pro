import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/ui/page"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import EmptyState from "@/components/ui/empty-state"
import SkeletonTable from "@/components/ui/skeleton-table"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import {
    listLibraryItems,
    createLibraryItem,
    updateLibraryItem,
    deleteLibraryItem,
    type LibraryItem,
    type LibraryItemType,
} from "@/services/libraryItems"

import {
    listLibraryCategories,
    type LibraryCategory,
} from "@/services/libraryCategories"

import {
    listLibrarySubCategories,
    type LibrarySubCategory,
} from "@/services/librarySubCategories"

function apiBaseWithoutApi() {
    const base = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
    return String(base).replace(/\/api\/?$/, "")
}

function storageUrl(filePath?: string | null) {
    if (!filePath) return null
    return `${apiBaseWithoutApi()}/storage/${filePath}`
}

function typeLabel(t: LibraryItemType) {
    switch (t) {
        case "pdf": return "PDF"
        case "audio": return "Audio"
        case "video": return "Video"
        case "document": return "Document"
        default: return t
    }
}

type FormState = {
    category_id: string
    sub_category_id: string
    title: string
    description: string
    type: LibraryItemType
    external_url: string
    file: File | null
}

const EMPTY_FORM: FormState = {
    category_id: "",
    sub_category_id: "none",
    title: "",
    description: "",
    type: "pdf",
    external_url: "",
    file: null,
}

export default function LibraryItemsPage() {
    // list state
    const [loading, setLoading] = useState(true)
    const [rows, setRows] = useState<LibraryItem[]>([])
    const [meta, setMeta] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    // filters
    const [page, setPage] = useState(1)
    const [perPage] = useState(15)
    const [search, setSearch] = useState("")
    const [categoryId, setCategoryId] = useState<string>("all")
    const [subCategoryId, setSubCategoryId] = useState<string>("all")
    const [type, setType] = useState<LibraryItemType | "all">("all")

    // options
    const [categories, setCategories] = useState<LibraryCategory[]>([])
    const [subCategories, setSubCategories] = useState<LibrarySubCategory[]>([])

    // modal
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [mode, setMode] = useState<"create" | "edit">("create")
    const [editing, setEditing] = useState<LibraryItem | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)

    const subcatsForSelectedCategory = useMemo(() => {
        // عند الفلتر: لو category = all رجّع كل subcats
        if (categoryId === "all") return subCategories
        return subCategories.filter((s) => String(s.category_id) === String(categoryId))
    }, [subCategories, categoryId])

    async function loadCategories() {
        try {
            const res = await listLibraryCategories({ per_page: 1000 })
            const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
            setCategories(data)
        } catch {
            // ignore
        }
    }

    async function loadSubCategories(cat?: number) {
        try {
            const params: any = { per_page: 1000 }
            if (cat) params.category_id = cat
            const res = await listLibrarySubCategories(params)
            const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
            setSubCategories(data)
        } catch {
            setSubCategories([])
        }
    }

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const params: any = { page, per_page: perPage }
            if (search.trim()) params.search = search.trim()
            if (categoryId !== "all") params.category_id = Number(categoryId)
            if (subCategoryId !== "all") params.sub_category_id = Number(subCategoryId)
            if (type !== "all") params.type = type

            const res = await listLibraryItems(params)

            // توقع: { data, meta } أو Pagination Laravel
            const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
            setRows(data)
            setMeta(res?.meta ?? res) // بعض المشاريع بتحط meta داخل res
        } catch (e: any) {
            setRows([])
            setMeta(null)
            setError(e?.message ?? "حدث خطأ")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCategories()
        loadSubCategories()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // reset page on filters change
    useEffect(() => {
        setPage(1)
    }, [search, categoryId, subCategoryId, type])

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search, categoryId, subCategoryId, type])

    function openCreate() {
        setMode("create")
        setEditing(null)
        setForm(EMPTY_FORM)
        setOpen(true)
    }

    function openEdit(item: LibraryItem) {
        setMode("edit")
        setEditing(item)
        setForm({
            category_id: String(item.category_id ?? ""),
            sub_category_id: item.sub_category_id ? String(item.sub_category_id) : "none",
            title: item.title ?? "",
            description: item.description ?? "",
            type: item.type ?? "pdf",
            external_url: item.external_url ?? "",
            file: null,
        })
        setOpen(true)
    }

    async function onSubmit() {
        // basic validation
        if (!form.category_id) {
            toast.error("اختر التصنيف الرئيسي")
            return
        }
        if (!form.title.trim()) {
            toast.error("العنوان مطلوب")
            return
        }
        // لازم واحد من (file أو external_url) على الأقل (اختياري بس أفضل)
        if (!form.file && !form.external_url.trim() && mode === "create") {
            toast.error("ارفع ملف أو ضع رابط خارجي")
            return
        }

        setSaving(true)
        try {
            const fd = new FormData()
            fd.append("category_id", String(form.category_id))
            if (form.sub_category_id && form.sub_category_id !== "none") {
                fd.append("sub_category_id", String(form.sub_category_id))
            }
            fd.append("title", form.title.trim())
            if (form.description.trim()) fd.append("description", form.description.trim())
            fd.append("type", form.type)

            // external url optional
            if (form.external_url.trim()) fd.append("external_url", form.external_url.trim())

            // file optional
            if (form.file) fd.append("file", form.file)

            if (mode === "create") {
                await createLibraryItem(fd)
                toast.success("تمت الإضافة بنجاح")
            } else {
                if (!editing) return
                await updateLibraryItem(editing.id, fd)
                toast.success("تم التحديث بنجاح")
            }

            setOpen(false)
            setForm(EMPTY_FORM)
            await load()
        } finally {
            setSaving(false)
        }
    }

    async function onDelete(item: LibraryItem) {
        const ok = confirm(`حذف "${item.title}" ؟`)
        if (!ok) return
        try {
            await deleteLibraryItem(item.id)
            toast.success("تم الحذف")
            await load()
        } catch {
            // handled by interceptor
        }
    }

    return (
        <div className="p-4 sm:p-6">
            <PageHeader
                title="Library Items"
                subtitle="إدارة عناصر المكتبة: رفع ملفات + روابط خارجية + تصنيف حسب Category/SubCategory"
                actions={
                    <div className="flex gap-2">
                        <Button onClick={openCreate} className="rounded-2xl font-bold">
                            + عنصر جديد
                        </Button>
                    </div>
                }
            />

            {/* Filters */}
            <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2"><div className="text-base font-bold">بحث</div></CardHeader>
                    <CardContent>
                        <Input
                            placeholder="ابحث بالعنوان..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </CardContent>
                </Card>

                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2"><div className="text-base font-bold">Category</div></CardHeader>
                    <CardContent>
                        <Select value={categoryId} onValueChange={(v) => {
                            setCategoryId(v)
                            // لو غير category و subcategory الحالية مش مناسبة
                            setSubCategoryId("all")
                            // (اختياري) تجيب subcats تبع هاد الكاتيجوري بس
                            if (v !== "all") loadSubCategories(Number(v))
                            else loadSubCategories()
                        }}>
                            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2"><div className="text-base font-bold">SubCategory</div></CardHeader>
                    <CardContent>
                        <Select value={subCategoryId} onValueChange={setSubCategoryId}>
                            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                {subcatsForSelectedCategory.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2"><div className="text-base font-bold">Type</div></CardHeader>
                    <CardContent>
                        <Select value={type} onValueChange={(v) => setType(v as any)}>
                            <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="mt-3">
                <Card className="rounded-[28px]">
                    <CardHeader className="pb-2">
                        <div className="text-base font-bold">Items</div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <SkeletonTable rows={8} />
                        ) : error ? (
                            <EmptyState title="تعذر تحميل البيانات" description={error} />
                        ) : rows.length === 0 ? (
                            <EmptyState title="لا يوجد بيانات" description="جرّب تغيير الفلاتر أو البحث." />
                        ) : (
                            <>
                                <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-right border-b border-[var(--border)]">
                                                <th className="py-2">العنوان</th>
                                                <th className="py-2">التصنيف</th>
                                                <th className="py-2">النوع</th>
                                                <th className="py-2">المصدر</th>
                                                <th className="py-2">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((r) => {
                                                const file = storageUrl(r.file_path)
                                                const hasExternal = Boolean(r.external_url)
                                                return (
                                                    <tr key={r.id} className="border-b border-[var(--border)] align-top">
                                                        <td className="py-2">
                                                            <div className="font-bold">{r.title}</div>
                                                            {r.description ? (
                                                                <div className="text-muted-foreground mt-1 line-clamp-2">{r.description}</div>
                                                            ) : null}
                                                        </td>
                                                        <td className="py-2">
                                                            <div>{r.category?.name ?? `#${r.category_id}`}</div>
                                                            <div className="text-muted-foreground">
                                                                {r.subCategory?.name ?? (r.sub_category_id ? `#${r.sub_category_id}` : "—")}
                                                            </div>
                                                        </td>
                                                        <td className="py-2">
                                                            <Badge variant="secondary">{typeLabel(r.type)}</Badge>
                                                        </td>
                                                        <td className="py-2">
                                                            <div className="flex flex-col gap-1">
                                                                {file ? (
                                                                    <a className="underline" href={file} target="_blank" rel="noreferrer">
                                                                        عرض الملف
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-muted-foreground">لا يوجد ملف</span>
                                                                )}
                                                                {hasExternal ? (
                                                                    <a className="underline" href={r.external_url!} target="_blank" rel="noreferrer">
                                                                        رابط خارجي
                                                                    </a>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        <td className="py-2">
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="secondary"
                                                                    className="rounded-2xl"
                                                                    onClick={() => openEdit(r)}
                                                                >
                                                                    تعديل
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    className="rounded-2xl"
                                                                    onClick={() => onDelete(r)}
                                                                >
                                                                    حذف
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {meta?.last_page ? (
                                    <div className="flex items-center justify-between mt-4">
                                        <Button
                                            variant="secondary"
                                            className="rounded-2xl"
                                            disabled={!meta?.prev_page_url && page <= 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        >
                                            السابق
                                        </Button>

                                        <div className="text-sm text-muted-foreground">
                                            صفحة {meta?.current_page ?? page} من {meta?.last_page ?? "?"}
                                        </div>

                                        <Button
                                            variant="secondary"
                                            className="rounded-2xl"
                                            disabled={!meta?.next_page_url && (meta?.current_page >= meta?.last_page)}
                                            onClick={() => setPage((p) => p + 1)}
                                        >
                                            التالي
                                        </Button>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={mode === "create" ? "إضافة عنصر مكتبة" : "تعديل عنصر مكتبة"}
                description="ارفع ملف أو ضع رابط خارجي. الملف اختياري أثناء التعديل."
            >
                <div className="grid gap-3">
                    <div className="grid gap-2">
                        <Label>Category</Label>
                        <Select
                            value={form.category_id || ""}
                            onValueChange={(v) => {
                                setForm((f) => ({ ...f, category_id: v, sub_category_id: "none" }))
                            }}
                        >
                            <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>SubCategory (اختياري)</Label>
                        <Select
                            value={form.sub_category_id}
                            onValueChange={(v) => setForm((f) => ({ ...f, sub_category_id: v }))}
                        >
                            <SelectTrigger><SelectValue placeholder="اختر (اختياري)" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">بدون</SelectItem>
                                {subCategories
                                    .filter((s) => String(s.category_id) === String(form.category_id))
                                    .map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="عنوان العنصر"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Description (اختياري)</Label>
                        <Input
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="وصف مختصر"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select
                            value={form.type}
                            onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))}
                        >
                            <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>External URL (اختياري)</Label>
                        <Input
                            value={form.external_url}
                            onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>File Upload (اختياري)</Label>
                        <Input
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null
                                setForm((f) => ({ ...f, file }))
                            }}
                        />
                        {mode === "edit" && editing?.file_path ? (
                            <div className="text-xs text-muted-foreground">
                                الملف الحالي موجود — لو بدك تغيّره ارفع ملف جديد.
                            </div>
                        ) : null}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" className="rounded-2xl" onClick={() => setOpen(false)}>
                            إلغاء
                        </Button>
                        <Button className="rounded-2xl font-bold" disabled={saving} onClick={onSubmit}>
                            {saving ? "جارٍ الحفظ..." : "حفظ"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
