import AppLayout from "@/layouts/AppLayout"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/datatable"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

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

import {
  Users,
  School,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  BarChart3,
  FileText,
  Laptop,
  Star,
  IdCard,
  Settings,
  LibraryBig,
} from "lucide-react"

import SkeletonTable from "@/components/ui/skeleton-table"
import EmptyState from "@/components/ui/empty-state"

// ✅ جديد: للتمييز بين super-admin وغيره
import { useAuth, type Role } from "@/store/auth"

type Tone = "brand" | "beige"

type QuickCard = {
  label: string
  to?: string
  icon: React.ElementType
  count?: number | string
  tone?: Tone // اختياري، لو بدك تثبّت لون كرت معين
}

function toneClass(t: Tone) {
  if (t === "brand") {
    return (
      "bg-[linear-gradient(135deg,rgba(0,61,53,.94),rgba(0,61,53,.55))] " +
      "border border-[rgba(220,203,160,.22)]"
    )
  }

  return (
    "bg-[linear-gradient(135deg,rgba(220,203,160,.94),rgba(220,203,160,.55))] " +
    "border border-[rgba(0,61,53,.14)]"
  )
}

function toneText(t: Tone) {
  // الأخضر => نص أبيض
  if (t === "brand") {
    return {
      title: "rgba(254,254,254,.96)",
      sub: "rgba(254,254,254,.82)",
      hint: "rgba(254,254,254,.72)",
      iconBg: "rgba(254,254,254,.12)",
      iconBorder: "rgba(254,254,254,.18)",
      iconColor: "rgba(254,254,254,.95)",
      watermark: "rgba(254,254,254,.12)",
    }
  }

  // البيج => نص أخضر
  return {
    title: "rgba(0,61,53,.95)",
    sub: "rgba(0,61,53,.82)",
    hint: "rgba(0,61,53,.70)",
    iconBg: "rgba(0,61,53,.10)",
    iconBorder: "rgba(0,61,53,.18)",
    iconColor: "rgba(0,61,53,.95)",
    watermark: "rgba(0,61,53,.10)",
  }
}

export default function AdminDashboard() {
  const role = useAuth((s) => s.role as Role | null)
  const isSuperAdmin = role === "super-admin"

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<Institute[]>([])
  const [attendance, setAttendance] = useState<
    Array<{ date: string; present: number; absent: number; late: number; excused: number }>
  >([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchDashboard()
      const s: any = (res as any)?.stats ?? (res as any)?.totals ?? res
      const r: any[] = (res as any)?.recentInstitutes ?? (res as any)?.recent_institutes ?? []
      const a: any[] = (res as any)?.attendance_week ?? (res as any)?.attendance?.week ?? []

      setStats(s || null)
      setRecent(Array.isArray(r) ? r : [])
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
      setAttendance([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const quick: QuickCard[] = [
    { label: "أولياء أمور", icon: Users, count: (stats as any)?.parents ?? "—", to: "/admin/parents", tone: "brand" },
    { label: "الحلقات", icon: BookOpen, count: (stats as any)?.circles ?? "—", to: "/admin/circles", tone: "brand" },
    { label: "المعلمين", icon: School, count: (stats as any)?.teachers ?? "—", to: "/admin/employees", tone: "brand" },
    { label: "الطلبة", icon: Users, count: (stats as any)?.students ?? "—", to: "/admin/students", tone: "brand" },

    { label: "مواظبة الموظفين", icon: CalendarCheck2, to: "/admin/employee-attendance" },
    { label: "مواظبة المعلمين", icon: CalendarCheck2, to: "/admin/teacher-attendance" },
    { label: "الحضور والغياب", icon: CheckCircle2, to: "/admin/attendance" },
    { label: "الحفظ والمراجعة", icon: BookOpen, to: "" },

    { label: "اختبارات", icon: FileText, to: "#" },
    { label: "الخطط والمقررات", icon: BookOpen, to: "#" },
    { label: "الإحصاءات", icon: BarChart3, to: "#" },
    { label: "التقارير", icon: FileText, to: "/admin/Reports" },

    { label: "المكتبة", icon: LibraryBig, to: "#" },
    { label: "المقرأة الإلكترونية", icon: Laptop, to: "#" },
    { label: "السجل الذهبي", icon: Star, to: "#" },
    { label: "إعداد البطاقات", icon: IdCard, to: "#" },

    { label: "الإعدادات", icon: Settings, to: "/settings", tone: "brand" },
  ]

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
      <div dir="rtl" className="space-y-6">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text)]">لوحة القيادة</h1>
            <div className="text-xs text-[var(--muted)] mt-1">ملخص سريع + روابط الإدارة الأساسية</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={load}>تحديث</Button>

            {/* ✅ إدارة المعاهد فقط للسوبر أدمن */}
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

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ...(typeof (stats as any)?.institutes === "number"
              ? [{ title: "المعاهد", value: (stats as any)?.institutes, Icon: School }]
              : []),

            { title: "الطلاب", value: (stats as any)?.students ?? "—", Icon: Users },
            { title: "الحلقات", value: (stats as any)?.circles ?? "—", Icon: BookOpen },
            { title: "المعلمين", value: (stats as any)?.teachers ?? "—", Icon: School },
          ].map((s, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="flex items-center justify-between">
                <div className="text-sm text-[var(--muted)]">{s.title}</div>
                <div className="rounded-2xl p-2 border border-[var(--border)] bg-[rgba(254,254,254,.06)]">
                  <s.Icon size={18} className="text-[var(--text)] opacity-90" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-[var(--text)]">{s.value}</div>
                <div className="text-xs text-[var(--muted)] mt-1">آخر تحديث: الآن</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {quick.map((c, i) => {
            const Icon = c.icon

            const COLS = 4
            const tone: Tone = c.tone ?? (Math.floor(i / COLS) % 2 === 0 ? "brand" : "beige")
            const palette = toneText(tone)

            const box = (
              <div
                className={[
                  "relative overflow-hidden rounded-[28px] p-5 transition-all",
                  "shadow-[var(--shadow2)] hover:translate-y-[-1px]",
                  toneClass(tone),
                ].join(" ")}
              >
                <div
                  className="absolute -left-8 -bottom-10 text-[110px]"
                  style={{ color: palette.watermark }}
                >
                  <Icon />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-2xl p-3 border"
                      style={{
                        background: palette.iconBg,
                        borderColor: palette.iconBorder,
                      }}
                    >
                      <Icon size={22} style={{ color: palette.iconColor }} />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-base font-extrabold" style={{ color: palette.title }}>
                        {c.label}
                      </span>

                      {c.count !== undefined && (
                        <span className="text-sm" style={{ color: palette.sub }}>
                          {c.count}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs" style={{ color: palette.hint }}>
                    فتح
                  </div>
                </div>
              </div>
            )

            return c.to ? (
              <Link key={i} to={c.to} className="block">
                {box}
              </Link>
            ) : (
              <div key={i}>{box}</div>
            )
          })}
        </div>

        {/* Attendance chart */}
        {attendance.length > 0 && (
          <Card>
            <CardHeader className="font-extrabold text-[var(--text)]">حضور الأسبوع</CardHeader>
            <CardContent>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <AreaChart data={attendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="present" name="حاضر" strokeOpacity={1} fillOpacity={0.2} />
                    <Area type="monotone" dataKey="absent" name="غائب" strokeOpacity={1} fillOpacity={0.2} />
                    <Area type="monotone" dataKey="late" name="متأخر" strokeOpacity={1} fillOpacity={0.2} />
                    <Area type="monotone" dataKey="excused" name="مُعذّر" strokeOpacity={1} fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent institutes */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="font-extrabold text-[var(--text)]">آخر المعاهد</div>

            {/* عرض الكل فقط للسوبر أدمن */}
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
              <EmptyState title="لا توجد معاهد حديثة" desc="ابدأ بإضافة معهد جديد." />
            ) : (
              <DataTable columns={columns} data={recent} isLoading={false} />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
