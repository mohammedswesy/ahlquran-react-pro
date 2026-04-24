import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import AppLayout from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ModalFormShell from "@/components/ui/modal-form-shell"
import { Input } from "@/components/ui/input"
import { FileText, Plus, Video } from "lucide-react"

import {
  createAdminLesson,
  listAdminLessons,
  type LessonLevel,
  type TajweedLesson,
} from "@/services/tajweedLessons"

const LEVEL_OPTIONS: Array<{ value: LessonLevel; label: string }> = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
]

type FormState = {
  title: string
  level: LessonLevel
  video_url: string
  file: File | null
}

const EMPTY_FORM: FormState = {
  title: "",
  level: "beginner",
  video_url: "",
  file: null,
}

function levelLabel(level?: string | null): string {
  const raw = String(level ?? "").toLowerCase()
  if (raw.includes("intermediate") || raw.includes("متوسط")) return "متوسط"
  if (raw.includes("advanced") || raw.includes("متقدم")) return "متقدم"
  if (raw.includes("beginner") || raw.includes("مبتد") || raw.includes("مبتدئ")) return "مبتدئ"
  return level ? String(level) : "غير محدد"
}

export default function TajweedLessons() {
  const [rows, setRows] = useState<TajweedLesson[]>([])
  const [loading, setLoading] = useState(true)

  const [openCreate, setOpenCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listAdminLessons()
      setRows(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذر تحميل الدروس")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("عنوان الدرس مطلوب")
      return
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append("title", form.title.trim())
      payload.append("level", String(form.level))
      if (form.video_url.trim()) payload.append("video_url", form.video_url.trim())
      if (form.file) payload.append("file", form.file)

      await createAdminLesson(payload)
      toast.success("تمت إضافة الدرس بنجاح")
      setForm(EMPTY_FORM)
      setOpenCreate(false)
      await load()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إضافة الدرس")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6">
        <section className="rounded-[30px] border border-emerald-200 bg-gradient-to-r from-emerald-800 via-emerald-700 to-lime-700 p-6 text-white shadow-[0_24px_60px_rgba(6,95,70,0.22)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black">إدارة مكتبة التجويد</h1>
              <p className="mt-2 text-sm text-emerald-50/85">أضف دروس جديدة مع الفيديو والملف العلمي لكل مستوى.</p>
            </div>
            <Button
              onClick={() => setOpenCreate(true)}
              className="rounded-xl bg-amber-400 text-emerald-950 hover:bg-amber-300"
            >
              <Plus className="ml-2 h-4 w-4" />
              Add New Lesson
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="rounded-2xl border-emerald-100 bg-white/95">
                <CardContent className="space-y-3 p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-12 animate-pulse rounded bg-slate-100" />
                </CardContent>
              </Card>
            ))
          ) : rows.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-600">
              لا توجد دروس حتى الآن
            </div>
          ) : (
            rows.map((lesson) => (
              <Card
                key={lesson.id}
                className="rounded-2xl border border-emerald-100 bg-white/95 transition-all hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_16px_40px_rgba(4,120,87,0.16)]"
              >
                <CardContent className="space-y-3 p-4">
                  <h2 className="text-base font-black text-slate-900">{lesson.title}</h2>
                  <div className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {levelLabel(lesson.level)}
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5 text-emerald-700" />
                      {lesson.video_url ? "يوجد رابط فيديو" : "بدون فيديو"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-emerald-700" />
                      {lesson.file_url || lesson.file_path ? "يوجد ملف علمي" : "بدون ملف"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <ModalFormShell
          open={openCreate}
          onClose={() => {
            if (submitting) return
            setOpenCreate(false)
            setForm(EMPTY_FORM)
          }}
          title="Add New Lesson"
          description="أدخل بيانات الدرس الجديد"
          formId="tajweed-lesson-create-form"
          submitting={submitting}
          submitLabel="حفظ الدرس"
          size="md"
        >
          <form
            id="tajweed-lesson-create-form"
            onSubmit={(event) => {
              event.preventDefault()
              void onSubmit()
            }}
            className="space-y-4"
            dir="rtl"
          >
            <Input
              label="Title"
              placeholder="مثال: أحكام النون الساكنة"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Level</label>
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                value={String(form.level)}
                onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Video URL"
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.video_url}
              onChange={(event) => setForm((prev) => ({ ...prev, video_url: event.target.value }))}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">File Upload</label>
              <input
                type="file"
                accept="application/pdf"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
              />
            </div>
          </form>
        </ModalFormShell>
      </div>
    </AppLayout>
  )
}
