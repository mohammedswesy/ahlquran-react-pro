import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
  createLibraryItem,
  getLibraryItem,
  updateLibraryItem,
  type LibraryItemType,
} from "@/services/libraryItems"
import { listLibraryCategories, type LibraryCategory } from "@/services/libraryCategories"
import { listLibrarySubCategories, type LibrarySubCategory } from "@/services/librarySubCategories"

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
  sub_category_id: "",
  title: "",
  description: "",
  type: "pdf",
  external_url: "",
  file: null,
}

export default function LibraryItemFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const nav = useNavigate()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [subCategories, setSubCategories] = useState<LibrarySubCategory[]>([])

  const availableSubCategories = useMemo(() => {
    if (!form.category_id) return []
    return subCategories.filter((x) => String(x.category_id) === String(form.category_id))
  }, [subCategories, form.category_id])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [catRes, subCatRes] = await Promise.all([
          listLibraryCategories({ per_page: 1000 }),
          listLibrarySubCategories({ per_page: 1000 }),
        ])

        setCategories(Array.isArray(catRes?.data) ? catRes.data : Array.isArray(catRes) ? catRes : [])
        setSubCategories(Array.isArray(subCatRes?.data) ? subCatRes.data : Array.isArray(subCatRes) ? subCatRes : [])

        if (isEdit && id) {
          const item = await getLibraryItem(Number(id))
          const data = item?.data ?? item
          setForm({
            category_id: data?.category_id ? String(data.category_id) : "",
            sub_category_id: data?.sub_category_id ? String(data.sub_category_id) : "",
            title: data?.title || "",
            description: data?.description || "",
            type: data?.type || "pdf",
            external_url: data?.external_url || "",
            file: null,
          })
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "تعذر تحميل بيانات العنصر")
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isEdit])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.category_id || !form.title.trim()) {
      toast.error("يرجى تعبئة الحقول المطلوبة")
      return
    }

    if (!isEdit && !form.file && !form.external_url.trim()) {
      toast.error("ارفع ملفا او ضع رابطا خارجيا")
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("category_id", form.category_id)
      if (form.sub_category_id) fd.append("sub_category_id", form.sub_category_id)
      fd.append("title", form.title.trim())
      fd.append("type", form.type)
      if (form.description.trim()) fd.append("description", form.description.trim())
      if (form.external_url.trim()) fd.append("external_url", form.external_url.trim())
      if (form.file) fd.append("file", form.file)

      if (isEdit && id) {
        await updateLibraryItem(Number(id), fd)
        toast.success("تم تحديث عنصر المكتبة")
      } else {
        await createLibraryItem(fd)
        toast.success("تم إنشاء عنصر المكتبة")
      }

      nav("/admin/library/items", { replace: true })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذر حفظ عنصر المكتبة")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4" dir="rtl">جاري التحميل...</div>
  }

  return (
    <div className="space-y-4" dir="rtl">
      <Card>
        <CardHeader>{isEdit ? "تعديل عنصر مكتبة" : "إضافة عنصر مكتبة"}</CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm mb-1">التصنيف الرئيسي</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={form.category_id}
                onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value, sub_category_id: "" }))}
              >
                <option value="">اختر التصنيف</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">التصنيف الفرعي</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={form.sub_category_id}
                onChange={(e) => setForm((prev) => ({ ...prev, sub_category_id: e.target.value }))}
                disabled={!form.category_id}
              >
                <option value="">بدون تصنيف فرعي</option>
                {availableSubCategories.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="العنوان"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />

            <div>
              <label className="block text-sm mb-1">النوع</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as LibraryItemType }))}
              >
                <option value="pdf">PDF</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm mb-1">الوصف</label>
              <textarea
                className="w-full rounded-md border px-3 py-2"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <Input
              label="رابط خارجي"
              placeholder="https://..."
              value={form.external_url}
              onChange={(e) => setForm((prev) => ({ ...prev, external_url: e.target.value }))}
            />

            <div>
              <label className="block text-sm mb-1">ملف</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                type="file"
                onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
              <Button type="button" variant="outline" onClick={() => nav("/admin/library/items")}>إلغاء</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
