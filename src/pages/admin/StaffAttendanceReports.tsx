import { useCallback, useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import EmptyState from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  Clock3,
  Users2,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react"

import { listEmployeeAttendances, type EmployeeAttendance, type EmployeeAttendanceStatus } from "@/services/employeeAttendance"

type EmployeeAttendanceRecord = EmployeeAttendance & {
  initials?: string
}

const statusBadgeConfig: Record<
  EmployeeAttendanceStatus,
  { label: string; className: string; icon: string }
> = {
  present: {
    label: "في الوقت المحدد",
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

function GoldenGauge({ pct, size = 140 }: { pct: number; size?: number }) {
  const r = (size - 14) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * circ

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id="goldenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#fbbf24", stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: "#f59e0b", stopOpacity: 0.2 }} />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#goldenGradient)" strokeWidth={8} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#fbbf24"
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.9s ease" }}
      />
    </svg>
  )
}

function initials(name: string): string {
  return (name ?? "")
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
}

function getPunctualityColor(punctuality: number): { bg: string; text: string; border: string } {
  if (punctuality >= 95) return { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" }
  if (punctuality >= 85) return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" }
  if (punctuality >= 70) return { bg: "#fed7aa", text: "#9a3412", border: "#fdba74" }
  return { bg: "#fee2e2", text: "#7f1d1d", border: "#fca5a5" }
}

export default function StaffAttendanceReports() {
  const [rows, setRows] = useState<EmployeeAttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<"idle" | "loading" | "success" | "empty" | "error">("idle")

  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchEmployee, setSearchEmployee] = useState("")
  const [searchDate, setSearchDate] = useState("")

  const loadStaffAttendance = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    setRequestStatus("loading")
    try {
      const params: Record<string, unknown> = { per_page: 300 }
      if (filterStatus !== "all") params.status = filterStatus
      if (searchEmployee) params.search = searchEmployee
      if (searchDate) params.date_from = searchDate

      const res = await listEmployeeAttendances(params as any)
      const data = Array.isArray(res) ? res : (res?.data ?? [])
      const enriched = data.map((att) => ({
        ...att,
        initials: initials(att.employee_name),
      }))

      setRows(enriched)
      setRequestStatus(enriched.length === 0 ? "empty" : "success")
    } catch {
      const friendlyMessage = "عذراً، حدث خطأ أثناء تحميل إحصائيات مواظبة الموظفين. يرجى المحاولة لاحقاً."
      setFetchError(friendlyMessage)
      setRequestStatus("error")
      toast.error(friendlyMessage)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [filterStatus, searchEmployee, searchDate])

  useEffect(() => {
    loadStaffAttendance()
  }, [loadStaffAttendance])

  const stats = useMemo(() => {
    const total = rows.length
    const present = rows.filter((r) => r.status === "present").length
    const absent = rows.filter((r) => r.status === "absent").length
    const late = rows.filter((r) => r.status === "late").length
    const excused = rows.filter((r) => r.status === "excused").length
    const punctualityRate = total > 0 ? Math.round((present / total) * 100) : 0

    // Calculate average lateness in minutes
    const lateRecords = rows.filter((r) => r.status === "late" && r.start_time)
    const totalLateMinutes = lateRecords.reduce((acc, r) => {
      if (!r.start_time) return acc
      const startTime = new Date(`2024-01-01 ${r.start_time}`)
      const standardTime = new Date(`2024-01-01 08:00:00`)
      const minutes = Math.max(0, (startTime.getTime() - standardTime.getTime()) / (1000 * 60))
      return acc + minutes
    }, 0)
    const avgLateness = lateRecords.length > 0 ? Math.round(totalLateMinutes / lateRecords.length) : 0

    // Count unique active staff (present or late today)
    const today = new Date().toISOString().split("T")[0]
    const activeTodaySet = new Set(
      rows.filter((r) => r.date === today && (r.status === "present" || r.status === "late")).map((r) => r.employee_name)
    )
    const activeStaffCount = activeTodaySet.size

    return { total, present, absent, late, excused, punctualityRate, avgLateness, activeStaffCount }
  }, [rows])

  const trendData = useMemo(() => {
    const grouped = new Map<string, { date: string; onTime: number; late: number; absent: number; excused: number }>()

    rows.forEach((record) => {
      const key = String(record.date || "")
      if (!key) return

      if (!grouped.has(key)) {
        grouped.set(key, { date: key, onTime: 0, late: 0, absent: 0, excused: 0 })
      }

      const entry = grouped.get(key)!
      if (record.status === "present") entry.onTime++
      else if (record.status === "late") entry.late++
      else if (record.status === "absent") entry.absent++
      else if (record.status === "excused") entry.excused++
    })

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [rows])

  return (
    <AppLayout>
      <Header 
        title="مواظبة الموظفين" 
        subtitle="لوحة مراقبة الالتزام والحضور والانضباط الوظيفي" 
      />

      <div className="p-4 sm:p-5 space-y-5" dir="rtl">
        {/* Hero KPI Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Punctuality (Golden Gauge) */}
          <div
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
              boxShadow: "0 22px 48px rgba(251, 191, 36, 0.28)",
            }}
          >
            <Zap size={84} className="absolute -left-3 -top-3 text-white/20" />
            <div className="relative z-10 flex items-center gap-4 text-white">
              <div className="relative w-[140px] h-[140px]">
                <GoldenGauge pct={loading ? 0 : stats.punctualityRate} />
                <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold">
                  {loading ? "..." : `${stats.punctualityRate}%`}
                </span>
              </div>
              <div>
                <div className="text-xs opacity-80">الالتزام بالحضور</div>
                <div className="text-2xl font-black mt-1">{loading ? "..." : stats.present}</div>
                <div className="text-xs opacity-80 mt-1">موظف ملتزم</div>
              </div>
            </div>
          </div>

          {/* Card 2: Total Active Staff */}
          <div
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              boxShadow: "0 22px 48px rgba(37, 99, 235, 0.24)",
            }}
          >
            <Users2 size={84} className="absolute -left-3 -top-3 text-white/20" />
            <div className="relative z-10 text-white">
              <div className="text-xs opacity-80">الموظفون النشطون</div>
              {loading ? (
                <Skeleton className="h-10 w-24 mt-3 bg-white/20" />
              ) : (
                <div className="text-4xl font-black mt-2">{stats.activeStaffCount}</div>
              )}
              <div className="text-xs opacity-80 mt-1">اليوم</div>
            </div>
          </div>

          {/* Card 3: Today's Absence Alert */}
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
              {loading ? (
                <Skeleton className="h-10 w-24 mt-3 bg-white/20" />
              ) : (
                <div className="text-4xl font-black mt-2">{stats.absent}</div>
              )}
              <div className="text-xs opacity-80 mt-1">موظف غائب</div>
            </div>
          </div>

          {/* Card 4: Avg. Lateness */}
          <div
            className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
              boxShadow: "0 22px 48px rgba(245, 158, 11, 0.22)",
            }}
          >
            <Clock3 size={84} className="absolute -left-3 -top-3 text-white/20" />
            <div className="relative z-10 text-white">
              <div className="text-xs opacity-80">متوسط التأخر</div>
              {loading ? (
                <Skeleton className="h-10 w-24 mt-3 bg-white/20" />
              ) : (
                <div className="text-4xl font-black mt-2">{stats.avgLateness}</div>
              )}
              <div className="text-xs opacity-80 mt-1">دقيقة</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-700">الحالة</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="rounded-2xl bg-white">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="present">في الوقت المحدد</SelectItem>
                  <SelectItem value="absent">غائب</SelectItem>
                  <SelectItem value="late">متأخر</SelectItem>
                  <SelectItem value="excused">معذور</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-700">اسم الموظف</label>
              <input
                type="text"
                placeholder="ابحث عن موظف..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-700">من التاريخ</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={loadStaffAttendance} 
                className="w-full rounded-2xl gap-2 h-10 bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                تحديث
              </Button>
            </div>
          </div>
        </div>

        {/* Error */}
        {requestStatus === "error" && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-5 text-sm text-rose-700 shadow-lg">
            {fetchError || "عذراً، حدث خطأ أثناء تحميل إحصائيات الموظفين. يرجى المحاولة لاحقاً."}
          </div>
        )}

        {/* Staff Heatmap / Area Chart */}
        {requestStatus !== "error" && (
          <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <TrendingUp size={16} className="text-indigo-600" />
              <h3 className="font-extrabold">اتجاهات حضور الموظفين</h3>
            </div>
            {loading ? (
              <Skeleton className="h-[280px] w-full rounded-2xl" />
            ) : trendData.length === 0 ? (
              <EmptyState title="لا يوجد بيانات" desc="لا توجد سجلات اتجاه للحضور ضمن الفلاتر الحالية." />
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <AreaChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="onTimeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="onTime" 
                      name="في الوقت المحدد" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#onTimeGradient)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="late" 
                      name="متأخرون" 
                      stroke="#f59e0b" 
                      fillOpacity={1} 
                      fill="url(#lateGradient)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="absent" 
                      name="غائبون" 
                      stroke="#f43f5e" 
                      fillOpacity={1} 
                      fill="url(#absentGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Empty */}
        {requestStatus === "empty" && !loading && (
          <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl">
            <EmptyState title="لا يوجد بيانات" desc="لا توجد سجلات حضور موظفين ضمن الفلاتر الحالية." />
          </div>
        )}

        {/* Staff Ledger Table */}
        {requestStatus !== "error" && requestStatus !== "empty" && (
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : (
              rows.map((row, idx) => {
                const status = (row.status || "present") as EmployeeAttendanceStatus
                const config = statusBadgeConfig[status]

                // Calculate punctuality score for this employee
                const employeeRecords = rows.filter((r) => r.employee_name === row.employee_name)
                const employeePunctuality = 
                  employeeRecords.length > 0 
                    ? Math.round((employeeRecords.filter((r) => r.status === "present").length / employeeRecords.length) * 100)
                    : 0
                const punctualityColor = getPunctualityColor(employeePunctuality)

                return (
                  <div
                    key={String(row.id)}
                    className={`rounded-2xl border px-4 py-4 shadow-sm transition-all hover:shadow-md ${
                      idx % 2 === 0 ? "bg-white/90" : "bg-slate-50/80"
                    }`}
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Avatar */}
                      <div className="md:col-span-1">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white"
                          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
                        >
                          {row.initials || "—"}
                        </div>
                      </div>

                      {/* Employee Name */}
                      <div className="md:col-span-2">
                        <div className="text-[11px] text-slate-500">اسم الموظف</div>
                        <div className="font-semibold text-slate-900">{row.employee_name || "—"}</div>
                      </div>

                      {/* Date */}
                      <div className="md:col-span-2">
                        <div className="text-[11px] text-slate-500">التاريخ</div>
                        <div className="font-semibold text-slate-800">{row.date || "—"}</div>
                      </div>

                      {/* Time */}
                      <div className="md:col-span-1">
                        <div className="text-[11px] text-slate-500">الوقت</div>
                        <div className="font-semibold text-slate-800">{row.start_time || "—"}</div>
                      </div>

                      {/* Status Badge */}
                      <div className="md:col-span-2">
                        <div className="text-[11px] text-slate-500">الحالة</div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
                          {config.icon} {config.label}
                        </span>
                      </div>

                      {/* Punctuality Score */}
                      <div className="md:col-span-2">
                        <div className="text-[11px] text-slate-500">درجة الالتزام</div>
                        <div
                          className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                          style={{
                            background: punctualityColor.bg,
                            color: punctualityColor.text,
                            borderColor: punctualityColor.border,
                          }}
                        >
                          ⭐ {employeePunctuality}%
                        </div>
                      </div>

                      {/* Notes */}
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
    </AppLayout>
  )
}
