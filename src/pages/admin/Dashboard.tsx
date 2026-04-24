import AppLayout from "@/layouts/AppLayout"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import Stat from "@/components/Stat"
import {
  School,
  Users,
  BookOpen,
  CalendarCheck2,
  UserPlus,
  Target,
  FileText,
  Landmark,
} from "lucide-react"

import { fetchDashboard, type DashboardStats } from "@/services/dashboard"
import type { Institute } from "@/services/institutes"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts"

import SkeletonTable from "@/components/ui/skeleton-table"
import EmptyState from "@/components/ui/empty-state"
import LoadingBar from "@/components/ui/loading-bar"
import { useAuth, type Role } from "@/store/auth"

export default function AdminDashboard() {
  const role = useAuth((s) => s.role as Role | null)
  const isSuperAdmin = role === "super-admin"
  const isInstituteAdmin = role === "institute-admin" || role === "sub-admin"

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<Institute[]>([])
  const [attendance, setAttendance] = useState<
    Array<{ date: string; present: number; absent: number; late: number; excused: number }>
  >([])
  const [subscriptionStatuses, setSubscriptionStatuses] = useState<Array<{ label: string; count: number }>>([])
  const [globalLogs, setGlobalLogs] = useState<
    Array<{ id: string | number; action: string; actor: string; created_at: string; level?: "info" | "warning" | "error" }>
  >([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchDashboard(role)
      // محاولة استخراج البيانات بناءً على هيكلية الـ API المتوقعة
      const s: any = (res as any)?.stats ?? (res as any)?.totals ?? res
      const r: any[] =
        (res as any)?.recentInstitutes ??
        (res as any)?.recent_institutes ??
        []
      const a: any[] = (res as any)?.attendance_week ?? (res as any)?.attendance?.week ?? []
      const subs: any[] =
        (res as any)?.subscriptionStatuses ??
        (res as any)?.subscription_statuses ??
        []
      const logs: any[] = (res as any)?.globalLogs ?? (res as any)?.global_logs ?? []

      setStats(s || null)
      setRecent(isSuperAdmin && Array.isArray(r) ? r : [])
      setSubscriptionStatuses(isSuperAdmin && Array.isArray(subs) ? subs : [])
      setGlobalLogs(isSuperAdmin && Array.isArray(logs) ? logs : [])
      setAttendance(
        Array.isArray(a)
          ? a.map((p: any) => ({
            date: String(p.date ?? p.day ?? ""),
            present: Number(p.present ?? p.p ?? 0),
            absent: Number(p.absent ?? p.a ?? 0),
            late: Number(p.late ?? p.l ?? 0),
            excused: Number(p.excused ?? p.e ?? 0),
          }))
          : []
      )
    } catch (e: any) {
      toast.info("سيتم ربط إحصاءات الداشبورد حال تجهيز الـ API")
      setStats(null)
      setRecent([])
      setSubscriptionStatuses([])
      setGlobalLogs([])
      setAttendance([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const statCards = useMemo(
    () => (
      <div className={`grid grid-cols-1 ${isInstituteAdmin ? "md:grid-cols-3" : "md:grid-cols-4"} gap-6`}>
        {isSuperAdmin && (
          <Stat
            label="إجمالي المعاهد"
            value={(stats as any)?.institutes ?? (stats as any)?.institutes_count ?? "—"}
            icon={<School className="w-6 h-6" />}
            color="primary"
          />
        )}
        {isSuperAdmin && (
          <Stat
            label="إجمالي الإيرادات"
            value={(stats as any)?.revenue ?? (stats as any)?.total_revenue ?? "—"}
            icon={<Landmark className="w-6 h-6" />}
            color="warning"
          />
        )}
        <Stat
          label={isInstituteAdmin ? "إجمالي طلاب المعهد" : "إجمالي الطلاب"}
          value={(stats as any)?.students ?? (stats as any)?.students_count ?? "—"}
          icon={<Users className="w-6 h-6" />}
          color="success"
        />
        <Stat
          label="إجمالي الحلقات"
          value={(stats as any)?.circles ?? "—"}
          icon={<BookOpen className="w-6 h-6" />}
          color="warning"
        />
        <Stat
          label="إجمالي المعلمين"
          value={(stats as any)?.teachers ?? "—"}
          icon={<School className="w-6 h-6" />}
          color="primary"
        />
      </div>
    ),
    [isInstituteAdmin, isSuperAdmin, stats]
  )

  const columns = useMemo<ColumnDef<Institute>[]>(
    () => [
      { header: "#", cell: ({ row }) => row.index + 1 },
      { accessorKey: "name", header: "اسم المعهد" },
      { accessorKey: "city", header: "المدينة", cell: ({ getValue }) => getValue() || "—" },
    ],
    []
  )

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6 p-6">
        <LoadingBar active={loading} />
        {/* العناوين والأزرار */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text)]">لوحة القيادة</h1>
            <div className="text-xs text-[var(--muted)] mt-1">
              {isSuperAdmin
                ? "نظرة عامة على أداء المنصة بالكامل"
                : "ملخص أداء معهدك وإدارة فريقك"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={load}>تحديث</Button>

            {isSuperAdmin && (
              <Link to="/admin/institutes">
                <Button variant="outline">إدارة المعاهد</Button>
              </Link>
            )}

            <Link to="/admin/students">
              <Button variant="outline">إدارة الطلاب</Button>
            </Link>
          </div>
        </div>

        {/* كروت الإحصاءات KPI */}
        {statCards}

        {/* الروابط السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/admin/students">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[var(--brand)]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--brand)] text-white">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text)]">تسجيل طالب</h3>
                  <p className="text-sm text-[var(--muted)]">إضافة طالب جديد</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/circles">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[var(--brand)]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--brand)] text-white">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text)]">إنشاء حلقة</h3>
                  <p className="text-sm text-[var(--muted)]">إضافة حلقة جديدة</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/attendance/take">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[var(--brand)]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--brand)] text-white">
                  <CalendarCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text)]">تسجيل الحضور</h3>
                  <p className="text-sm text-[var(--muted)]">إدارة حضور الطلاب</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/admin/reports">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[var(--brand)]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--brand)] text-white">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text)]">عرض التقارير</h3>
                  <p className="text-sm text-[var(--muted)]">تقارير وإحصائيات</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {isSuperAdmin && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="font-extrabold text-[var(--text)] text-right">حالات الاشتراكات</CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonTable rows={4} cols={2} />
                ) : subscriptionStatuses.length === 0 ? (
                  <EmptyState title="لا توجد بيانات اشتراكات" desc="ستظهر هنا إحصاءات الباقات والاشتراكات عند توفرها." />
                ) : (
                  <div className="space-y-2">
                    {subscriptionStatuses.map((item, idx) => (
                      <div key={`${item.label}-${idx}`} className="flex items-center justify-between rounded-xl border px-3 py-2">
                        <div className="text-sm font-semibold text-[var(--text)]">{item.label}</div>
                        <div className="text-lg font-black text-[var(--brand)]">{item.count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="font-extrabold text-[var(--text)] text-right">السجل العام للنظام</CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonTable rows={4} cols={3} />
                ) : globalLogs.length === 0 ? (
                  <EmptyState title="لا توجد سجلات" desc="سيظهر آخر نشاط المنصة في هذه المساحة." />
                ) : (
                  <div className="space-y-2">
                    {globalLogs.map((log) => (
                      <div key={log.id} className="rounded-xl border px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-sm text-[var(--text)]">{log.action}</div>
                          <div className="text-xs text-[var(--muted)]">{log.created_at || "—"}</div>
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-1">بواسطة: {log.actor}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* الرسم البياني للحضور */}
        {attendance.length > 0 && (
          <Card>
            <CardHeader className="font-extrabold text-[var(--text)] text-right">حضور الأسبوع</CardHeader>
            <CardContent>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <AreaChart data={attendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="present" name="حاضر" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="absent" name="غائب" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* جدول المعاهد الأخيرة */}
        {isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="font-extrabold text-[var(--text)]">آخر المعاهد المضافة</div>
              {isSuperAdmin && (
                <Link to="/admin/institutes">
                  <Button size="sm" variant="outline">عرض الكل</Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={5} cols={3} />
              ) : recent.length === 0 ? (
                <EmptyState title="لا توجد معاهد" desc="ابدأ بإضافة معهد جديد لنظامك." />
              ) : (
                <DataTable columns={columns} data={recent} isLoading={false} />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}