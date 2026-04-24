import { useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import { useStudentDashboard } from "@/hooks/useStudentDashboard"
import { useAuth } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { downloadStudentMonthlyReport } from "@/services/reports"
import {
  BookOpen,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react"

function clampPercent(value: unknown): number {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function asMetric(value: unknown, fallback = 0): number {
  const numeric = Number(value ?? fallback)
  return Number.isFinite(numeric) ? numeric : fallback
}

function displayDate(value: string): string {
  if (!value) return "--"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string
  value: string
  hint: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-[28px] border border-emerald-100 bg-white/90 p-5 shadow-[0_18px_45px_rgba(5,94,67,0.08)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-emerald-800/70">{title}</div>
          <div className="mt-3 text-3xl font-black text-slate-900">{value}</div>
          <div className="mt-2 text-xs text-slate-500">{hint}</div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-lime-600 text-white shadow-lg shadow-emerald-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { data, loading, error, reload } = useStudentDashboard()
  const brandName = useAuth((state) => state.brandName)
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    return `${now.getFullYear()}-${month}`
  })
  const [generatingReport, setGeneratingReport] = useState(false)

  const totals = data.totals
  const studentName = data.studentName || "الطالب"
  const currentLevelName = data.currentLevelName || "غير محدد"
  const memorizedPages = asMetric(
    totals.memorized_pages ?? totals.pages_memorized ?? totals.hifz_pages ?? totals.pages,
  )
  const attendanceRate = clampPercent(
    totals.attendance_rate ?? totals.presence_percent ?? totals.attendance_percent,
  )
  const averageGradeValue = asMetric(
    totals.average_grade ?? totals.avg_grade ?? totals.average_score ?? totals.grade_average,
  )
  const circlesCount = asMetric(totals.circles ?? totals.circles_count ?? totals.active_circles)
  const progressPercent = clampPercent(data.progressPercent ?? totals.progress_percent ?? totals.completion_rate)
  const activityRows = data.recentActivities

  const onDownloadMonthlyReport = async () => {
    if (!reportMonth) {
      toast.warning("اختر الشهر أولاً")
      return
    }

    setGeneratingReport(true)
    try {
      await downloadStudentMonthlyReport(reportMonth)
      toast.success("تم تجهيز التقرير وبدء التحميل")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء التقرير")
    } finally {
      setGeneratingReport(false)
    }
  }

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6">
        <section className="relative overflow-hidden rounded-[34px] border border-emerald-200/80 bg-gradient-to-br from-emerald-950 via-emerald-900 to-lime-900 px-6 py-7 text-white shadow-[0_25px_60px_rgba(6,95,70,0.22)] sm:px-8">
          <div className="absolute -left-10 top-6 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-lime-300/10 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-50">
                <Sparkles className="h-4 w-4 text-amber-300" />
                بوابة الطالب
              </div>
              {loading ? (
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-8 w-64 bg-white/15" />
                  <Skeleton className="h-4 w-80 bg-white/10" />
                </div>
              ) : (
                <>
                  <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                    أهلاً {studentName}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-50/80 sm:text-base">
                    هذه لوحتك اليومية لمتابعة الحفظ والحضور والتقييمات داخل {brandName || "المنصة"} بصورة واضحة ومباشرة.
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold text-emerald-50/70">المستوى الحالي</div>
                <div className="mt-2 text-xl font-black text-amber-200">{loading ? "..." : currentLevelName}</div>
              </div>
              <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs font-semibold text-emerald-50/70">الحلقات النشطة</div>
                <div className="mt-2 text-xl font-black text-white">{loading ? "..." : circlesCount}</div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <span>{error}</span>
            <Button onClick={() => void reload()} className="rounded-xl bg-amber-600 hover:bg-amber-700">
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
        )}

        <section className="rounded-[30px] border border-emerald-100 bg-white/90 p-5 shadow-[0_18px_45px_rgba(5,94,67,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">التقرير الشهري</h2>
              <p className="mt-1 text-sm text-slate-500">اختر الشهر ثم نزّل تقرير PDF للمتابعة أو المشاركة.</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Input
                type="month"
                value={reportMonth}
                onChange={(event) => setReportMonth(event.target.value)}
                className="h-11 rounded-xl sm:w-[170px]"
              />
              <Button
                onClick={() => void onDownloadMonthlyReport()}
                disabled={generatingReport}
                className="h-11 rounded-xl bg-emerald-700 px-5 hover:bg-emerald-800"
              >
                {generatingReport ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FileText className="ml-2 h-4 w-4" />}
                {generatingReport ? "Generating PDF..." : "Download Monthly Report"}
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-[28px] border border-emerald-100 bg-white/90 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-10 w-24" />
                <Skeleton className="mt-3 h-3 w-32" />
              </div>
            ))
          ) : (
            <>
              <StatCard title="الصفحات المحفوظة" value={String(memorizedPages)} hint="إجمالي ما تم تثبيته حتى الآن" icon={BookOpen} />
              <StatCard title="نسبة الحضور" value={`${attendanceRate}%`} hint="معدل الالتزام خلال الفترة الأخيرة" icon={TrendingUp} />
              <StatCard title="متوسط التقييم" value={averageGradeValue ? `${averageGradeValue}%` : "--"} hint="متوسط آخر درجاتك المعتمدة" icon={GraduationCap} />
              <StatCard title="المستوى الحالي" value={currentLevelName} hint="اسم المستوى المرتبط بخطتك الحالية" icon={Layers3} />
            </>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <div className="rounded-[30px] border border-emerald-100 bg-white/90 p-6 shadow-[0_18px_45px_rgba(5,94,67,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">التقدم داخل المستوى</h2>
                <p className="mt-1 text-sm text-slate-500">مؤشر تقريبي يوضح قربك من إنهاء المرحلة الحالية.</p>
              </div>
              <Star className="h-5 w-5 text-amber-500" />
            </div>

            {loading ? (
              <div className="mt-8 flex flex-col items-center gap-6">
                <Skeleton className="h-40 w-40 rounded-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <>
                <div className="mt-8 flex items-center justify-center">
                  <div
                    className="grid h-44 w-44 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#15803d ${progressPercent}%, #d1fae5 ${progressPercent}% 100%)`,
                    }}
                  >
                    <div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center shadow-inner">
                      <div>
                        <div className="text-4xl font-black text-emerald-700">{progressPercent}%</div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">إنجاز المستوى</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>بداية المستوى</span>
                    <span>نهاية المستوى</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-emerald-50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-500 to-amber-400"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-[30px] border border-emerald-100 bg-white/90 p-6 shadow-[0_18px_45px_rgba(5,94,67,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">آخر أنشطة المعلّم</h2>
                <p className="mt-1 text-sm text-slate-500">آخر 5 سجلات تتضمن السورة والصفحات والدرجة.</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-emerald-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100 text-right">
                  <thead className="bg-emerald-50/80">
                    <tr className="text-xs font-bold uppercase tracking-wide text-emerald-900/75">
                      <th className="px-4 py-3">السورة</th>
                      <th className="px-4 py-3">الصفحات</th>
                      <th className="px-4 py-3">الدرجة</th>
                      <th className="px-4 py-3">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 bg-white">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                        </tr>
                      ))
                    ) : activityRows.length > 0 ? (
                      activityRows.map((row) => (
                        <tr key={`${row.id}-${row.date}`} className="text-sm text-slate-700">
                          <td className="px-4 py-4 font-semibold text-slate-900">{row.surah}</td>
                          <td className="px-4 py-4">{row.pages}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                              {row.grade}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-500">{displayDate(row.date)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                          No activities yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
