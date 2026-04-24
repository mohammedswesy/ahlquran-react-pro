import { useEffect, useMemo, useState } from "react"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Clock3,
  Loader2,
  Save,
  UserRound,
  UserX,
  Users,
} from "lucide-react"

import { listMyCircles, listCircleStudents, type TeacherCircle } from "@/services/circles"
import {
  listAttendanceByCircleAndDate,
  submitBulkAttendance,
  type AttendanceStatus,
} from "@/services/attendances"
import { createTeacherDailyRecord } from "@/services/teacherDailyRecord"

const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس",
]

const SURAH_OPTIONS = SURAH_NAMES.map((name, index) => ({
  value: String(index + 1),
  label: `${index + 1} - ${name}`,
}))

type StudentRow = {
  id: number
  name: string
  status: AttendanceStatus
}

type AchievementForm = {
  surah: string
  page_from: string
  page_to: string
  grade: string
  tajweed_lesson: string
  arabic_lesson: string
}

const DEFAULT_FORM: AchievementForm = {
  surah: "",
  page_from: "",
  page_to: "",
  grade: "",
  tajweed_lesson: "",
  arabic_lesson: "",
}

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; short: string; label: string; className: string; icon: React.ElementType }> = [
  {
    value: "present",
    short: "P",
    label: "حاضر",
    className: "bg-emerald-600 border-emerald-600 text-white",
    icon: UserRound,
  },
  {
    value: "absent",
    short: "A",
    label: "غائب",
    className: "bg-rose-600 border-rose-600 text-white",
    icon: UserX,
  },
  {
    value: "late",
    short: "L",
    label: "متأخر",
    className: "bg-amber-500 border-amber-500 text-white",
    icon: Clock3,
  },
]

function todayISO() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function StudentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-emerald-100 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CircleManagement() {
  const [circles, setCircles] = useState<TeacherCircle[]>([])
  const [circleId, setCircleId] = useState<number | undefined>(undefined)
  const [date, setDate] = useState(todayISO())
  const [students, setStudents] = useState<StudentRow[]>([])

  const [loadingCircles, setLoadingCircles] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)

  const [bulkMode, setBulkMode] = useState(true)
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>("present")

  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<AchievementForm>(DEFAULT_FORM)
  const [savingRecord, setSavingRecord] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoadingCircles(true)
      try {
        const data = await listMyCircles()
        setCircles(data)
        if (data[0]?.id) setCircleId(Number(data[0].id))
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "تعذر تحميل الحلقات")
      } finally {
        setLoadingCircles(false)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!circleId) {
        setStudents([])
        return
      }
      setLoadingStudents(true)
      try {
        const [studentRows, attendanceRows] = await Promise.all([
          listCircleStudents(circleId),
          listAttendanceByCircleAndDate({ circle_id: circleId, date }),
        ])

        const statusMap = new Map<number, AttendanceStatus>()
        attendanceRows.forEach((row) => {
          statusMap.set(Number(row.student_id), row.status || "present")
        })

        setStudents(
          studentRows.map((student) => ({
            id: Number(student.id),
            name: student.name,
            status: statusMap.get(Number(student.id)) || "present",
          })),
        )
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "تعذر تحميل طلاب الحلقة")
        setStudents([])
      } finally {
        setLoadingStudents(false)
      }
    })()
  }, [circleId, date])

  const stats = useMemo(() => {
    const total = students.length
    const present = students.filter((student) => student.status === "present").length
    const absent = students.filter((student) => student.status === "absent").length
    const late = students.filter((student) => student.status === "late").length
    return { total, present, absent, late }
  }, [students])

  const setStudentStatus = (studentId: number, status: AttendanceStatus) => {
    setStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, status } : student)))
  }

  const applyBulkStatus = () => {
    if (!students.length) return
    setStudents((prev) => prev.map((student) => ({ ...student, status: bulkStatus })))
  }

  const saveAttendance = async () => {
    if (!circleId || !students.length) {
      toast.warning("اختر الحلقة وتأكد من وجود طلاب")
      return
    }

    setSavingAttendance(true)
    try {
      await submitBulkAttendance({
        circle_id: circleId,
        date,
        records: students.map((student) => ({
          student_id: student.id,
          status: student.status,
        })),
      })
      toast.success("تم حفظ حضور الطلاب بنجاح")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل حفظ الحضور")
    } finally {
      setSavingAttendance(false)
    }
  }

  const openAchievementModal = (student: StudentRow) => {
    setSelectedStudent(student)
    setForm(DEFAULT_FORM)
    setModalOpen(true)
  }

  const saveAchievement = async () => {
    if (!circleId || !selectedStudent) return

    const pageFrom = Number(form.page_from)
    const pageTo = Number(form.page_to)

    if (!form.surah || !form.grade || !form.tajweed_lesson.trim() || !form.arabic_lesson.trim()) {
      toast.warning("يرجى إكمال بيانات الإنجاز")
      return
    }

    if (!Number.isFinite(pageFrom) || !Number.isFinite(pageTo) || pageFrom <= 0 || pageTo <= 0 || pageFrom > pageTo) {
      toast.warning("يرجى إدخال مدى صفحات صحيح")
      return
    }

    setSavingRecord(true)
    try {
      await createTeacherDailyRecord({
        date,
        circle_id: circleId,
        student_id: selectedStudent.id,
        attendance_status: selectedStudent.status,
        surah: form.surah,
        page_from: pageFrom,
        page_to: pageTo,
        grade: form.grade,
        tajweed_lesson: form.tajweed_lesson.trim(),
        arabic_lesson: form.arabic_lesson.trim(),
      })
      toast.success("تم حفظ إنجاز الطالب بنجاح")
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل حفظ الإنجاز")
    } finally {
      setSavingRecord(false)
    }
  }

  return (
    <AppLayout>
      <Header title="إدارة الحلقة" subtitle="الحضور والإنجاز اليومي للطلاب" />

      <div dir="rtl" className="space-y-5 px-4 pb-28 sm:px-6">
        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "إجمالي الطلاب", value: stats.total },
                { label: "حاضر", value: stats.present },
                { label: "غائب", value: stats.absent },
                { label: "متأخر", value: stats.late },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-emerald-100 bg-white/90 p-3">
                  <div className="text-xs text-emerald-800/80">{item.label}</div>
                  <div className="mt-1 text-2xl font-black text-emerald-900">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-slate-600">الحلقة</label>
                <Select
                  value={circleId ? String(circleId) : undefined}
                  onValueChange={(value) => setCircleId(value ? Number(value) : undefined)}
                  disabled={loadingCircles}
                >
                  <SelectTrigger className="h-12 rounded-xl text-base">
                    <SelectValue placeholder={loadingCircles ? "جاري تحميل الحلقات..." : "اختر الحلقة"} />
                  </SelectTrigger>
                  <SelectContent>
                    {circles.map((circle) => (
                      <SelectItem key={circle.id} value={String(circle.id)}>
                        {circle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-600">التاريخ</label>
                <Input className="h-12 rounded-xl text-base" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkMode((prev) => !prev)}
                  className={cn(
                    "h-7 w-12 rounded-full border transition",
                    bulkMode ? "bg-emerald-600 border-emerald-600" : "bg-slate-200 border-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "block h-5 w-5 rounded-full bg-white transition-transform",
                      bulkMode ? "translate-x-[20px]" : "translate-x-[2px]",
                    )}
                  />
                </button>
                <div>
                  <div className="text-sm font-bold text-slate-800">Bulk Action Mode</div>
                  <div className="text-xs text-slate-500">تفعيل تغيير حالة الحضور لكل الطلاب بضغطة واحدة</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const active = bulkStatus === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!bulkMode}
                      onClick={() => setBulkStatus(option.value)}
                      className={cn(
                        "h-11 rounded-xl border px-4 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50",
                        active ? option.className : "border-slate-200 bg-white text-slate-700",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon className="h-4 w-4" />
                        {option.short} - {option.label}
                      </span>
                    </button>
                  )
                })}
                <Button
                  type="button"
                  className="h-11 rounded-xl bg-emerald-700 text-sm font-bold hover:bg-emerald-800"
                  disabled={!bulkMode || !students.length}
                  onClick={applyBulkStatus}
                >
                  تطبيق على الكل
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={saveAttendance}
                disabled={savingAttendance || loadingStudents || !students.length || !circleId}
                className="h-12 rounded-xl bg-emerald-700 px-6 text-base font-bold hover:bg-emerald-800"
              >
                {savingAttendance ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                حفظ حضور اليوم
              </Button>
            </div>
          </CardContent>
        </Card>

        {loadingStudents ? (
          <StudentsSkeleton />
        ) : !circleId ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">اختر الحلقة لعرض الطلاب</CardContent>
          </Card>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">لا يوجد طلاب في هذه الحلقة</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => openAchievementModal(student)}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-transparent px-2 py-2 text-right transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                      {student.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-black text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500">اضغط لإضافة إنجاز اليوم</div>
                    </div>
                  </button>

                  <div className="grid grid-cols-3 gap-2 sm:w-[360px]">
                    {STATUS_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const active = student.status === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStudentStatus(student.id, option.value)}
                          className={cn(
                            "h-11 rounded-xl border text-sm font-extrabold transition",
                            active ? option.className : "border-slate-200 bg-white text-slate-700",
                          )}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Icon className="h-4 w-4" />
                            {option.short}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        title={selectedStudent ? `إنجاز الطالب: ${selectedStudent.name}` : "إنجاز الطالب"}
        description="تسجيل الحفظ والموضوعات اليومية"
        footer={
          <>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-700 hover:bg-emerald-800"
              onClick={saveAchievement}
              disabled={savingRecord}
            >
              {savingRecord ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              حفظ
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">السورة</label>
              <Select value={form.surah} onValueChange={(value) => setForm((prev) => ({ ...prev, surah: value }))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="اختر السورة" />
                </SelectTrigger>
                <SelectContent>
                  {SURAH_OPTIONS.map((surah) => (
                    <SelectItem key={surah.value} value={surah.value}>
                      {surah.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">من صفحة</label>
              <Input
                type="number"
                min={1}
                value={form.page_from}
                onChange={(event) => setForm((prev) => ({ ...prev, page_from: event.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">إلى صفحة</label>
              <Input
                type="number"
                min={1}
                value={form.page_to}
                onChange={(event) => setForm((prev) => ({ ...prev, page_to: event.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">الدرجة</label>
              <Select value={form.grade} onValueChange={(value) => setForm((prev) => ({ ...prev, grade: value }))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="اختر الدرجة" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A", "B+", "B", "C", "D"].map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">درس التجويد</label>
              <Input
                value={form.tajweed_lesson}
                onChange={(event) => setForm((prev) => ({ ...prev, tajweed_lesson: event.target.value }))}
                placeholder="مثال: أحكام النون الساكنة"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">درس اللغة العربية</label>
              <Input
                value={form.arabic_lesson}
                onChange={(event) => setForm((prev) => ({ ...prev, arabic_lesson: event.target.value }))}
                placeholder="مثال: المفعول به"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
