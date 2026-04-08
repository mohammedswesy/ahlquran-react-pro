// src/pages/admin/CirclesList.tsx
import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import Stat from "@/components/Stat"
import { StatusBadge } from "@/components/ui/badge"
import { Users, Target, GraduationCap } from "lucide-react"

import { listCircles, deleteCircle, type Circle } from "@/services/circles"

const DAY_AR: Record<string, string> = {
  sat: "السبت",
  sun: "الأحد",
  mon: "الإثنين",
  tue: "الثلاثاء",
  wed: "الأربعاء",
  thu: "الخميس",
  fri: "الجمعة",
}

function normTime(t?: string | null) {
  if (!t) return ""
  const m = String(t).match(/(\d{2}:\d{2})/)
  return m?.[1] ?? String(t)
}


function parseSchedule(schedule: any): Array<{ days: string[]; from?: string; to?: string }> {
  if (!schedule) return []

  if (typeof schedule === "string") {
    try {
      schedule = JSON.parse(schedule)
    } catch {
      return []
    }
  }

  if (Array.isArray(schedule)) {
    return schedule
      .map((s) => ({
        days: Array.isArray(s?.days) ? s.days : [],
        from: normTime(s?.from),
        to: normTime(s?.to),
      }))
      .filter((x) => x.days.length || x.from || x.to)
  }

  // object (supports legacy from/to and new slots[])
  const days = Array.isArray(schedule?.days) ? schedule.days : []
  const slots = Array.isArray(schedule?.slots) ? schedule.slots : null

  if (slots && slots.length) {
    return slots
      .map((s: any) => ({ days, from: normTime(s?.from), to: normTime(s?.to) }))
      .filter((x) => x.days.length || x.from || x.to)
  }

  return [{ days, from: normTime(schedule?.from), to: normTime(schedule?.to) }].filter(
    (x) => x.days.length || x.from || x.to
  )
}

function ScheduleCell({ schedule }: { schedule: any }) {
  const lines = parseSchedule(schedule)
  if (!lines.length) return <span className="text-[var(--muted)]">—</span>

  return (
    <div className="flex flex-col gap-1">
      {lines.map((l, idx) => {
        const days = l.days.map((d) => DAY_AR[d] ?? d)
        const timeLabel = l.from && l.to ? `${l.from} → ${l.to}` : l.from ? `من ${l.from}` : l.to ? `إلى ${l.to}` : ""

        return (
          <div key={idx} className="flex flex-wrap items-center gap-1">
            {days.length ? (
              days.map((d) => (
                <span
                  key={d}
                  className="px-2 py-1 rounded-full text-[11px] font-semibold border"
                  style={{
                    background: "rgba(0,61,53,.06)",
                    borderColor: "rgba(0,61,53,.18)",
                    color: "rgba(0,61,53,.95)",
                  }}
                >
                  {d}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[var(--muted)]">بدون أيام</span>
            )}

            {timeLabel && (
              <span
                className="px-2 py-1 rounded-full text-[11px] font-semibold border"
                style={{
                  background: "rgba(220,203,160,.35)",
                  borderColor: "rgba(0,61,53,.18)",
                  color: "rgba(0,61,53,.95)",
                }}
              >
                {timeLabel}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CirclesList() {
  const [rows, setRows] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listCircles({
        per_page: 1000, // Load all for client-side pagination
      })

      setRows(res.data)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل الحلقات")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onDelete = async (id: number) => {
    if (!confirm("متأكد من حذف الحلقة؟")) return
    try {
      await deleteCircle(id)
      setRows((p) => p.filter((x) => x.id !== id))
      toast.success("تم الحذف")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الحذف")
    }
  }

  const columns = useMemo<ColumnDef<Circle>[]>(() => [
    { id: "idx", header: "#", cell: ({ row }) => row.index + 1 },

    { accessorKey: "name", header: "اسم الحلقة" },

    { accessorKey: "type", header: "النوع", cell: ({ getValue }) => (getValue() as any) || "—" },

    {
      id: "institute",
      header: "المعهد",
      cell: ({ row }) =>
        row.original.institute?.name ??
        row.original.institute_name ??
        row.original.institute_id ??
        "—",
    },

    {
      id: "students",
      header: "عدد الطلاب",
      cell: ({ row }) => row.original.students_count ?? "—",
    },

    {
      id: "teachers",
      header: "المعلمون",
      cell: ({ row }) => row.original.teachers_count ?? "—",
    },

    // Schedule/Time
    {
      id: "schedule",
      header: "الجدول الزمني",
      cell: ({ row }) => <ScheduleCell schedule={row.original.schedule} />,
    },

    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link to={`/admin/circles/${row.original.id}`}>
            <Button size="sm" variant="outline">تعديل</Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(row.original.id)}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ], [])


  return (
    <AppLayout>
      <Header title="الحلقات" subtitle="إدارة الحلقات" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Stat
          label="إجمالي الحلقات"
          value={rows.length}
          icon={<Target className="w-6 h-6" />}
          color="primary"
        />
        <Stat
          label="متوسط الطلاب لكل حلقة"
          value={rows.length > 0 ? Math.round(rows.reduce((sum, c) => sum + (c.students_count || 0), 0) / rows.length) : 0}
          icon={<Users className="w-6 h-6" />}
          color="success"
        />
        <Stat
          label="المعلمون النشطون"
          value={rows.reduce((sum, c) => sum + (c.teachers_count || 0), 0)}
          icon={<GraduationCap className="w-6 h-6" />}
          color="warning"
        />
      </div>

      <div dir="rtl" className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <Button variant="outline" onClick={load}>تحديث</Button>

          <Link to="/admin/circles/new">
            <Button>إضافة حلقة</Button>
          </Link>
        </div>

        <DataTable columns={columns} data={rows} isLoading={loading} searchKey="name" />
      </div>

    </AppLayout>
  )
}
