import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDollarSign,
  Crown,
  GraduationCap,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  FileSpreadsheet,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

import AppLayout from "@/layouts/AppLayout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

import { getAdminStatsOverview, type AdminOverviewStat } from "@/services/admin"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value)
}

function ProgressRing({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const dash = (safe / 100) * circumference

  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(220,203,160,.26)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#86efac"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div className="text-xl font-black text-white">{safe}%</div>
        <div className="text-[10px] text-amber-100">اليوم</div>
      </div>
    </div>
  )
}

function StatSkeleton() {
  return (
    <Card className="border-emerald-900/60 bg-[#0b3f38]">
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-4 w-32 bg-emerald-900/60" />
        <Skeleton className="h-8 w-20 bg-emerald-900/60" />
        <Skeleton className="h-4 w-28 bg-emerald-900/60" />
      </CardContent>
    </Card>
  )
}

const PIE_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#6366f1", "#f43f5e"]

const EMPTY_OVERVIEW: AdminOverviewStat = {
  total_students: 0,
  new_students_last_30_days: 0,
  active_teachers: 0,
  base_salary_sum: 0,
  monthly_base_salaries: 0,
  pending_payouts: 0,
  attendance_today_percentage: 0,
  monthly_registrations: [],
  level_distribution: [],
  payroll_list: [],
  critical_alerts: [],
  recent_activity: [],
}

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<AdminOverviewStat>(EMPTY_OVERVIEW)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await getAdminStatsOverview()
        setOverview(data)
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "تعذر تحميل لوحة القيادة التنفيذية")
        setOverview(EMPTY_OVERVIEW)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(
    () => [
      {
        key: "students",
        title: "إجمالي الطلاب",
        value: overview.total_students,
        trend: `+${overview.new_students_last_30_days} خلال 30 يوم`,
        icon: GraduationCap,
        accent: "text-white",
      },
      {
        key: "teachers",
        title: "المعلمون النشطون",
        value: overview.active_teachers,
        trend: "نشطون حالياً",
        icon: Users,
        accent: "text-white",
      },
      {
        key: "finance",
        title: "الرواتب الشهرية",
        value: formatCurrency(overview.base_salary_sum || overview.monthly_base_salaries || 0),
        trend: `معلّق: ${formatCurrency(overview.pending_payouts || 0)}`,
        icon: CircleDollarSign,
        accent: "text-white",
      },
      {
        key: "attendance",
        title: "معدل الحضور اليوم",
        value: `${Math.round(overview.attendance_today_percentage)}%`,
        trend: "المعاهد كافة",
        icon: TrendingUp,
        accent: "text-white",
      },
    ],
    [overview],
  )

  return (
    <AppLayout>
      <div
        dir="rtl"
        className="space-y-6 p-4 text-slate-100 sm:p-6 lg:p-8"
        style={{
          background:
            "radial-gradient(1000px 500px at 95% -10%, rgba(220,203,160,0.34), transparent 55%), radial-gradient(900px 500px at -15% 10%, rgba(6,78,59,0.18), transparent 60%), linear-gradient(180deg, #f8f7f2 0%, #efeee8 100%)",
          borderRadius: "28px",
          border: "1px solid rgba(6,78,59,0.14)",
        }}
      >
        <section className="rounded-3xl border border-[#bfa86a]/55 bg-gradient-to-l from-[#0b3f38] via-[#0f4a42] to-[#0b3f38] px-6 py-6 shadow-[0_20px_45px_rgba(6,78,59,0.3)] sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dccba0]/50 bg-[#dccba0]/10 px-3 py-1 text-xs font-bold text-[#f4e7c5]">
                <Crown className="h-3.5 w-3.5" />
                Executive Control
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#f4e7c5] sm:text-4xl">The Command Center</h1>
              <p className="mt-1 text-sm text-[#e9dfc2]">لوحة تنفيذية موحدة لمراقبة المنصة واتخاذ القرار</p>
            </div>
            <div className="rounded-2xl border border-[#dccba0]/35 bg-[#dccba0]/10 px-4 py-3 text-sm text-[#f6e9c7]">
              مزامنة مباشرة مع مؤشرات الطلاب، المعلمين، والرواتب
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => <StatSkeleton key={idx} />)
            : stats.map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.key} className="border-emerald-900/60 bg-[#0b3f38] shadow-[0_12px_30px_rgba(6,78,59,0.28)]">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold tracking-wide text-white/90">{item.title}</div>
                        <div className={`rounded-xl bg-white/10 p-2 ${item.accent}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="text-3xl font-black text-white">{item.value}</div>
                      <div className="inline-flex items-center gap-1 rounded-full border border-[#dccba0]/60 bg-[#dccba0]/12 px-2.5 py-1 text-xs font-semibold text-[#f4e7c5]">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        {item.trend}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="border-emerald-900/60 bg-[#0b3f38] xl:col-span-2">
            <CardHeader className="pb-2 text-base font-black text-[#f4e7c5]">نمو تسجيل الطلاب</CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] w-full bg-emerald-900/60" />
              ) : !overview.monthly_registrations || overview.monthly_registrations.length === 0 ? (
                <div className="grid h-[280px] place-items-center text-sm text-emerald-100">لا توجد بيانات متاحة حالياً</div>
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <LineChart data={overview.monthly_registrations}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d5c55" />
                      <XAxis dataKey="month" stroke="#f2e5c6" tick={{ fill: "#f2e5c6", fontSize: 12 }} />
                      <YAxis stroke="#f2e5c6" tick={{ fill: "#f2e5c6", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "#0b3f38", border: "1px solid #dccba0", color: "#fff" }} />
                      <Line type="monotone" dataKey="value" name="التسجيلات" stroke="#86efac" strokeWidth={3} dot={{ fill: "#86efac", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-900/60 bg-[#0b3f38]">
            <CardHeader className="pb-2 text-base font-black text-[#f4e7c5]">توزيع الطلاب حسب المستوى</CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] w-full bg-emerald-900/60" />
              ) : overview.level_distribution.length === 0 ? (
                <div className="grid h-[280px] place-items-center text-sm text-emerald-100">لا توجد بيانات متاحة حالياً</div>
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <PieChart>
                      <Pie data={overview.level_distribution} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={85}>
                        {overview.level_distribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0b3f38", border: "1px solid #dccba0", color: "#fff" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="border-rose-500/80 bg-[#4b1f25] xl:col-span-2">
            <CardHeader className="flex items-center justify-between pb-2">
              <h3 className="text-base font-black text-rose-100">تنبيهات حرجة</h3>
              <Badge variant="destructive">طلب تدخل فوري</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-12 w-full bg-rose-900/40" />)
              ) : overview.critical_alerts.length === 0 ? (
                <div className="rounded-xl border border-emerald-700/50 bg-emerald-500/10 p-4 text-sm text-emerald-200">لا توجد حالات تجاوزت 3 غيابات متتالية.</div>
              ) : (
                overview.critical_alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between rounded-xl border border-rose-600/60 bg-rose-900/30 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-300" />
                      <div>
                        <div className="text-sm font-semibold text-white">{alert.student_name}</div>
                        <div className="text-xs text-rose-200">{alert.circle_name || "دون حلقة محددة"}</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-rose-200">{alert.absences_count} غيابات</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-900/60 bg-[#0b3f38]">
            <CardHeader className="pb-1 text-base font-black text-[#f4e7c5]">حضور اليوم</CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Skeleton className="mx-auto h-32 w-32 rounded-full bg-emerald-900/60" />
              ) : (
                <div className="flex justify-center">
                  <ProgressRing value={overview.attendance_today_percentage} />
                </div>
              )}
              <div className="text-center text-xs text-emerald-100">تم احتساب النسبة من جميع الحلقات الفعالة اليوم</div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border-emerald-900/60 bg-[#0b3f38] lg:col-span-2">
            <CardHeader className="pb-2 text-base font-black text-[#f4e7c5]">آخر النشاطات</CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => <Skeleton key={idx} className="h-11 w-full bg-emerald-900/60" />)
              ) : overview.recent_activity.length === 0 ? (
                <div className="rounded-xl border border-emerald-900/70 px-4 py-3 text-sm text-emerald-100">لا توجد سجلات حديثة.</div>
              ) : (
                overview.recent_activity.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-emerald-900/70 bg-[#0d4a42] px-4 py-3">
                    <div className="text-sm text-slate-100">{item.action}</div>
                    <div className="text-xs text-[#f2e5c6]">{item.created_at || `#${index + 1}`}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-900/60 bg-[#0b3f38]">
            <CardHeader className="pb-2 text-base font-black text-[#f4e7c5]">اختصارات سريعة</CardHeader>
            <CardContent className="grid gap-3">
              <Link to="/admin/students?create=1">
                <Button className="w-full justify-start bg-emerald-600 text-white hover:bg-emerald-700">
                  <UserPlus className="h-4 w-4" />
                  Add Student
                </Button>
              </Link>
              <Link to="/admin/payroll-management">
                <Button className="w-full justify-start bg-[#dccba0] text-[#0b3f38] hover:bg-[#e6d6af]">
                  <Wallet className="h-4 w-4" />
                  Pay Salaries
                </Button>
              </Link>
              <Link to="/admin/reports">
                <Button variant="outline" className="w-full justify-start border-[#dccba0] text-[#f4e7c5] hover:bg-[#dccba0]/15">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Report
                </Button>
              </Link>
              <div className="pt-1">{StatusBadge.active({ children: "Live Sync" })}</div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-emerald-900/60 bg-[#0b3f38]">
            <CardHeader className="pb-2 text-base font-black text-[#f4e7c5]">تفاصيل رواتب الموظفين</CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-10 w-full bg-emerald-900/60" />
                  ))}
                </div>
              ) : !overview.payroll_list || overview.payroll_list.length === 0 ? (
                <div className="rounded-xl border border-emerald-900/70 px-4 py-3 text-sm text-emerald-100">لا توجد بيانات متاحة حالياً</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-emerald-900/70">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-[#0d4a42] text-[#f4e7c5]">
                      <tr>
                        <th className="px-3 py-2 text-right">الموظف</th>
                        <th className="px-3 py-2 text-right">الأساسي</th>
                        <th className="px-3 py-2 text-right">البدلات</th>
                        <th className="px-3 py-2 text-right">الاستقطاعات</th>
                        <th className="px-3 py-2 text-right">الصافي</th>
                        <th className="px-3 py-2 text-right">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.payroll_list.slice(0, 10).map((row) => (
                        <tr key={row.id} className="border-t border-emerald-900/70 text-slate-100">
                          <td className="px-3 py-2 font-semibold">{row.employee_name}</td>
                          <td className="px-3 py-2">{formatCurrency(row.base_salary || 0)}</td>
                          <td className="px-3 py-2">{formatCurrency(row.allowances || 0)}</td>
                          <td className="px-3 py-2">{formatCurrency(row.deductions || 0)}</td>
                          <td className="px-3 py-2 font-bold text-lime-300">{formatCurrency(row.net_salary || 0)}</td>
                          <td className="px-3 py-2">
                            {String(row.status).toLowerCase() === "paid"
                              ? StatusBadge.paid()
                              : String(row.status).toLowerCase() === "pending"
                                ? StatusBadge.pending()
                                : <Badge variant="secondary">{row.status}</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  )
}
