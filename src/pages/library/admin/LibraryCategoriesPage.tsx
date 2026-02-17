import { useEffect, useState } from "react"
import { PageHeader } from "@/components/ui/page"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"
import SkeletonTable from "@/components/ui/skeleton-table"
import { toast } from "sonner"
import {
    listLibraryCategories,
    createLibraryCategory,
    updateLibraryCategory,
    deleteLibraryCategory,
    type LibraryCategory,
} from "@/services/libraryCategories"

export default function LibraryCategoriesPage() {
    const [loading, setLoading] = useState(true)
    const [rows, setRows] = useState<LibraryCategory[]>([])
    const [search, setSearch] = useState("")
    const [name, setName] = useState("")
    const [saving, setSaving] = useState(false)

    async function load() {
        setLoading(true)
        try {
            const res = await listLibraryCategories({ per_page: 200, search })
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
            setRows(data)
        } catch (e: any) {
            toast.error(e?.message ?? "فشل تحميل التصنيفات")
            setRows([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, []) // eslint-disable-line

    async function onCreate() {
        if (!name.trim()) return toast.error("اكتب اسم التصنيف")
        setSaving(true)
        try {
            await createLibraryCategory({ name: name.trim(), order: 0, is_active: true })
            setName("")
            toast.success("تمت الإضافة")
            load()
        } catch (e: any) {
            toast.error(e?.message ?? "فشل الإضافة")
        } finally {
            setSaving(false)
        }
    }

    async function onRename(id: number) {
        const next = prompt("اسم جديد للتصنيف؟")
        if (!next?.trim()) return
        try {
            await updateLibraryCategory(id, { name: next.trim() })
            toast.success("تم التعديل")
            load()
        } catch (e: any) {
            toast.error(e?.message ?? "فشل التعديل")
        }
    }

    async function onDelete(id: number) {
        if (!confirm("حذف التصنيف؟")) return
        try {
            await deleteLibraryCategory(id)
            toast.success("تم الحذف")
            load()
        } catch (e: any) {
            toast.error(e?.message ?? "فشل الحذف")
        }
    }

    return (
        <div className="p-4 sm:p-6">
            <PageHeader
                title="المكتبة: التصنيفات"
                subtitle="CRUD للتصنيفات الرئيسية داخل كل معهد"
                actions={
                    <div className="flex gap-2">
                        <Input
                            placeholder="بحث..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-[220px]"
                        />
                        <Button variant="outline" onClick={load}>تحديث</Button>
                    </div>
                }
            />

            <Card className="rounded-[28px]">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="font-bold">إضافة تصنيف</div>
                    <div className="flex gap-2">
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم التصنيف" />
                        <Button onClick={onCreate} disabled={saving}>{saving ? "..." : "إضافة"}</Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <SkeletonTable rows={8} cols={3} />
                    ) : rows.length === 0 ? (
                        <EmptyState title="لا يوجد تصنيفات" description="أضف أول تصنيف للمكتبة." />
                    ) : (
                        <div className="overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-right border-b border-[var(--border)]">
                                        <th className="py-2">#</th>
                                        <th className="py-2">الاسم</th>
                                        <th className="py-2">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => (
                                        <tr key={r.id} className="border-b border-[var(--border)]">
                                            <td className="py-2">{i + 1}</td>
                                            <td className="py-2 font-semibold">{r.name}</td>
                                            <td className="py-2">
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => onRename(r.id)}>تعديل</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => onDelete(r.id)}>حذف</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
