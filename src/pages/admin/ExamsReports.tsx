import { useCallback, useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import EmptyState from "@/components/ui/empty-state"
import { toast } from "sonner"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "recharts"
import {
  Award,
  BarChart3,
  CheckCircle2,
  Medal,
  RefreshCw,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react"

import { listExams, type Exam } from "@/services/exams"

type ExamRow = Exam & {
  percent: number
}

function GoldenGauge({ pct, size = 112 }: { pct: number; size?: number }) {
  const r = (size - 14) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  const dash = (clamped / 100) * circ

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id="gold-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={8} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="url(#gold-stroke)"
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.85s ease" }}
      />
    </svg>
  )
}

function scoreTone(percent: number) {
  if (percent >= 90) {
    return {
      row: "border-amber-300 bg-amber-50/70 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_10px_24px_rgba(251,191,36,0.18)]",
      bar: "from-amber-400 to-yellow-500",
      label: "text-amber-700",
    }
  }
  if (percent >= 75) {
    return {
      row: "border-emerald-200 bg-emerald-50/40",
      bar: "from-emerald-400 to-emerald-600",
      label: "text-emerald-700",
    }
  }
  if (percent >= 60) {
    return {
      row: "border-indigo-200 bg-indigo-50/40",
      bar: "from-indigo-400 to-indigo-600",
      label: "text-indigo-700",
    }
  }
  return {
    row: "border-rose-200 bg-rose-50/40",
    bar: "from-rose-400 to-rose-600",
    label: "text-rose-700",
  }
}

export default function ExamsReports() {
  const [rows, setRows] = useState<ExamRow[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "empty" | "error">("idle")

  const loadData = useCallback(async () => {
    setLoading(true)
    setStatus("loading")
    try {
      const res = await listExams({ per_page: 300 })
      const data = (res.data || []).map((r) => {
        const max = Number(r.max_score || 0)
        const score = Number(r.score || 0)
        const percent = max > 0 ? Math.round((score / max) * 100) : 0
        return { ...r, percent }
      })
      setRows(data)
      setStatus(data.length ? "success" : "empty")
    } catch {
      setRows([])
      setStatus("error")
      toast.error("تعذر تحميل تقارير الاختبارات")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const analytics = useMemo(() => {
    const total = rows.length
    const avgGrade = total ? Math.round(rows.reduce((s, r) => s + r.percent, 0) / total) : 0
    const passed = rows.filter((r) => r.result === "passed").length
    const successRate = total ? Math.round((passed / total) * 100) : 0

    const topStudents = [...rows]
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3)

    const distributionBins = [
      { label: "0-59", min: 0, max: 59, count: 0, color: "#f43f5e" },
      { label: "60-69", min: 60, max: 69, count: 0, color: "#6366f1" },
      { label: "70-79", min: 70, max: 79, count: 0, color: "#22c55e" },
      { label: "80-89", min: 80, max: 89, count: 0, color: "#10b981" },
      { label: "90-100", min: 90, max: 100, count: 0, color: "#f59e0b" },
    ]

    rows.forEach((r) => {
      const bin = distributionBins.find((b) => r.percent >= b.min && r.percent <= b.max)
      if (bin) bin.count += 1
    })

    const trendMap = new Map<string, { date: string; avg: number; passed: number; count: number }>()
    rows.forEach((r) => {
      const d = String(r.exam_date || "")
      if (!d) return
      if (!trendMap.has(d)) trendMap.set(d, { date: d, avg: 0, passed: 0, count: 0 })
      const t = trendMap.get(d)
      if (!t) return
      t.avg += r.percent
      t.passed += r.result === "passed" ? 1 : 0
      t.count += 1
    })

    const trend = Array.from(trendMap.values())
      .map((t) => ({
        date: t.date,
        avg: t.count > 0 ? Math.round(t.avg / t.count) : 0,
        success: t.count > 0 ? Math.round((t.passed / t.count) * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      total,
      avgGrade,
      successRate,
      topStudents,
      distribution: distributionBins,
      trend,
    }
  }, [rows])

  return (
    <AppLayout>
      <div dir="rtl" className="min-h-screen bg-slate-50 pb-10">
        <div className="space-y-8 px-4 md:px-6 pt-6">
          <Header
            title="تقارير الاختبارات والتقييمات"
            subtitle="لوحة تحليل ذكية لنتائج الطلاب والأداء العام"
          />

          {/* Scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div
              className="rounded-3xl p-6 text-white relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
                boxShadow: "0 22px 48px rgba(99, 102, 241, 0.24)",
              }}
            >
              <Sparkles size={84} className="absolute -left-3 -top-3 text-white/20" />
              <div className="relative z-10">
                <div className="text-xs opacity-85">إجمالي الاختبارات</div>
                {loading ? <Skeleton className="h-10 w-24 mt-3 bg-white/20" /> : <div className="text-4xl font-black mt-2">{analytics.total}</div>}
              </div>
            </div>

            <div
              className="rounded-3xl p-6 text-white relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
                boxShadow: "0 22px 48px rgba(245, 158, 11, 0.24)",
              }}
            >
              <Award size={84} className="absolute -left-3 -top-3 text-white/20" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="relative w-[112px] h-[112px]">
                  <GoldenGauge pct={loading ? 0 : analytics.avgGrade} />
                  <span className="absolute inset-0 flex items-center justify-center font-black text-xl">
                    {loading ? "..." : `${analytics.avgGrade}%`}
                  </span>
                </div>
                <div>
                  <div className="text-xs opacity-85">متوسط الدرجة</div>
                  <div className="text-2xl font-black mt-1">Elite Grade</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 text-slate-800">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="font-bold text-sm">نسبة النجاح</span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-28 mt-4" />
              ) : (
                <>
                  <div className="text-3xl font-black text-emerald-700 mt-3">{analytics.successRate}%</div>
                  <div className="mt-3 h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700"
                      style={{ width: `${analytics.successRate}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 text-slate-800 mb-3">
                <Trophy size={16} className="text-amber-500" />
                <span className="font-bold text-sm">لوحة الشرف</span>
              </div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : analytics.topStudents.length === 0 ? (
                <div className="text-xs text-slate-500">لا توجد بيانات</div>
              ) : (
                <div className="space-y-2">
                  {analytics.topStudents.map((s, i) => (
                    <div key={`${s.id}-${i}`} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-2.5 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Medal size={14} className="text-amber-600" />
                        <span className="text-xs font-semibold text-slate-800 truncate">{s.student?.name || `طالب #${s.student_id}`}</span>
                      </div>
                      <span className="text-xs font-black text-amber-700">{s.percent}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                <BarChart3 size={16} className="text-indigo-600" />
                <h3 className="font-extrabold">توزيع الدرجات</h3>
              </div>
              {loading ? (
                <Skeleton className="h-[280px] w-full rounded-2xl" />
              ) : analytics.distribution.every((b) => b.count === 0) ? (
                <EmptyState title="لا يوجد بيانات" desc="لا توجد نتائج كافية لعرض التوزيع." />
              ) : (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={analytics.distribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]} maxBarSize={56}>
                        {analytics.distribution.map((b) => (
                          <Cell key={b.label} fill={b.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                <Users size={16} className="text-emerald-600" />
                <h3 className="font-extrabold">Class Level Trend</h3>
              </div>
              {loading ? (
                <Skeleton className="h-[280px] w-full rounded-2xl" />
              ) : analytics.trend.length === 0 ? (
                <EmptyState title="لا يوجد بيانات" desc="لا توجد بيانات اتجاه زمنية ضمن السجلات الحالية." />
              ) : (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={analytics.trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="avg" name="متوسط الصف" stroke="#4f46e5" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="success" name="نسبة النجاح" stroke="#10b981" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Smart Table */}
          <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800">جدول الدرجات الذكي</h3>
              <Button onClick={loadData} className="rounded-2xl h-9 gap-2 bg-indigo-600 hover:bg-indigo-700">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                تحديث
              </Button>
            </div>

            {status === "error" && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                تعذر تحميل بيانات الاختبارات.
              </div>
            )}

            {status === "empty" && !loading && (
              <EmptyState title="لا توجد نتائج" desc="لا توجد سجلات اختبارات ضمن البيانات الحالية." />
            )}

            {status !== "error" && status !== "empty" && (
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                ) : (
                  rows.map((r) => {
                    const tone = scoreTone(r.percent)
                    const top = r.percent >= 90
                    return (
                      <div key={r.id} className={`rounded-2xl border px-4 py-4 shadow-sm ${tone.row}`}>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-3 min-w-0">
                            <div className="text-[11px] text-slate-500">الطالب</div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                              {top && <Star size={13} className="text-amber-500" />}
                              <span className="truncate">{r.student?.name || `طالب #${r.student_id}`}</span>
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-[11px] text-slate-500">الاختبار</div>
                            <div className="font-semibold text-slate-800">{r.exam_name}</div>
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-[11px] text-slate-500">الحلقة</div>
                            <div className="font-semibold text-slate-800">{r.circle?.name || "—"}</div>
                          </div>

                          <div className="md:col-span-3">
                            <div className="text-[11px] text-slate-500">التقدم</div>
                            <div className="mt-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
                                style={{ width: `${Math.max(0, Math.min(100, r.percent))}%` }}
                              />
                            </div>
                            <div className={`text-xs font-bold mt-1 ${tone.label}`}>{r.score}/{r.max_score} ({r.percent}%)</div>
                          </div>

                          <div className="md:col-span-2">
                            <div className="text-[11px] text-slate-500">التاريخ</div>
                            <div className="font-semibold text-slate-700">{r.exam_date}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
