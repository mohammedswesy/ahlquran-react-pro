import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import LoadingBar from "@/components/ui/loading-bar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { listMyCircles, listCircleStudents, type TeacherCircle } from "@/services/circles"
import {
  listStudentProgressHistory,
  submitBulkProgress,
  type ProgressGrade,
  type ProgressHistoryItem,
  type ProgressType,
} from "@/services/progress"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import {
  Check,
  ChevronDown,
  Loader2,
  Search,
  Trophy,
} from "lucide-react"

const SURAH_OPTIONS = [
  { value: 1, label: "الفاتحة" },
  { value: 2, label: "البقرة" },
  { value: 3, label: "آل عمران" },
  { value: 4, label: "النساء" },
  { value: 5, label: "المائدة" },
  { value: 6, label: "الأنعام" },
  { value: 7, label: "الأعراف" },
  { value: 8, label: "الأنفال" },
  { value: 9, label: "التوبة" },
  { value: 10, label: "يونس" },
  { value: 11, label: "هود" },
  { value: 12, label: "يوسف" },
  { value: 13, label: "الرعد" },
  { value: 14, label: "إبراهيم" },
  { value: 15, label: "الحجر" },
  { value: 16, label: "النحل" },
  { value: 17, label: "الإسراء" },
  { value: 18, label: "الكهف" },
  { value: 19, label: "مريم" },
  { value: 20, label: "طه" },
  { value: 21, label: "الأنبياء" },
  { value: 22, label: "الحج" },
  { value: 23, label: "المؤمنون" },
  { value: 24, label: "النور" },
  { value: 25, label: "الفرقان" },
  { value: 26, label: "الشعراء" },
  { value: 27, label: "النمل" },
  { value: 28, label: "القصص" },
  { value: 29, label: "العنكبوت" },
  { value: 30, label: "الروم" },
  { value: 31, label: "لقمان" },
  { value: 32, label: "السجدة" },
  { value: 33, label: "الأحزاب" },
  { value: 34, label: "سبأ" },
  { value: 35, label: "فاطر" },
  { value: 36, label: "يس" },
  { value: 37, label: "الصافات" },
  { value: 38, label: "ص" },
  { value: 39, label: "الزمر" },
  { value: 40, label: "غافر" },
  { value: 41, label: "فصلت" },
  { value: 42, label: "الشورى" },
  { value: 43, label: "الزخرف" },
  { value: 44, label: "الدخان" },
  { value: 45, label: "الجاثية" },
  { value: 46, label: "الأحقاف" },
  { value: 47, label: "محمد" },
  { value: 48, label: "الفتح" },
  { value: 49, label: "الحجرات" },
  { value: 50, label: "ق" },
  { value: 51, label: "الذاريات" },
  { value: 52, label: "الطور" },
  { value: 53, label: "النجم" },
  { value: 54, label: "القمر" },
  { value: 55, label: "الرحمن" },
  { value: 56, label: "الواقعة" },
  { value: 57, label: "الحديد" },
  { value: 58, label: "المجادلة" },
  { value: 59, label: "الحشر" },
  { value: 60, label: "الممتحنة" },
  { value: 61, label: "الصف" },
  { value: 62, label: "الجمعة" },
  { value: 63, label: "المنافقون" },
  { value: 64, label: "التغابن" },
  { value: 65, label: "الطلاق" },
  { value: 66, label: "التحريم" },
  { value: 67, label: "الملك" },
  { value: 68, label: "القلم" },
  { value: 69, label: "الحاقة" },
  { value: 70, label: "المعارج" },
  { value: 71, label: "نوح" },
  { value: 72, label: "الجن" },
  { value: 73, label: "المزمل" },
  { value: 74, label: "المدثر" },
  { value: 75, label: "القيامة" },
  { value: 76, label: "الإنسان" },
  { value: 77, label: "المرسلات" },
  { value: 78, label: "النبأ" },
  { value: 79, label: "النازعات" },
  { value: 80, label: "عبس" },
  { value: 81, label: "التكوير" },
  { value: 82, label: "الانفطار" },
  { value: 83, label: "المطففين" },
  { value: 84, label: "الانشقاق" },
  { value: 85, label: "البروج" },
  { value: 86, label: "الطارق" },
  { value: 87, label: "الأعلى" },
  { value: 88, label: "الغاشية" },
  { value: 89, label: "الفجر" },
  { value: 90, label: "البلد" },
  { value: 91, label: "الشمس" },
  { value: 92, label: "الليل" },
  { value: 93, label: "الضحى" },
  { value: 94, label: "الشرح" },
  { value: 95, label: "التين" },
  { value: 96, label: "العلق" },
  { value: 97, label: "القدر" },
  { value: 98, label: "البينة" },
  { value: 99, label: "الزلزلة" },
  { value: 100, label: "العاديات" },
  { value: 101, label: "القارعة" },
  { value: 102, label: "التكاثر" },
  { value: 103, label: "العصر" },
  { value: 104, label: "الهمزة" },
  { value: 105, label: "الفيل" },
  { value: 106, label: "قريش" },
  { value: 107, label: "الماعون" },
  { value: 108, label: "الكوثر" },
  { value: 109, label: "الكافرون" },
  { value: 110, label: "النصر" },
  { value: 111, label: "المسد" },
  { value: 112, label: "الإخلاص" },
  { value: 113, label: "الفلق" },
  { value: 114, label: "الناس" },
]

const GRADE_OPTIONS: Array<{ value: ProgressGrade; label: string; cls: string }> = [
  { value: "excellent", label: "ممتاز", cls: "bg-emerald-600 border-emerald-600 text-white" },
  { value: "very_good", label: "جيد جداً", cls: "bg-blue-600 border-blue-600 text-white" },
  { value: "good", label: "جيد", cls: "bg-amber-500 border-amber-500 text-white" },
  { value: "weak", label: "ضعيف", cls: "bg-rose-600 border-rose-600 text-white" },
]

type Row = {
  student_id: number
  student_name: string
  surah: number | null
  from_ayah: string
  to_ayah: string
  grade: ProgressGrade | null
}

function todayISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function SurahCombobox({
  value,
  onChange,
  disabled,
}: {
  value: number | null
  onChange: (next: number) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = SURAH_OPTIONS.find((s) => s.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-9 w-full justify-between text-xs sm:text-sm" disabled={disabled}>
          <span className="truncate">{selected ? `${selected.value} - ${selected.label}` : "اختر السورة"}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="ابحث عن السورة..." />
          <CommandEmpty>لا توجد سورة مطابقة</CommandEmpty>
          <CommandGroup>
            {SURAH_OPTIONS.map((surah) => (
              <CommandItem
                key={surah.value}
                value={`${surah.value} ${surah.label}`}
                onSelect={() => {
                  onChange(surah.value)
                  setOpen(false)
                }}
              >
                <Check className={cn("ml-2 h-4 w-4", value === surah.value ? "opacity-100" : "opacity-0")} />
                {surah.value} - {surah.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function Memorization() {
  const [params, setParams] = useSearchParams()
  const initialCircle = Number(params.get("circle_id") || 0)

  const [circles, setCircles] = useState<TeacherCircle[]>([])
  const [circleId, setCircleId] = useState<number | undefined>(initialCircle || undefined)
  const [type, setType] = useState<ProgressType>("memorization")
  const [date, setDate] = useState<string>(() => todayISO())

  const [rows, setRows] = useState<Row[]>([])
  const [loadingCircles, setLoadingCircles] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyStudentName, setHistoryStudentName] = useState("")
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyRows, setHistoryRows] = useState<ProgressHistoryItem[]>([])

  useEffect(() => {
    ;(async () => {
      setLoadingCircles(true)
      try {
        const list = await listMyCircles()
        setCircles(list)
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "تعذر تحميل حلقات المعلم")
      } finally {
        setLoadingCircles(false)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!circleId) {
        setRows([])
        return
      }

      setLoadingStudents(true)
      try {
        const students = await listCircleStudents(circleId)
        setRows(
          students.map((s) => ({
            student_id: Number(s.id),
            student_name: s.name,
            surah: null,
            from_ayah: "",
            to_ayah: "",
            grade: null,
          })),
        )

        const p = new URLSearchParams(params)
        p.set("circle_id", String(circleId))
        setParams(p, { replace: true })
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "تعذر تحميل طلاب الحلقة")
        setRows([])
      } finally {
        setLoadingStudents(false)
      }
    })()
  }, [circleId, params, setParams])

  const setRow = (studentId: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.student_id === studentId ? { ...r, ...patch } : r)))
  }

  const markSurahForAll = () => {
    const first = rows.find((r) => r.surah)
    if (!first?.surah) {
      toast.info("اختر السورة لطالب واحد أولاً")
      return
    }
    setRows((prev) => prev.map((r) => ({ ...r, surah: first.surah })))
    toast.success("تم نسخ السورة لكل الطلاب")
  }

  const invalidRowsCount = useMemo(
    () => rows.filter((r) => Number(r.from_ayah || 0) > Number(r.to_ayah || 0)).length,
    [rows],
  )

  const preparedRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.surah &&
          r.grade &&
          Number(r.from_ayah) > 0 &&
          Number(r.to_ayah) > 0 &&
          Number(r.from_ayah) <= Number(r.to_ayah),
      ),
    [rows],
  )

  const openHistory = async (studentId: number, studentName: string) => {
    setHistoryStudentName(studentName)
    setHistoryOpen(true)
    setHistoryLoading(true)
    try {
      const data = await listStudentProgressHistory(studentId, type)
      setHistoryRows(data)
    } catch {
      setHistoryRows([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const onSubmit = async () => {
    if (!circleId) {
      toast.warning("اختر الحلقة أولاً")
      return
    }
    if (preparedRows.length === 0) {
      toast.warning("أدخل بيانات صحيحة لطالب واحد على الأقل")
      return
    }
    if (invalidRowsCount > 0) {
      toast.warning("يوجد طلاب لديهم مدى آيات غير صحيح")
      return
    }

    setSubmitting(true)
    try {
      await submitBulkProgress({
        circle_id: circleId,
        date,
        items: preparedRows.map((r) => ({
          student_id: r.student_id,
          surah: Number(r.surah),
          from_ayah: Number(r.from_ayah),
          to_ayah: Number(r.to_ayah),
          grade: r.grade as ProgressGrade,
          type,
        })),
      })
      toast.success("تم حفظ إنجاز التسميع بنجاح")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل حفظ التسميع")
    } finally {
      setSubmitting(false)
    }
  }

  const circleName = circles.find((c) => c.id === circleId)?.name || "اختر الحلقة"

  return (
    <AppLayout>
      <Header title="واجهة التسميع" subtitle="تسجيل جماعي سريع للإنجاز اليومي" />

      <div className="space-y-4 p-4 pb-28" dir="rtl">
        <LoadingBar active={loadingCircles || loadingStudents || submitting} />

        <Card>
          <CardHeader>
            <CardTitle>إعداد الجلسة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-[var(--muted)]">الحلقة</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-11 w-full justify-between" disabled={loadingCircles}>
                      <span className="truncate">{circleName}</span>
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ابحث عن الحلقة..." />
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <CommandGroup>
                        {circles.map((c) => (
                          <CommandItem key={c.id} value={c.name} onSelect={() => setCircleId(c.id)}>
                            <Check className={cn("ml-2 h-4 w-4", c.id === circleId ? "opacity-100" : "opacity-0")} />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--muted)]">النوع</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("h-11", type === "memorization" && "border-emerald-600 bg-emerald-50 text-emerald-700")}
                    onClick={() => setType("memorization")}
                  >
                    حفظ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("h-11", type === "revision" && "border-amber-500 bg-amber-50 text-amber-700")}
                    onClick={() => setType("revision")}
                  >
                    مراجعة
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-[var(--muted)]">تاريخ الجلسة</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={markSurahForAll} disabled={!rows.length || loadingStudents}>
                نسخ السورة للكل
              </Button>
              <div className="text-xs text-[var(--muted)] self-center">
                جاهز للإرسال: {preparedRows.length} / {rows.length}
                {invalidRowsCount > 0 ? ` • أخطاء مدى: ${invalidRowsCount}` : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        {loadingStudents ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-24 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-[var(--muted)]">
              اختر الحلقة لعرض الطلاب وبدء إدخال التسميع
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--surface2)]">
                  <tr className="text-right">
                    <th className="px-3 py-2">الطالب</th>
                    <th className="px-3 py-2">السورة</th>
                    <th className="px-3 py-2">من آية</th>
                    <th className="px-3 py-2">إلى آية</th>
                    <th className="px-3 py-2">التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const invalidRange = Number(row.from_ayah || 0) > Number(row.to_ayah || 0)
                    return (
                      <tr key={row.student_id} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="font-semibold text-emerald-700 hover:underline"
                            onClick={() => openHistory(row.student_id, row.student_name)}
                          >
                            {row.student_name}
                          </button>
                        </td>
                        <td className="px-3 py-2 min-w-[220px]"><SurahCombobox value={row.surah} onChange={(v) => setRow(row.student_id, { surah: v })} /></td>
                        <td className="px-3 py-2 w-[120px]"><Input type="number" min={1} value={row.from_ayah} onChange={(e) => setRow(row.student_id, { from_ayah: e.target.value })} className={cn("h-9", invalidRange && "border-rose-500")} /></td>
                        <td className="px-3 py-2 w-[120px]"><Input type="number" min={1} value={row.to_ayah} onChange={(e) => setRow(row.student_id, { to_ayah: e.target.value })} className={cn("h-9", invalidRange && "border-rose-500")} /></td>
                        <td className="px-3 py-2">
                          <div className="grid grid-cols-2 gap-1">
                            {GRADE_OPTIONS.map((g) => (
                              <Button
                                key={g.value}
                                type="button"
                                variant="outline"
                                className={cn("h-8 text-xs", row.grade === g.value ? g.cls : "")}
                                onClick={() => setRow(row.student_id, { grade: g.value })}
                              >
                                {g.label}
                              </Button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {rows.map((row) => {
                const invalidRange = Number(row.from_ayah || 0) > Number(row.to_ayah || 0)

                return (
                  <Card key={row.student_id} className={cn("rounded-2xl border", invalidRange && "border-rose-400")}>
                    <CardContent className="space-y-3 p-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className="font-semibold text-emerald-700 hover:underline"
                          onClick={() => openHistory(row.student_id, row.student_name)}
                        >
                          {row.student_name}
                        </button>
                        <Search className="h-4 w-4 text-[var(--muted)]" />
                      </div>

                      <SurahCombobox value={row.surah} onChange={(v) => setRow(row.student_id, { surah: v })} />

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          min={1}
                          placeholder="من آية"
                          value={row.from_ayah}
                          onChange={(e) => setRow(row.student_id, { from_ayah: e.target.value })}
                          className={cn(invalidRange && "border-rose-500")}
                        />
                        <Input
                          type="number"
                          min={1}
                          placeholder="إلى آية"
                          value={row.to_ayah}
                          onChange={(e) => setRow(row.student_id, { to_ayah: e.target.value })}
                          className={cn(invalidRange && "border-rose-500")}
                        />
                      </div>

                      {invalidRange && <div className="text-xs text-rose-600">من آية يجب أن تكون أقل أو تساوي إلى آية</div>}

                      <div className="grid grid-cols-2 gap-2">
                        {GRADE_OPTIONS.map((g) => (
                          <Button
                            key={g.value}
                            type="button"
                            variant="outline"
                            className={cn("h-9 text-xs", row.grade === g.value ? g.cls : "")}
                            onClick={() => setRow(row.student_id, { grade: g.value })}
                          >
                            {g.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}

        <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-white/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <Button className="h-12 w-full text-base font-bold lg:w-auto lg:px-8" onClick={onSubmit} disabled={submitting || !circleId || preparedRows.length === 0}>
            {submitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Trophy className="ml-2 h-4 w-4" />}
            {submitting ? "يتم الإرسال..." : "إرسال الكل"}
          </Button>
        </div>
      </div>

      {historyOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/35" onClick={() => setHistoryOpen(false)} />
          <aside
            dir="rtl"
            className="fixed inset-y-0 right-0 z-50 w-[94vw] max-w-md border-l border-[var(--border)] bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div>
                  <div className="font-bold">سجل الطالب: {historyStudentName}</div>
                  <div className="text-xs text-[var(--muted)]">آخر إنجازات الطالب</div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setHistoryOpen(false)}>
                  إغلاق
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {historyLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((n) => (
                      <Skeleton key={n} className="h-14 w-full" />
                    ))}
                  </div>
                ) : historyRows.length === 0 ? (
                  <div className="py-6 text-center text-sm text-[var(--muted)]">لا يوجد سجل سابق للعرض</div>
                ) : (
                  <div className="space-y-2">
                    {historyRows.map((item) => {
                      const surahName = SURAH_OPTIONS.find((s) => s.value === item.surah)?.label || `سورة #${item.surah}`
                      return (
                        <div key={`${item.id}-${item.date}`} className="rounded-xl border border-[var(--border)] p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{surahName}</div>
                            <div className="text-xs text-[var(--muted)]">{item.date?.slice(0, 10)}</div>
                          </div>
                          <div className="mt-1 text-sm text-[var(--muted)]">
                            من آية {item.from_ayah} إلى آية {item.to_ayah}
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="rounded-full bg-slate-100 px-2 py-1">{item.type === "revision" ? "مراجعة" : "حفظ"}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-1">{item.grade || "-"}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </AppLayout>
  )
}
