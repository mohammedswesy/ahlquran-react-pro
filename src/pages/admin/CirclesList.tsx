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

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [meta, setMeta] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listCircles({
        page,
        per_page: perPage,
        search: search || undefined,
      })

      setRows(res.data)
      setMeta(res.meta ?? null)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل الحلقات")
      setRows([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page])

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

    { accessorKey: "name", header: "Name" },

    { accessorKey: "type", header: "Type", cell: ({ getValue }) => (getValue() as any) || "—" },

    {
      id: "institute",
      header: "Institute",
      cell: ({ row }) =>
        row.original.institute?.name ??
        row.original.institute_name ??
        row.original.institute_id ??
        "—",
    },

    // ✅ أيام الدوام
    {
      id: "days",
      header: "الأيام",
      cell: ({ row }) => {
        const s = row.original.schedule
        if (!s?.days || !Array.isArray(s.days) || s.days.length === 0) return "—"
        return s.days.join(" - ")
      },
    },

    // ✅ الوقت
    {
      id: "time",
      header: "الوقت",
      cell: ({ row }) => {
        const s = row.original.schedule
        if (!s?.from || !s?.to) return "—"
        return `${s.from} - ${s.to}`
      },
    },

    {
      id: "students",
      header: "Students",
      cell: ({ row }) => row.original.students_count ?? "—",
    },

    {
      id: "teachers",
      header: "Teachers",
      cell: ({ row }) => row.original.teachers_count ?? "—",
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link to={`/admin/circles/${row.original.id}`}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ], [])


  return (
    <AppLayout>
      <Header title="الحلقات" subtitle="إدارة الحلقات" />

      <div dir="rtl" className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <Input
            label="بحث"
            placeholder="ابحث باسم الحلقة…"
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            className="w-72"
          />

          <Button variant="outline" onClick={load}>تحديث</Button>

          <Link to="/admin/circles/new">
            <Button>إضافة حلقة</Button>
          </Link>
        </div>

        <DataTable columns={columns} data={rows} isLoading={loading} searchKey="name" />

        {meta && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>صفحة {meta.current_page} من {meta.last_page}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                السابق
              </Button>
              <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>

    </AppLayout>
  )
}
