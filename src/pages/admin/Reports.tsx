import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import * as XLSX from "xlsx"
import {
  CalendarDays,
  Download,
  FileDown,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Trophy,
  Users,
  UserCheck,
} from "lucide-react"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

import { listCircles, type Circle } from "@/services/circles"
import { listTeachers, type Teacher } from "@/services/teachers"
import { listEmployees } from "@/services/employees"
import {
  attendanceAnalytics,
  attendanceSummary,
  exportAttendancesPDF,
  listAttendances,
  type Attendance,
  type AttendanceAnalytics,
  type AttendanceStatus,
} from "@/services/attendances"
import { fetchInstituteAdminDashboard } from "@/services/instituteAdminDashboard"

type DatePreset = "custom" | "7d" | "30d"

type TeacherOption = {
  id: number
  name: string
  circle_id?: number | null
}

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10)
}

function shiftDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function toNum(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function statusLabel(s: AttendanceStatus | null | undefined) {
  switch (s) {
    case "present":
      return "حاضر"
    case "absent":
      return "غائب"
    case "late":
      return "متأخر"
    case "excused":
      return "معذور"
    default:
      return "غير محدد"
  }
}

function buildLastDays(summary: any[], days: number) {
  const today = new Date()
  const dict = new Map<string, any>()
  summary.forEach((row) => {
    const key = String(row?.date ?? row?.day ?? "")
    if (key) dict.set(key, row)
  })

  const out: Array<{ date: string; present: number; absent: number; late: number; excused: number; total: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const date = toYmd(shiftDays(today, -i))
    const row = dict.get(date) ?? {}
    const present = toNum(row.present)
    const absent = toNum(row.absent)
    const late = toNum(row.late)
    const excused = toNum(row.excused)
    out.push({
      date,
      present,
      absent,
      late,
      excused,
      total: present + absent + late + excused,
    })
  }
  return out
}

function pctDelta(a: number, b: number) {
  if (!a && !b) return 0
  if (!a) return 100
  return Math.round(((b - a) / a) * 100)
}

export default function Reports() {
  const today = new Date()

  const [preset, setPreset] = useState<DatePreset>("30d")
  const [dateFrom, setDateFrom] = useState(toYmd(shiftDays(today, -29)))
  const [dateTo, setDateTo] = useState(toYmd(today))

  const [branch, setBranch] = useState("all")
  const [teacher, setTeacher] = useState("all")

  const [circles, setCircles] = useState<Circle[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])

  const [rows, setRows] = useState<Attendance[]>([])
  const [summary, setSummary] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null)

  const [teacherCount, setTeacherCount] = useState(0)
  const [studentCount, setStudentCount] = useState(0)
  const [employeeRoles, setEmployeeRoles] = useState<Record<string, number>>({})

  const [loading, setLoading] = useState(true)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingXlsx, setExportingXlsx] = useState(false)

  useEffect(() => {
    if (preset === "custom") return

    const end = new Date()
    const from = preset === "7d" ? shiftDays(end, -6) : shiftDays(end, -29)
    setDateFrom(toYmd(from))
    setDateTo(toYmd(end))
  }, [preset])

  useEffect(() => {
    ;(async () => {
      try {
        const [circleRes, teacherRes] = await Promise.all([
          listCircles({ per_page: 1000 }),
          listTeachers({ per_page: 1000 }),
        ])

        setCircles(circleRes?.data ?? [])
        setTeachers(
          (teacherRes?.data ?? []).map((t) => ({
            id: t.id,
            name: t.name || t.user?.name || `#${t.id}`,
            circle_id: t.circle_id ?? null,
          }))
        )
      } catch {
        setCircles([])
        setTeachers([])
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params: any = {
          per_page: 500,
          date_from: dateFrom,
          date_to: dateTo,
        }
        if (branch !== "all") params.circle_id = Number(branch)

        const [attRes, summaryRes, analyticsRes, dashboardRes, teacherRes, employeesRes] = await Promise.all([
          listAttendances(params),
          attendanceSummary(params),
          attendanceAnalytics(params),
          fetchInstituteAdminDashboard().catch(() => null),
          listTeachers({ per_page: 1000, ...(branch !== "all" ? { circle_id: Number(branch) } : {}) }).catch(() => ({ data: [] as Teacher[] })),
          listEmployees({ per_page: 1000 }).catch(() => [] as any),
        ])

        const nextRows =
          attRes && typeof attRes === "object" && "data" in attRes
            ? (attRes as any).data ?? []
            : ((attRes as any) ?? [])

        setRows(Array.isArray(nextRows) ? nextRows : [])
        setSummary(Array.isArray(summaryRes) ? summaryRes : [])
        setAnalytics(analyticsRes ?? null)

        setTeacherCount((teacherRes?.data ?? []).length || toNum(dashboardRes?.stats?.teachers_count))
        setStudentCount(toNum(dashboardRes?.stats?.students_count))

        const employeesList = Array.isArray(employeesRes)
          ? employeesRes
          : Array.isArray((employeesRes as any)?.data)
          ? (employeesRes as any).data
          : []

        const roleCount = employeesList.reduce((acc: Record<string, number>, emp: any) => {
          const role = String(emp?.role || emp?.role_name || "staff")
          acc[role] = (acc[role] ?? 0) + 1
          return acc
        }, {})
        setEmployeeRoles(roleCount)
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "تعذر تحميل بيانات التقارير")
        setRows([])
        setSummary([])
        setAnalytics(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [branch, dateFrom, dateTo])

  const selectedTeacher = useMemo(
    () => teachers.find((t) => String(t.id) === teacher) ?? null,
    [teacher, teachers]
  )

  const line30 = useMemo(() => buildLastDays(summary, 30), [summary])

  const filteredByTeacher = useMemo(() => {
    if (!selectedTeacher) return rows

    return rows.filter((r) => {
      const circleId = toNum((r as any)?.circle_id ?? (r as any)?.circle?.id)
      const teacherId = toNum((r as any)?.teacher_id ?? (r as any)?.teacher?.id)
      return teacherId === selectedTeacher.id || (selectedTeacher.circle_id ? circleId === selectedTeacher.circle_id : false)
    })
  }, [rows, selectedTeacher])

  const attendanceRate = useMemo(() => {
    const fromAnalytics = toNum(analytics?.totals?.present_rate)
    if (fromAnalytics > 0) return fromAnalytics

    const total = filteredByTeacher.length
    if (!total) return 0
    const present = filteredByTeacher.filter((r) => r.status === "present").length
    return Math.round((present / total) * 100)
  }, [analytics, filteredByTeacher])

  const studentGrowth = useMemo(() => {
    if (!line30.length) return 0
    const half = Math.floor(line30.length / 2)
    const first = line30.slice(0, half).reduce((sum, d) => sum + d.present, 0)
    const second = line30.slice(half).reduce((sum, d) => sum + d.present, 0)
    return pctDelta(first, second)
  }, [line30])

  const topCircle = useMemo(() => {
    if (analytics?.best_circle?.circle_name) return analytics.best_circle.circle_name
    const byCircle = analytics?.by_circle ?? []
    if (!byCircle.length) return "—"
    const sorted = [...byCircle].sort((a, b) => toNum(b.present_rate) - toNum(a.present_rate))
    return sorted[0]?.circle_name ?? "—"
  }, [analytics])

  const byCircleBars = useMemo(() => {
    const raw = analytics?.by_circle ?? []
    let scoped = raw
    if (selectedTeacher?.circle_id) {
      scoped = raw.filter((r) => toNum(r.circle_id) === toNum(selectedTeacher.circle_id))
    }
    return scoped.slice(0, 8).map((r) => ({
      name: r.circle_name,
      score: toNum(r.present_rate),
      present: toNum(r.present),
      absent: toNum(r.absent),
    }))
  }, [analytics, selectedTeacher])

  const rolePie = useMemo(() => {
    const teacherRoles = employeeRoles.teacher ?? 0
    const adminRoles = employeeRoles.admin ?? 0
    const staffRoles = employeeRoles.staff ?? 0

    const teacherValue = teacherRoles > 0 ? teacherRoles : teacherCount

    return [
      { name: "معلمون", value: teacherValue, color: "#10b981" },
      { name: "مشرفون", value: adminRoles, color: "#6366f1" },
      { name: "موظفون", value: staffRoles, color: "#f59e0b" },
    ].filter((x) => x.value > 0)
  }, [employeeRoles, teacherCount])

  async function onExportPdf() {
    setExportingPdf(true)
    try {
      const params: any = { date_from: dateFrom, date_to: dateTo }
      if (branch !== "all") params.circle_id = Number(branch)
      const blob = await exportAttendancesPDF(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reports_${dateFrom}_to_${dateTo}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("تعذر تنزيل تقرير PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  async function onExportXlsx() {
    setExportingXlsx(true)
    try {
      const exportRows = filteredByTeacher.map((r) => ({
        التاريخ: String(r.date ?? ""),
        الحلقة: String((r as any)?.circle?.name ?? (r as any)?.circle_name ?? "—"),
        الطالب: String((r as any)?.student?.name ?? (r as any)?.student_name ?? "—"),
        الحالة: statusLabel(r.status),
        ملاحظات: String(r.notes ?? ""),
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reports")
      XLSX.writeFile(workbook, `reports_${dateFrom}_to_${dateTo}.xlsx`)
    } catch {
      toast.error("تعذر تصدير Excel")
    } finally {
      setExportingXlsx(false)
    }
  }

  return (
    <AppLayout>
      <Header
        title="لوحة التقارير الشاملة"
        subtitle="مركز بصري ذكي لتحليلات الحضور والأداء الأكاديمي"
      />

      <div className="p-4 sm:p-6" dir="rtl">
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          <aside className="w-full xl:w-72 xl:shrink-0">
            <div className="relative z-10 rounded-3xl border border-white/20 bg-white/60 backdrop-blur-xl p-5 shadow-2xl space-y-5 xl:sticky xl:top-6">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                <Filter size={16} />
                فلاتر التقرير
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">النطاق الزمني</label>
                <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
                  <SelectTrigger className="rounded-2xl border-slate-200 bg-white/90">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">آخر 7 أيام</SelectItem>
                    <SelectItem value="30d">آخر شهر</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">من</label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">إلى</label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-2xl" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">الفرع / الحلقة</label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger className="rounded-2xl border-slate-200 bg-white/90">
                    <SelectValue placeholder="كل الفروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفروع</SelectItem>
                    {circles.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">المعلم</label>
                <Select value={teacher} onValueChange={setTeacher}>
                  <SelectTrigger className="rounded-2xl border-slate-200 bg-white/90">
                    <SelectValue placeholder="كل المعلمين" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المعلمين</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 space-y-3">
                <div className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                  <Download size={14} />
                  قسم التصدير
                </div>
                <Button onClick={onExportPdf} disabled={exportingPdf || loading} className="w-full rounded-2xl gap-2 bg-slate-900 hover:bg-slate-800">
                  <FileDown size={16} />
                  {exportingPdf ? "جاري التحميل..." : "Download PDF Report"}
                </Button>
                <Button onClick={onExportXlsx} disabled={exportingXlsx || loading} className="w-full rounded-2xl gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <FileSpreadsheet size={16} />
                  {exportingXlsx ? "جاري التحضير..." : "Export Excel"}
                </Button>
              </div>
            </div>
          </aside>

          <main className="relative z-0 min-w-0 flex-1 w-full space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="relative isolate overflow-hidden rounded-3xl border border-indigo-200 bg-indigo-50/70 backdrop-blur-xl p-5 shadow-[0_20px_45px_rgba(99,102,241,0.18)]">
                <div className="text-xs text-indigo-700 font-semibold flex items-center gap-2">
                  <Users size={14} /> إجمالي الطلاب
                </div>
                <div className="text-4xl font-black text-indigo-800 mt-2">{studentCount}</div>
                <div className="text-xs text-indigo-600 mt-2">
                  {studentGrowth >= 0 ? "+" : ""}{studentGrowth}% عن الفترة السابقة
                </div>
              </div>

              <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/70 backdrop-blur-xl p-5 shadow-[0_20px_45px_rgba(16,185,129,0.18)]">
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-2">
                  <UserCheck size={14} /> نسبة الحضور العامة
                </div>
                <div className="h-20 mt-2">
                  <ResponsiveContainer>
                    <RadialBarChart
                      data={[{ name: "rate", value: attendanceRate }]}
                      innerRadius="70%"
                      outerRadius="100%"
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar dataKey="value" cornerRadius={12} fill="#10b981" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-xl font-black text-emerald-800 text-center -mt-2">{attendanceRate}%</div>
              </div>

              <div className="relative isolate overflow-hidden rounded-3xl border border-amber-200 bg-amber-50/70 backdrop-blur-xl p-5 shadow-[0_20px_45px_rgba(245,158,11,0.18)]">
                <div className="text-xs text-amber-700 font-semibold flex items-center gap-2">
                  <Trophy size={14} /> أفضل حلقة
                </div>
                <div className="text-xl font-black text-amber-800 mt-3 truncate">{topCircle}</div>
                <div className="text-xs text-amber-600 mt-2">الأعلى في نسبة الالتزام</div>
              </div>

              <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-200 bg-white/60 backdrop-blur-xl p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
                <div className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                  <GraduationCap size={14} /> المعلمون النشطون
                </div>
                <div className="text-4xl font-black text-emerald-700 mt-2">{teacherCount}</div>
                <Badge className="mt-2 bg-emerald-100 text-emerald-700 border border-emerald-200">Active Teachers</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-5">
              <section className="relative isolate min-w-0 overflow-hidden 2xl:col-span-2 rounded-3xl border border-white/20 bg-white/60 backdrop-blur-xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-slate-800">اتجاه الحضور خلال آخر 30 يوم</h3>
                    <p className="text-xs text-slate-500 mt-1">Attendance Heatline للارتفاع والانخفاض اليومي</p>
                  </div>
                  <LineChartIcon size={18} className="text-indigo-500" />
                </div>

                <div className="h-[320px]">
                  <ResponsiveContainer>
                    <AreaChart data={line30}>
                      <defs>
                        <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
                        </linearGradient>
                        <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#gPresent)" strokeWidth={2.2} />
                      <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="url(#gAbsent)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="relative isolate min-w-0 overflow-hidden rounded-3xl border border-white/20 bg-white/60 backdrop-blur-xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-slate-800">توزيع الأدوار</h3>
                    <p className="text-xs text-slate-500 mt-1">تفصيل الكادر الإداري والتعليمي</p>
                  </div>
                  <PieChartIcon size={18} className="text-indigo-500" />
                </div>

                <div className="h-[320px]">
                  {rolePie.length ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={rolePie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                          {rolePie.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full grid place-items-center text-sm text-slate-500">لا توجد بيانات توزيع متاحة</div>
                  )}
                </div>
              </section>
            </div>

            <section className="relative isolate min-w-0 overflow-hidden rounded-3xl border border-white/20 bg-white/60 backdrop-blur-xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-slate-800">مقارنة الأداء الأكاديمي بين الحلقات</h3>
                  <p className="text-xs text-slate-500 mt-1">اعتمادًا على مؤشر الالتزام ونسب الحضور</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border border-amber-200">Academic Bar Chart</Badge>
              </div>

              <div className="h-[340px] min-w-0">
                {byCircleBars.length ? (
                  <ResponsiveContainer>
                    <BarChart data={byCircleBars}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full grid place-items-center text-sm text-slate-500">لا توجد بيانات مقارنة حالياً</div>
                )}
              </div>
            </section>

            {loading && (
              <div className="relative isolate rounded-3xl border border-white/20 bg-white/60 backdrop-blur-xl p-6 text-center text-slate-500">
                جاري تحميل مركز التحليلات...
              </div>
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  )
}
