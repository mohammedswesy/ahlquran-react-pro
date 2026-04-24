import { useCallback, useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  CalendarCheck2,
  Clock3,
  ClipboardList,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"

import { listAttendances, type Attendance, type AttendanceStatus } from "@/services/attendances"
import { listCircles, listCircleStudents, type Circle } from "@/services/circles"
import {
  getCircleTrackColor,
  getCircleTrackName,
  getCircleTrackDescription,
} from "@/lib/circleTracks"

type AttendanceRecord = Attendance & {
  circle_name?: string
  student_name?: string
  track_name?: string
}

const statusBadgeConfig: Record<
  AttendanceStatus,
  { label: string; className: string; icon: string }
> = {
  present: {
    label: "حاضر",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.24)]",
    icon: "✓",
  },
  absent: {
    label: "غائب",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "✗",
  },
  late: {
    label: "متأخر",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "⏱",
  },
  excused: {
    label: "معذور",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "📝",
  },
}

function RadialGauge({ pct, size = 110 }: { pct: number; size?: number }) {
  const r = (size - 14) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * circ

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={8} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#ffffff"
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.9s ease" }}
      />
    </svg>
  )
}

export default function AttendanceReports() {
  const [rows, setRows] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "success" | "empty" | "error">("idle")
  const [circles, setCircles] = useState<Circle[]>([])
  const [students, setStudents] = useState<Array<{ id: number; name: string }>>([])

  const [filterCircle, setFilterCircle] = useState<string>("all")
  const [filterStudent, setFilterStudent] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchDate, setSearchDate] = useState("")
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await listCircles({ per_page: 200 })
        setCircles(res.data)
      } catch {
        toast.error("تعذر تحميل الحلقات")
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (filterCircle === "all") {
        setStudents([])
        setSelectedCircle(null)
        return
      }
      try {
        const circle = circles.find((c) => c.id === Number(filterCircle))
        setSelectedCircle(circle || null)
        const studentList = await listCircleStudents(Number(filterCircle))
        setStudents(studentList)
      } catch {
        setStudents([])
      }
    })()
  }, [filterCircle, circles])

  const loadAttendance = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    setRequestStatus("loading")
    try {
      const params: Record<string, unknown> = { per_page: 200 }
      if (filterCircle !== "all") params.circle_id = Number(filterCircle)
      if (filterStudent !== "all") params.student_id = Number(filterStudent)
      if (filterStatus !== "all") params.status = filterStatus
      if (searchDate) params.date_from = searchDate

      const res = await listAttendances(params)
      const data = Array.isArray(res) ? res : (res?.data ?? [])
      const enriched = data.map((att) => {
        const circle = circles.find((c) => c.id === att.circle_id)
        return {
          ...att,
          circle_name: att.circle?.name || circle?.name,
          student_name: att.student?.name,
          track_name: circle ? getCircleTrackName(circle.track) : null,
        }
      })

      setRows(enriched)
      setRequestStatus(enriched.length === 0 ? "empty" : "success")
    } catch {
      const friendlyMessage = "عذراً، حدث خطأ أثناء تحميل إحصائيات الحضور. يرجى المحاولة لاحقاً."
      setFetchError(friendlyMessage)
      setRequestStatus("error")
      toast.error(friendlyMessage)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [filterCircle, filterStudent, filterStatus, searchDate, circles])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  const stats = useMemo(() => {
    const total = rows.length
    const present = rows.filter((r) => r.status === "present").length
    const absent = rows.filter((r) => r.status === "absent").length
    const late = rows.filter((r) => r.status === "late").length
    const excused = rows.filter((r) => r.status === "excused").length
    const presentRate = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, late, excused, presentRate }
  }, [rows])

  const trendData = useMemo(() => {
    const grouped = new Map<string, { date: string; present: number; absent: number; late: number; excused: number; total: number }>()

    rows.forEach((record) => {
      const key = String(record.date || "")
      if (!key) return

      if (!grouped.has(key)) {
        grouped.set(key, {
          date: key,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        })
      }

      const bucket = grouped.get(key)
      if (!bucket) return

      const s = record.status
      bucket.total += 1
      if (s === "present") bucket.present += 1
      if (s === "absent") bucket.absent += 1
      if (s === "late") bucket.late += 1
      if (s === "excused") bucket.excused += 1
    })

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [rows])

  return (
    <AppLayout>
      <div dir="rtl" className="min-h-screen bg-slate-50 pb-10">
        <div className="space-y-8 px-4 md:px-6 pt-6">
          <Header title="تقارير الحضور" subtitle="لوحة احترافية لمتابعة وتحليل سجلات الحضور" />

          {/* Hero KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div
              className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                boxShadow: "0 22px 48px rgba(37, 99, 235, 0.22)",
              }}
            >
              <ClipboardList size={84} className="absolute -left-3 -top-3 text-white/20" />
              <div className="relative z-10 text-white">
                <div className="text-xs opacity-80">إجمالي السجلات</div>
                {loading ? <Skeleton className="h-10 w-24 mt-3 bg-white/20" /> : <div className="text-4xl font-black mt-2">{stats.total}</div>}
              </div>
            </div>

            <div
              className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                boxShadow: "0 22px 48px rgba(16, 185, 129, 0.24)",
              }}
            >
              <ShieldCheck size={84} className="absolute -left-3 -top-3 text-white/20" />
              <div className="relative z-10 flex items-center gap-4 text-white">
                <div className="relative w-[110px] h-[110px]">
                  <RadialGauge pct={loading ? 0 : stats.presentRate} />
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold">
                    {loading ? "..." : `${stats.presentRate}%`}
                  </span>
                </div>
                <div>
                  <div className="text-xs opacity-80">معدل الحضور</div>
                  <div className="text-2xl font-black mt-1">{loading ? "..." : stats.present}</div>
                  <div className="text-xs opacity-80 mt-1">حاضر اليوم</div>
                </div>
              </div>
            </div>

            <div
              className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #be123c 0%, #f43f5e 100%)",
                boxShadow: "0 22px 48px rgba(244, 63, 94, 0.22)",
              }}
            >
              <AlertTriangle size={84} className="absolute -left-3 -top-3 text-white/20" />
              <div className="relative z-10 text-white">
                <div className="text-xs opacity-80">تنبيه الغياب</div>
                {loading ? <Skeleton className="h-10 w-24 mt-3 bg-white/20" /> : <div className="text-4xl font-black mt-2">{stats.absent}</div>}
                <div className="text-xs opacity-80 mt-1">سجلات غياب</div>
              </div>
            </div>

            <div
              className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
                boxShadow: "0 22px 48px rgba(245, 158, 11, 0.22)",
              }}
            >
              <Clock3 size={84} className="absolute -left-3 -top-3 text-white/20" />
              <div className="relative z-10 text-white">
                <div className="text-xs opacity-80">سجلات التأخر</div>
                {loading ? <Skeleton className="h-10 w-24 mt-3 bg-white/20" /> : <div className="text-4xl font-black mt-2">{stats.late}</div>}
                <div className="text-xs opacity-80 mt-1">متأخرون</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-700">الحلقة</label>
                <Select value={filterCircle} onValueChange={setFilterCircle}>
                  <SelectTrigger className="rounded-2xl bg-white">
                    <SelectValue placeholder="جميع الحلقات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحلقات</SelectItem>
                    {circles.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCircle && (
                  <div className="mt-1.5 text-[11px] text-slate-500">
                    {getCircleTrackDescription(selectedCircle.track)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-700">الطالب</label>
                <Select value={filterStudent} onValueChange={setFilterStudent} disabled={students.length === 0}>
                  <SelectTrigger className="rounded-2xl bg-white">
                    <SelectValue placeholder="جميع الطلاب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الطلاب</SelectItem>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-700">الحالة</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="rounded-2xl bg-white">
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="present">حاضر</SelectItem>
                    <SelectItem value="absent">غائب</SelectItem>
                    <SelectItem value="late">متأخر</SelectItem>
                    <SelectItem value="excused">معذور</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-700">من التاريخ</label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={loadAttendance} className="rounded-2xl gap-2 h-10 bg-emerald-600 hover:bg-emerald-700">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                تحديث
              </Button>
            </div>
          </div>

          {/* Error */}
          {requestStatus === "error" && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-5 text-sm text-rose-700 shadow-lg">
              {fetchError || "عذراً، حدث خطأ أثناء تحميل إحصائيات الحضور. يرجى المحاولة لاحقاً."}
            </div>
          )}

          {/* Trend Chart */}
          {requestStatus !== "error" && (
            <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                <TrendingUp size={16} className="text-emerald-600" />
                <h3 className="font-extrabold">Attendance Trend</h3>
              </div>
              {loading ? (
                <Skeleton className="h-[280px] w-full rounded-2xl" />
              ) : trendData.length === 0 ? (
                <EmptyState title="لا يوجد بيانات" desc="لا توجد سجلات اتجاه للحضور ضمن الفلاتر الحالية." />
              ) : (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="present" name="حاضر" stroke="#10b981" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="absent" name="غائب" stroke="#f43f5e" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="late" name="متأخر" stroke="#f59e0b" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="total" name="إجمالي" stroke="#0f766e" strokeWidth={2} dot={false} strokeDasharray="6 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Empty */}
          {requestStatus === "empty" && !loading && (
            <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl">
              <EmptyState title="لا يوجد بيانات" desc="لا توجد سجلات حضور ضمن الفلاتر الحالية." />
            </div>
          )}

          {/* Modern Zebra Rows */}
          {requestStatus !== "error" && requestStatus !== "empty" && (
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
              ) : (
                rows.map((row, idx) => {
                  const status = (row.status || "present") as AttendanceStatus
                  const config = statusBadgeConfig[status]
                  const trackTone = getCircleTrackColor(circles.find((c) => c.id === row.circle_id)?.track)

                  return (
                    <div
                      key={String(row.id)}
                      className={`rounded-2xl border px-4 py-4 shadow-sm transition-all hover:shadow-md ${idx % 2 === 0 ? "bg-white/90" : "bg-slate-50/80"}`}
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-2">
                          <div className="text-[11px] text-slate-500">التاريخ</div>
                          <div className="font-semibold text-slate-800">{row.date || "—"}</div>
                        </div>

                        <div className="md:col-span-3">
                          <div className="text-[11px] text-slate-500">الطالب</div>
                          <div className="font-semibold text-slate-900">{row.student_name || "—"}</div>
                        </div>

                        <div className="md:col-span-3">
                          <div className="text-[11px] text-slate-500">الحلقة</div>
                          <div className="font-semibold text-slate-900">{row.circle_name || "—"}</div>
                          {row.track_name && (
                            <span
                              className="inline-flex mt-1 rounded-full border px-2 py-0.5 text-[11px]"
                              style={{
                                background: trackTone?.background,
                                borderColor: trackTone?.border,
                                color: trackTone?.text,
                              }}
                            >
                              {row.track_name}
                            </span>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-[11px] text-slate-500">الحالة</div>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
                            {config.icon} {config.label}
                          </span>
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-[11px] text-slate-500">ملاحظات</div>
                          <div className="text-sm text-slate-700 truncate">{row.notes || "—"}</div>
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
    </AppLayout>
  )
}
