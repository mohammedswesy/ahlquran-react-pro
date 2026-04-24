import { useCallback, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Loader2 } from "lucide-react"
import { FiDownload } from "react-icons/fi"
import { toast } from "sonner"
import { PiPlusBold, PiMagnifyingGlassBold, PiTrashBold, PiExamBold } from "react-icons/pi"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  listExams,
  createExam,
  deleteExam,
  downloadCertificate,
  calcResult,
  type Exam,
  type ExamPayload,
} from "@/services/exams"
import { fetchStudents, type StudentRow } from "@/services/students"
import { listCircles, type Circle } from "@/services/circles"
import {
  getCircleTrackColor,
  getCircleTrackDescription,
  getCircleTrackName,
} from "@/lib/circleTracks"

// ─── helpers ────────────────────────────────────────────────────────────────

function ResultBadge({ result }: { result: string }) {
  if (result === "passed")
    return <Badge variant="success">ناجح ✓</Badge>
  return <Badge variant="destructive">راسب ✗</Badge>
}

function percentColor(pct: number) {
  if (pct >= 85) return "#16a34a"
  if (pct >= 60) return "#d97706"
  return "#dc2626"
}

// ─── initial form state ─────────────────────────────────────────────────────

const EMPTY_FORM: ExamPayload & { _studentSearch: string } = {
  student_id: 0,
  circle_id: null,
  exam_name: "",
  score: 0,
  max_score: 100,
  exam_date: new Date().toISOString().slice(0, 10),
  notes: "",
  _studentSearch: "",
}

// ────────────────────────────────────────────────────────────────────────────

export default function ExamsList() {
  // ── table state ──────────────────────────────────────────────────────────
  const [rows, setRows] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCircle, setFilterCircle] = useState<string>("all")

  // ── circles (for filter dropdown) ────────────────────────────────────────
  const [circles, setCircles] = useState<Circle[]>([])

  // ── students (for modal search) ──────────────────────────────────────────
  const [students, setStudents] = useState<StudentRow[]>([])
  const [studentSearch, setStudentSearch] = useState("")
  const [studentLoading, setStudentLoading] = useState(false)

  // ── modal ─────────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [downloadingCertificateId, setDownloadingCertificateId] = useState<number | null>(null)

  // ─── load circles on mount ────────────────────────────────────────────────
  useEffect(() => {
    listCircles({ per_page: 200 })
      .then((r) => setCircles(r.data))
      .catch(() => {})
  }, [])

  // ─── load exams ────────────────────────────────────────────────────────────
  const loadExams = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { per_page: 200 }
      if (search.trim()) params.search = search.trim()
      if (filterCircle !== "all") params.circle_id = Number(filterCircle)
      const res = await listExams(params)
      setRows(res.data)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل الاختبارات")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [search, filterCircle])

  useEffect(() => {
    const id = setTimeout(loadExams, 300)
    return () => clearTimeout(id)
  }, [loadExams])

  // ─── student search inside modal ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setStudentLoading(true)
    const id = setTimeout(async () => {
      try {
        const res = await fetchStudents({
          search: studentSearch.trim() || undefined,
          per_page: 30,
        })
        setStudents(res.data)
      } catch {
        setStudents([])
      } finally {
        setStudentLoading(false)
      }
    }, 300)
    return () => clearTimeout(id)
  }, [studentSearch, open])

  // ─── form helpers ──────────────────────────────────────────────────────────
  function openCreate() {
    setForm({ ...EMPTY_FORM })
    setStudentSearch("")
    setFormError(null)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setFormError(null)
  }

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  // live grade preview
  const liveResult = calcResult(Number(form.score), Number(form.max_score))
  const livePct =
    Number(form.max_score) > 0
      ? Math.round((Number(form.score) / Number(form.max_score)) * 100)
      : 0

  // ─── submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setFormError(null)

    if (!form.student_id) return setFormError("يرجى اختيار الطالب")
    if (!form.exam_name.trim()) return setFormError("يرجى إدخال اسم الاختبار")
    if (Number(form.max_score) <= 0) return setFormError("الدرجة القصوى يجب أن تكون أكبر من صفر")
    if (Number(form.score) < 0 || Number(form.score) > Number(form.max_score))
      return setFormError("الدرجة يجب أن تكون بين 0 والدرجة القصوى")
    if (!form.exam_date) return setFormError("يرجى تحديد تاريخ الاختبار")

    setSaving(true)
    try {
      await createExam({
        student_id: Number(form.student_id),
        circle_id: form.circle_id ? Number(form.circle_id) : null,
        exam_name: form.exam_name.trim(),
        score: Number(form.score),
        max_score: Number(form.max_score),
        exam_date: form.exam_date,
        notes: form.notes?.trim() || null,
      })
      toast.success("تم تسجيل الاختبار بنجاح")
      closeModal()
      loadExams()
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        Object.values(e?.response?.data?.errors ?? {})?.[0] ||
        "تعذر حفظ الاختبار"
      setFormError(String(msg))
    } finally {
      setSaving(false)
    }
  }

  // ─── delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    if (!confirm("هل تريد حذف هذا الاختبار؟")) return
    try {
      await deleteExam(id)
      toast.success("تم الحذف")
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر الحذف")
    }
  }

  async function handleDownloadCertificate(examId: number) {
    setDownloadingCertificateId(examId)
    toast.success("جاري تحميل الشهادة...")
    try {
      await downloadCertificate(examId)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل الشهادة")
    } finally {
      setDownloadingCertificateId(null)
    }
  }

  // ─── selected student label ───────────────────────────────────────────────
  const selectedStudentName = useMemo(() => {
    if (!form.student_id) return null
    return students.find((s) => s.id === form.student_id)?.name ?? `#${form.student_id}`
  }, [form.student_id, students])

  const selectedCircle = useMemo(() => {
    if (!form.circle_id) return null
    return circles.find((circle) => circle.id === form.circle_id) ?? null
  }, [circles, form.circle_id])

  // ─── columns ──────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<Exam>[]>(
    () => [
      {
        id: "index",
        header: "#",
        cell: ({ row }) => (
          <span className="text-[var(--muted)] text-xs">{row.index + 1}</span>
        ),
      },
      {
        id: "student",
        header: "الطالب",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.student?.name || `#${row.original.student_id}`}</span>
        ),
      },
      {
        id: "exam_name",
        header: "اسم الاختبار",
        cell: ({ row }) => (
          <span className="font-semibold text-[var(--brand)]">{row.original.exam_name}</span>
        ),
      },
      {
        id: "circle",
        header: "الحلقة",
        cell: ({ row }) => row.original.circle?.name || <span className="text-[var(--muted)]">—</span>,
      },
      {
        id: "score",
        header: "الدرجة",
        cell: ({ row }) => {
          const { score, max_score } = row.original
          const pct = max_score > 0 ? Math.round((score / max_score) * 100) : 0
          return (
            <div className="flex items-center gap-2">
              <span className="font-bold tabular-nums" style={{ color: percentColor(pct) }}>
                {score}/{max_score}
              </span>
              <span className="text-xs text-[var(--muted)]">({pct}%)</span>
            </div>
          )
        },
      },
      {
        id: "result",
        header: "النتيجة",
        cell: ({ row }) => <ResultBadge result={row.original.result} />,
      },
      {
        id: "exam_date",
        header: "التاريخ",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums" style={{ color: "var(--muted)" }}>
            {row.original.exam_date}
          </span>
        ),
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => {
          const exam = row.original
          const isDownloading = downloadingCertificateId === exam.id

          return (
            <div className="flex items-center gap-2">
              {exam.result === "passed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                  onClick={() => handleDownloadCertificate(exam.id)}
                  disabled={isDownloading}
                  title="تحميل الشهادة"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FiDownload className="h-4 w-4" />
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleDelete(exam.id)}
              >
                <PiTrashBold size={14} />
              </Button>
            </div>
          )
        },
      },
    ],
    [downloadingCertificateId]
  )

  // ─── stats ─────────────────────────────────────────────────────────────────
  const passCount = rows.filter((r) => r.result === "passed").length
  const failCount = rows.filter((r) => r.result === "failed").length
  const avgScore =
    rows.length > 0
      ? Math.round(
          rows.reduce((acc, r) => acc + (r.max_score > 0 ? (r.score / r.max_score) * 100 : 0), 0) /
            rows.length
        )
      : 0

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            سجل الاختبارات
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            تسجيل ومتابعة نتائج اختبارات الطلاب
          </p>
        </div>
        <Button onClick={openCreate}>
          <PiPlusBold size={16} className="ml-1" />
          تسجيل اختبار جديد
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ background: "rgba(0,61,53,0.08)" }}>
            <PiExamBold size={20} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>إجمالي الاختبارات</div>
            <div className="text-xl font-extrabold tabular-nums">{rows.length}</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl grid place-items-center bg-emerald-100">
            <span className="text-lg font-bold text-emerald-700">✓</span>
          </div>
          <div>
            <div className="text-xs text-emerald-700">ناجحون</div>
            <div className="text-xl font-extrabold tabular-nums text-emerald-700">{passCount}</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl grid place-items-center bg-red-100">
            <span className="text-lg font-bold text-red-600">✗</span>
          </div>
          <div>
            <div className="text-xs text-red-600">راسبون</div>
            <div className="text-xl font-extrabold tabular-nums text-red-600">{failCount}</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <PiMagnifyingGlassBold
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--muted)" }}
              />
              <input
                dir="rtl"
                type="text"
                placeholder="بحث باسم الطالب أو الاختبار..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border px-4 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-[var(--brand)]"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>

            {/* Circle filter */}
            <div className="min-w-[180px]">
              <Select value={filterCircle} onValueChange={setFilterCircle}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية بالحلقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحلقات</SelectItem>
                  {circles.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {rows.length > 0 && (
              <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,61,53,0.06)", color: "var(--brand)" }}>
                متوسط الدرجات: <strong>{avgScore}%</strong>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            isLoading={loading}
            searchPlaceholder="بحث..."
          />
        </CardContent>
      </Card>

      {/* ─── Create Exam Modal ──────────────────────────────────────────────── */}
      <Modal
        open={open}
        onClose={closeModal}
        title="تسجيل اختبار جديد"
        description="أدخل بيانات الاختبار وسيتم احتساب النتيجة تلقائياً"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ الاختبار"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {formError && (
            <div
              className="rounded-xl border px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.2)",
                color: "#dc2626",
              }}
            >
              {formError}
            </div>
          )}

          {/* Student Search */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              الطالب <span className="text-red-500">*</span>
            </label>

            {form.student_id ? (
              <div className="flex items-center justify-between rounded-lg border px-4 py-2.5"
                style={{ background: "rgba(0,61,53,0.05)", borderColor: "var(--brand)" }}>
                <span className="font-semibold text-sm" style={{ color: "var(--brand)" }}>
                  {selectedStudentName}
                </span>
                <button
                  type="button"
                  onClick={() => { set("student_id", 0); setStudentSearch("") }}
                  className="text-xs text-[var(--muted)] hover:text-red-600 transition-colors"
                >
                  تغيير
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <PiMagnifyingGlassBold
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--muted)" }}
                  />
                  <input
                    dir="rtl"
                    type="text"
                    placeholder="ابحث باسم الطالب..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full rounded-lg border px-4 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-[var(--brand)]"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  />
                </div>
                {studentLoading ? (
                  <div className="text-xs text-center py-2" style={{ color: "var(--muted)" }}>جاري البحث...</div>
                ) : students.length > 0 ? (
                  <div
                    className="rounded-lg border overflow-hidden max-h-44 overflow-y-auto"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-[rgba(0,61,53,0.06)]"
                        style={{ color: "var(--text)", borderBottom: "1px solid var(--border)" }}
                        onClick={() => set("student_id", s.id)}
                      >
                        {s.name || `#${s.id}`}
                      </button>
                    ))}
                  </div>
                ) : studentSearch ? (
                  <div className="text-xs text-center py-2" style={{ color: "var(--muted)" }}>لا توجد نتائج</div>
                ) : null}
              </div>
            )}
          </div>

          {/* Exam Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              اسم الاختبار <span className="text-red-500">*</span>
            </label>
            <Input
              dir="rtl"
              placeholder="مثال: اختبار سورة البقرة"
              value={form.exam_name}
              onChange={(e) => set("exam_name", e.target.value)}
            />
          </div>

          {/* Score / Max Score */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                الدرجة المحققة <span className="text-red-500">*</span>
              </label>
              <Input
                dir="rtl"
                type="number"
                min={0}
                max={form.max_score}
                placeholder="0"
                value={form.score}
                onChange={(e) => set("score", Number(e.target.value) as any)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                الدرجة القصوى <span className="text-red-500">*</span>
              </label>
              <Input
                dir="rtl"
                type="number"
                min={1}
                placeholder="100"
                value={form.max_score}
                onChange={(e) => set("max_score", Number(e.target.value) as any)}
              />
            </div>
          </div>

          {/* Live result preview */}
          {Number(form.max_score) > 0 && (
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{
                background: liveResult === "passed" ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                border: `1px solid ${liveResult === "passed" ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
              }}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                النتيجة المتوقعة
              </span>
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: percentColor(livePct) }}
                >
                  {livePct}%
                </span>
                <ResultBadge result={liveResult} />
              </div>
            </div>
          )}

          {/* Circle */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              الحلقة (اختياري)
            </label>
            <Select
              value={form.circle_id ? String(form.circle_id) : "none"}
              onValueChange={(v) => set("circle_id", v === "none" ? null : (Number(v) as any))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحلقة..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون حلقة</SelectItem>
                {circles.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {`${c.name} - ${c.track_name || getCircleTrackName(c.track)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCircle && (
              <div
                className="mt-2 rounded-xl border px-3 py-2"
                style={{
                  background: "rgba(0,61,53,0.03)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    المسار التعليمي:
                  </span>
                  <Badge
                    style={{
                      background: getCircleTrackColor(selectedCircle.track).background,
                      borderColor: getCircleTrackColor(selectedCircle.track).border,
                      color: getCircleTrackColor(selectedCircle.track).text,
                    }}
                  >
                    {selectedCircle.track_name || getCircleTrackName(selectedCircle.track)}
                  </Badge>
                </div>
                {!!selectedCircle.track_description && (
                  <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    {selectedCircle.track_description || getCircleTrackDescription(selectedCircle.track)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              تاريخ الاختبار <span className="text-red-500">*</span>
            </label>
            <input
              dir="rtl"
              type="date"
              value={form.exam_date}
              onChange={(e) => set("exam_date", e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-[var(--brand)]"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              ملاحظات (اختياري)
            </label>
            <textarea
              dir="rtl"
              rows={3}
              placeholder="أي ملاحظات إضافية..."
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:border-[var(--brand)]"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
