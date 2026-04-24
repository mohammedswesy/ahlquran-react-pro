import AppLayout from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { BookOpen, FileText, PlayCircle, RefreshCw } from "lucide-react"

import { useStudentLessons } from "@/hooks/useStudentLessons"
import type { TajweedLesson } from "@/services/tajweedLessons"

function levelLabel(level?: string | null): string {
  const raw = String(level ?? "").trim().toLowerCase()
  if (raw.includes("intermediate") || raw.includes("متوسط")) return "متوسط"
  if (raw.includes("beginner") || raw.includes("مبتد") || raw.includes("مبتدئ")) return "مبتدئ"
  if (raw.includes("advanced") || raw.includes("متقدم")) return "متقدم"
  return level ? String(level) : "غير محدد"
}

function toYouTubeEmbedUrl(url?: string | null): string | null {
  const value = String(url ?? "").trim()
  if (!value) return null

  const shortMatch = value.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/)
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`

  const watchMatch = value.match(/[?&]v=([a-zA-Z0-9_-]{6,})/)
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`

  const embedMatch = value.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/)
  if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`

  return null
}

function baseStorageUrl(): string {
  const base = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
  return String(base).replace(/\/api\/?$/, "")
}

function resolveFileUrl(lesson: TajweedLesson): string | null {
  if (lesson.file_url) return lesson.file_url
  if (lesson.file_path) return `${baseStorageUrl()}/storage/${lesson.file_path}`
  return null
}

export default function TajweedLibrary() {
  const { lessons, loading, error, studentLevel, reload } = useStudentLessons()

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6">
        <section className="rounded-[30px] border border-emerald-200 bg-gradient-to-br from-emerald-900 via-emerald-800 to-lime-800 p-6 text-white shadow-[0_25px_60px_rgba(6,95,70,0.22)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black">مكتبة التجويد</h1>
              <p className="mt-2 text-sm text-emerald-50/80">
                دروس فيديو ومواد علمية مصنفة حسب المستوى لإتقان أحكام التلاوة.
              </p>
              <div className="mt-3 inline-flex rounded-full border border-amber-300/50 bg-amber-200/15 px-3 py-1 text-xs font-semibold text-amber-200">
                المستوى الحالي: {studentLevel ? levelLabel(studentLevel) : "—"}
              </div>
            </div>

            <Button
              onClick={() => void reload()}
              className="rounded-xl bg-white/15 text-white hover:bg-white/25"
            >
              <RefreshCw className="ml-2 h-4 w-4" />
              تحديث
            </Button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="rounded-2xl border-emerald-100 bg-white/95">
                <CardContent className="space-y-3 p-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))
          ) : lessons.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-emerald-100 bg-white px-6 py-10 text-center">
              <BookOpen className="mx-auto h-7 w-7 text-emerald-700" />
              <p className="mt-3 text-sm font-semibold text-slate-700">لا توجد دروس متاحة لهذا المستوى حالياً.</p>
            </div>
          ) : (
            lessons.map((lesson) => {
              const embedUrl = toYouTubeEmbedUrl(lesson.video_url)
              const fileUrl = resolveFileUrl(lesson)

              return (
                <Card
                  key={lesson.id}
                  className="group rounded-2xl border border-emerald-100 bg-white/95 transition-all hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_16px_40px_rgba(4,120,87,0.18)]"
                >
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-black text-slate-900">{lesson.title}</h2>
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        {levelLabel(lesson.level)}
                      </span>
                    </div>

                    {lesson.description && (
                      <p className="text-xs leading-6 text-slate-600">{lesson.description}</p>
                    )}

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                        <PlayCircle className="h-4 w-4" />
                        درس الفيديو
                      </div>

                      {embedUrl ? (
                        <div className="overflow-hidden rounded-lg">
                          <iframe
                            title={`lesson-video-${lesson.id}`}
                            src={embedUrl}
                            className="h-48 w-full"
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-emerald-200 bg-white px-3 py-6 text-center text-xs text-slate-500">
                          لا يوجد رابط فيديو صالح
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-800">
                        <FileText className="h-4 w-4" />
                        المادة العلمية
                      </div>

                      {fileUrl ? (
                        <Button
                          className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-800"
                          onClick={() => {
                            window.open(fileUrl, "_blank", "noopener,noreferrer")
                            toast.success("تم فتح المادة العلمية")
                          }}
                        >
                          <FileText className="ml-2 h-4 w-4" />
                          تحميل المادة العلمية
                        </Button>
                      ) : (
                        <div className="rounded-lg border border-dashed border-amber-200 bg-white px-3 py-3 text-center text-xs text-slate-500">
                          لا توجد مادة مرفقة
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </section>
      </div>
    </AppLayout>
  )
}
