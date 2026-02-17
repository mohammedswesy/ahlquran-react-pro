import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/datatable"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { listMyCircles, type TeacherCircle } from "@/services/circles"
import { listStudentsByCircleForAttendance, type MiniStudent } from "@/services/students"
import { createReviewRecord, listCircleReviews, type ReviewRecord } from "@/services/reviews"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Row = {
  id: number
  name: string
  from_surah: string
  from_ayah: string
  to_surah: string
  to_ayah: string
  pages_count: string
  evaluation: string
  mistakes_count: string
  notes: string
  hasExisting: boolean
}

function todayISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Reviews() {
  const [params, setParams] = useSearchParams()
  const initialCircle = Number(params.get("circle_id") || 0)

  const [circles, setCircles] = useState<TeacherCircle[]>([])
  const [openCircle, setOpenCircle] = useState(false)

  const [circleId, setCircleId] = useState<number | undefined>(initialCircle || undefined)
  const [date, setDate] = useState<string>(() => params.get("date") || todayISO())

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // load teacher circles
  useEffect(() => {
    ;(async () => {
      try {
        const data = await listMyCircles()
        setCircles(data)
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "تعذر تحميل الحلقات")
      }
    })()
  }, [])

  async function hydrateRows(circle_id: number, session_date: string) {
    setLoading(true)
    try {
      const [studs, existing]: [MiniStudent[], ReviewRecord[]] = await Promise.all([
        listStudentsByCircleForAttendance(circle_id),
        listCircleReviews(circle_id, session_date),
      ])

      const existingByStudent = new Map<number, ReviewRecord>()
      for (const r of existing) {
        const sid = Number(r.student?.id ?? r.student_id ?? 0)
        if (sid) existingByStudent.set(sid, r)
      }

      setRows(
        studs.map((s) => {
          const ex = existingByStudent.get(s.id)
          return {
            id: s.id,
            name: s.name,
            from_surah: ex ? String(ex.range?.from_surah ?? "") : "",
            from_ayah: ex ? String(ex.range?.from_ayah ?? "") : "",
            to_surah: ex ? String(ex.range?.to_surah ?? "") : "",
            to_ayah: ex ? String(ex.range?.to_ayah ?? "") : "",
            pages_count: ex?.pages_count != null ? String(ex.pages_count) : "",
            evaluation: ex?.evaluation != null ? String(ex.evaluation) : "",
            mistakes_count: ex?.mistakes_count != null ? String(ex.mistakes_count) : "",
            notes: ex?.notes ?? "",
            hasExisting: Boolean(ex),
          }
        }),
      )

      // sync url
      const p = new URLSearchParams(params)
      p.set("circle_id", String(circle_id))
      p.set("date", session_date)
      setParams(p, { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل بيانات المراجعات")
    } finally {
      setLoading(false)
    }
  }

  // load students + existing reviews when circle/date changes
  useEffect(() => {
    if (!circleId) {
      setRows([])
      return
    }
    hydrateRows(circleId, date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circleId])

  useEffect(() => {
    if (!circleId) return
    hydrateRows(circleId, date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  function updateRow(id: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const columns: ColumnDef<Row>[] = useMemo(
    () => [
      { header: "#", cell: ({ row }) => row.index + 1 },
      {
        id: "name",
        header: "اسم الطالب",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.name}</span>
            {row.original.hasExisting ? <Badge>مسجّل</Badge> : null}
          </div>
        ),
      },
      {
        id: "from",
        header: "من (سورة/آية)",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Input
              type="number"
              min={1}
              max={114}
              placeholder="سورة"
              value={row.original.from_surah}
              className="w-20 h-8"
              onChange={(e) => updateRow(row.original.id, "from_surah", e.target.value)}
            />
            <Input
              type="number"
              min={1}
              placeholder="آية"
              value={row.original.from_ayah}
              className="w-20 h-8"
              onChange={(e) => updateRow(row.original.id, "from_ayah", e.target.value)}
            />
          </div>
        ),
      },
      {
        id: "to",
        header: "إلى (سورة/آية)",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Input
              type="number"
              min={1}
              max={114}
              placeholder="سورة"
              value={row.original.to_surah}
              className="w-20 h-8"
              onChange={(e) => updateRow(row.original.id, "to_surah", e.target.value)}
            />
            <Input
              type="number"
              min={1}
              placeholder="آية"
              value={row.original.to_ayah}
              className="w-20 h-8"
              onChange={(e) => updateRow(row.original.id, "to_ayah", e.target.value)}
            />
          </div>
        ),
      },
      {
        id: "pages",
        header: "عدد الصفحات",
        cell: ({ row }) => (
          <Input
            type="number"
            min={1}
            max={30}
            className="w-24 h-8"
            value={row.original.pages_count}
            onChange={(e) => updateRow(row.original.id, "pages_count", e.target.value)}
          />
        ),
      },
      {
        id: "evaluation",
        header: "التقييم (1–5)",
        cell: ({ row }) => (
          <Input
            type="number"
            min={1}
            max={5}
            className="w-20 h-8"
            value={row.original.evaluation}
            onChange={(e) => updateRow(row.original.id, "evaluation", e.target.value)}
          />
        ),
      },
      {
        id: "mistakes",
        header: "عدد الأخطاء",
        cell: ({ row }) => (
          <Input
            type="number"
            min={0}
            max={200}
            className="w-24 h-8"
            value={row.original.mistakes_count}
            onChange={(e) => updateRow(row.original.id, "mistakes_count", e.target.value)}
          />
        ),
      },
      {
        id: "notes",
        header: "ملاحظات",
        cell: ({ row }) => (
          <Input
            type="text"
            className="w-64 h-8"
            value={row.original.notes}
            onChange={(e) => updateRow(row.original.id, "notes", e.target.value)}
          />
        ),
      },
    ],
    [],
  )

  const circleName = (id?: number) => {
    if (!id) return "اختر الحلقة"
    const c = circles.find((x) => x.id === id)
    return c?.name || `حلقة #${id}`
  }

  async function onSubmit() {
    if (!circleId) {
      toast.warning("اختر الحلقة أولًا")
      return
    }
    if (!date) {
      toast.warning("اختر التاريخ")
      return
    }

    // لازم يكون في Range + تفاصيل (حسب قيود الباك)
    const candidates = rows.filter((r) => {
      const hasRange = r.from_surah && r.from_ayah && r.to_surah && r.to_ayah
      const hasDetails = r.pages_count || r.evaluation || r.mistakes_count || r.notes
      return hasRange && hasDetails && !r.hasExisting
    })

    if (candidates.length === 0) {
      toast.warning("لا يوجد مراجعات جديدة للإرسال")
      return
    }

    setSaving(true)
    try {
      for (const r of candidates) {
        await createReviewRecord({
          circle_id: circleId,
          student_id: r.id,
          session_date: date,
          from_surah: Number(r.from_surah),
          from_ayah: Number(r.from_ayah),
          to_surah: Number(r.to_surah),
          to_ayah: Number(r.to_ayah),
          pages_count: r.pages_count ? Number(r.pages_count) : null,
          evaluation: r.evaluation ? Number(r.evaluation) : null,
          mistakes_count: r.mistakes_count ? Number(r.mistakes_count) : 0,
          notes: r.notes || null,
        })
      }

      toast.success("تم حفظ المراجعات بنجاح")
      // refresh existing state
      await hydrateRows(circleId, date)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر حفظ المراجعات")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <Header title="المراجعات" subtitle="تسجيل مراجعة الطلاب (حسب الحلقة والتاريخ)" />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex gap-2 items-center">
            {/* Circle selector */}
            <Popover open={openCircle} onOpenChange={setOpenCircle}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[220px] justify-between">
                  {circleName(circleId)}
                  <ChevronsUpDown className="h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[320px]" align="start">
                <Command>
                  <CommandInput placeholder="ابحث عن الحلقة..." />
                  <CommandEmpty>لا نتائج</CommandEmpty>
                  <CommandGroup>
                    {circles.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => {
                          setCircleId(c.id)
                          setOpenCircle(false)
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${c.id === circleId ? "opacity-100" : "opacity-0"}`} />
                        {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Date */}
            <Input type="date" className="w-[170px]" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button onClick={onSubmit} disabled={saving || !circleId}>
              {saving ? "جارٍ الحفظ..." : "حفظ المراجعات"}
            </Button>
          </div>
        </div>

        <DataTable columns={columns} data={rows} isLoading={loading} />
      </div>
    </AppLayout>
  )
}
