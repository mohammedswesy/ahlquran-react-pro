import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/ui/page"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import EmptyState from "@/components/ui/empty-state"
import SkeletonTable from "@/components/ui/skeleton-table"

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

import { listCircles } from "@/services/circles"
import {
  listAttendances,
  attendanceSummary,
  attendanceAnalytics,
  exportAttendancesCSV,
  exportAttendancesPDF,
  type Attendance,
  type AttendanceStatus,
  type AttendanceAnalytics,
} from "@/services/attendances"

type CircleOption = { id: number; name: string }

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10)
}

function statusLabel(s: AttendanceStatus | null | undefined) {
  switch (s) {
    case "present": return "حاضر"
    case "absent": return "غائب"
    case "late": return "متأخر"
    case "excused": return "مُعذّر"
    default: return "غير محدد"
  }
}

export default function Reports() {
  const today = toYmd(new Date())

  const [circles, setCircles] = useState<CircleOption[]>([])
  const [circleId, setCircleId] = useState<string>("all")
  const [status, setStatus] = useState<AttendanceStatus | "all">("all")

  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  const [rows, setRows] = useState<Attendance[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null)

  const [meta, setMeta] = useState<any>(null)
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [exportingCsv, setExportingCsv] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    ; (async () => {
      try {
        const res = await listCircles({ per_page: 1000 })
        setCircles((res?.data ?? []).map((c: any) => ({ id: c.id, name: c.name })))
      } catch {
        setCircles([])
      }
    })()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [circleId, status, dateFrom, dateTo])

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const params: any = {
        page,
        per_page: 15,
        date_from: dateFrom,
        date_to: dateTo,
      }

      if (circleId !== "all") params.circle_id = Number(circleId)
      if (status !== "all") params.status = status

      const res = await listAttendances(params)
      if (res && typeof res === "object" && "data" in res) {
        setRows((res as any).data ?? [])
        setMeta((res as any).meta ?? null)
      } else {
        setRows((res as any) ?? [])
        setMeta(null)
      }

      const summary = await attendanceSummary(params)
      setChartData(Array.isArray(summary) ? summary : [])

      const a = await attendanceAnalytics(params)
      setAnalytics(a ?? null)
    } catch (e: any) {
      setError(e?.message ?? "حدث خطأ")
      setRows([])
      setChartData([])
      setAnalytics(null)
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, circleId, status, dateFrom, dateTo])

  const totals = useMemo(() => {
    // KPI المعروض من analytics لو موجود
    if (analytics?.totals) return analytics.totals
    const present = rows.filter(r => r.status === "present").length
    const absent = rows.filter(r => r.status === "absent").length
    const late = rows.filter(r => r.status === "late").length
    const excused = rows.filter(r => r.status === "excused").length
    const total = meta?.total ?? rows.length
    const present_rate = total ? Math.round((present / total) * 100) : 0
    return { total, present, absent, late, excused, present_rate }
  }, [analytics, rows, meta])

  async function exportCsv() {
    setExportingCsv(true)
    try {
      const params: any = { date_from: dateFrom, date_to: dateTo }
      if (circleId !== "all") params.circle_id = Number(circleId)
      if (status !== "all") params.status = status

      const blob = await exportAttendancesCSV(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendance_${dateFrom}_to_${dateTo}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExportingCsv(false)
    }
  }

  async function exportPdf() {
    setExportingPdf(true)
    try {
      const params: any = { date_from: dateFrom, date_to: dateTo }
      if (circleId !== "all") params.circle_id = Number(circleId)
      if (status !== "all") params.status = status

      const blob = await exportAttendancesPDF(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendance_${dateFrom}_to_${dateTo}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="p-4 sm:p-6" dir="rtl">
      <PageHeader
        title="تقارير الحضور"
        subtitle="Server-side filters + Pagination + CSV/PDF + Analytics"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCsv}
              disabled={exportingCsv}
              className="rounded-2xl border border-[var(--border)] px-4 py-2 font-bold"
              style={{ boxShadow: "var(--shadow1)" }}
            >
              {exportingCsv ? "جارٍ التصدير..." : "تصدير CSV"}
            </button>

            <button
              onClick={exportPdf}
              disabled={exportingPdf}
              className="rounded-2xl border border-[var(--border)] px-4 py-2 font-bold"
              style={{ boxShadow: "var(--shadow1)" }}
            >
              {exportingPdf ? "جارٍ تجهيز PDF..." : "تصدير PDF"}
            </button>

            <button
              onClick={load}
              className="rounded-2xl border border-[var(--border)] px-4 py-2 font-bold"
              style={{ boxShadow: "var(--shadow1)" }}
            >
              تحديث
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="rounded-[28px]">
          <CardHeader className="pb-2"><div className="font-bold">الحلقة</div></CardHeader>
          <CardContent>
            <Select value={circleId} onValueChange={setCircleId}>
              <SelectTrigger><SelectValue placeholder="اختر حلقة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {circles.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader className="pb-2"><div className="font-bold">الحالة</div></CardHeader>
          <CardContent>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue placeholder="اختر حالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="present">حاضر</SelectItem>
                <SelectItem value="absent">غائب</SelectItem>
                <SelectItem value="late">متأخر</SelectItem>
                <SelectItem value="excused">مُعذّر</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader className="pb-2"><div className="font-bold">من تاريخ</div></CardHeader>
          <CardContent>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader className="pb-2"><div className="font-bold">إلى تاريخ</div></CardHeader>
          <CardContent>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </CardContent>
        </Card>
      </div>

      {/* KPI */}
      <div className="mt-3 grid gap-3 md:grid-cols-6">
        {[
          ["الإجمالي", totals.total],
          ["حاضر", totals.present],
          ["غائب", totals.absent],
          ["متأخر", totals.late],
          ["مُعذّر", totals.excused],
          ["نسبة الحضور", `${totals.present_rate}%`],
        ].map(([t, v]) => (
          <Card key={String(t)} className="rounded-[28px]">
            <CardHeader className="pb-2"><div className="font-bold">{t}</div></CardHeader>
            <CardContent className="text-2xl font-extrabold">{v as any}</CardContent>
          </Card>
        ))}
      </div>

      {/* Best/Worst + Top absences */}
      {analytics && (
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <Card className="rounded-[28px]">
            <CardHeader className="pb-2"><div className="font-bold">أفضل حلقة</div></CardHeader>
            <CardContent>
              {analytics.best_circle ? (
                <div className="space-y-1">
                  <div className="text-lg font-extrabold">{analytics.best_circle.circle_name}</div>
                  <div className="text-sm opacity-70">
                    نسبة حضور: <b>{analytics.best_circle.present_rate}%</b> — إجمالي: {analytics.best_circle.total}
                  </div>
                </div>
              ) : (
                <div className="opacity-70">لا يوجد</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px]">
            <CardHeader className="pb-2"><div className="font-bold">أقل حلقة</div></CardHeader>
            <CardContent>
              {analytics.worst_circle ? (
                <div className="space-y-1">
                  <div className="text-lg font-extrabold">{analytics.worst_circle.circle_name}</div>
                  <div className="text-sm opacity-70">
                    نسبة حضور: <b>{analytics.worst_circle.present_rate}%</b> — إجمالي: {analytics.worst_circle.total}
                  </div>
                </div>
              ) : (
                <div className="opacity-70">لا يوجد</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px]">
            <CardHeader className="pb-2"><div className="font-bold">Top Absences</div></CardHeader>
            <CardContent>
              {analytics.top_absences?.length ? (
                <div className="space-y-2">
                  {analytics.top_absences.slice(0, 5).map((x) => (
                    <div key={x.user_id} className="flex items-center justify-between text-sm">
                      <span className="font-bold">{x.user_name}</span>
                      <span className="opacity-80">{x.absences} غياب</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="opacity-70">لا يوجد بيانات</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <div className="mt-3">
        <Card className="rounded-[28px]">
          <CardHeader className="pb-2"><div className="font-bold">اتجاه الحضور حسب اليوم</div></CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <EmptyState title="لا يوجد بيانات" desc="جرّب تغيير الفلاتر أو نطاق التاريخ." />
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="present" name="حاضر" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="absent" name="غائب" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="late" name="متأخر" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="excused" name="مُعذّر" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By circle table */}
      {analytics?.by_circle?.length ? (
        <div className="mt-3">
          <Card className="rounded-[28px]">
            <CardHeader className="pb-2">
              <div className="font-bold">تحليل حسب الحلقة</div>
              <div className="text-xs opacity-70">Top حلقات حسب إجمالي السجلات</div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-right border-b border-[var(--border)]">
                      <th className="py-2">الحلقة</th>
                      <th className="py-2">إجمالي</th>
                      <th className="py-2">حاضر</th>
                      <th className="py-2">غائب</th>
                      <th className="py-2">نسبة حضور</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.by_circle.slice(0, 8).map((c) => (
                      <tr key={c.circle_id} className="border-b border-[var(--border)]">
                        <td className="py-2 font-bold">{c.circle_name}</td>
                        <td className="py-2">{c.total}</td>
                        <td className="py-2">{c.present}</td>
                        <td className="py-2">{c.absent}</td>
                        <td className="py-2">
                          <Badge variant="secondary">{c.present_rate}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Table (paginated) */}
      <div className="mt-3">
        <Card className="rounded-[28px]">
          <CardHeader className="pb-2"><div className="font-bold">السجلات</div></CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={8} />
            ) : error ? (
              <EmptyState title="خطأ" desc={error} />
            ) : rows.length === 0 ? (
              <EmptyState title="لا يوجد بيانات" desc="لا يوجد سجلات ضمن الفلاتر الحالية." />
            ) : (
              <>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-right border-b border-[var(--border)]">
                        <th className="py-2">التاريخ</th>
                        <th className="py-2">الاسم</th>
                        <th className="py-2">الحلقة</th>
                        <th className="py-2">الحالة</th>
                        <th className="py-2">عذر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r: any) => (
                        <tr key={r.id} className="border-b border-[var(--border)]">
                          <td className="py-2 whitespace-nowrap">
                            {String(r.start_time ?? r.date ?? "-").slice(0, 10)}
                          </td>
                          <td className="py-2">{r.user?.name ?? r.student?.name ?? "-"}</td>
                          <td className="py-2">{r.circle?.name ?? r.circle_name ?? "-"}</td>
                          <td className="py-2">
                            <Badge variant="secondary">{statusLabel(r.status)}</Badge>
                          </td>
                          <td className="py-2">{r.excuse ?? r.notes ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {meta && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button
                      disabled={!meta.prev_page_url}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-2xl border border-[var(--border)] px-4 py-2 font-bold disabled:opacity-50"
                    >
                      السابق
                    </button>

                    <div className="text-sm opacity-80">
                      صفحة {meta.current_page} من {meta.last_page} — الإجمالي: {meta.total}
                    </div>

                    <button
                      disabled={!meta.next_page_url}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-2xl border border-[var(--border)] px-4 py-2 font-bold disabled:opacity-50"
                    >
                      التالي
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
