import { useCallback, useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  CalendarDays,
  Clock3,
  Pencil,
  Search,
  Users,
  UserCheck,
  UserMinus,
  Timer,
  Save,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { listCircles, listCircleStudents, type Circle } from "@/services/circles"
import {
  createAttendance,
  type AttendanceStatus,
} from "@/services/attendances"
import {
  getCircleTrackColor,
  getCircleTrackName,
  getCircleTrackDescription,
} from "@/lib/circleTracks"

type StudentAttendance = {
  student_id: number
  student_name: string
  status: AttendanceStatus
  notes?: string | null
}

function getInitials(name: string): string {
  return (name || "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

function getAvatarGradient(seed: string): string {
  const gradients = [
    "from-emerald-500 to-emerald-600",
    "from-indigo-500 to-indigo-600",
    "from-cyan-500 to-cyan-600",
    "from-violet-500 to-violet-600",
    "from-amber-500 to-amber-600",
  ]
  const index = (seed?.charCodeAt(0) ?? 0) % gradients.length
  return gradients[index]
}

export default function AttendanceSheet() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState<Array<{ id: number; name: string }>>([])
  const [attendance, setAttendance] = useState<Map<number, StudentAttendance>>(new Map())
  const [search, setSearch] = useState("")
  const [noteEditorId, setNoteEditorId] = useState<number | null>(null)
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle")
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [bulkPulse, setBulkPulse] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load circles
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await listCircles({ per_page: 200 })
        setCircles(res.data)
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "تعذر تحميل الحلقات")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Load students when circle changes
  useEffect(() => {
    const t = window.setInterval(() => {
      setSessionSeconds((s) => s + 1)
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  const getDraftKey = useCallback(
    (circleId: number, date: string) => `attendance-draft:${circleId}:${date}`,
    []
  )

  useEffect(() => {
    ;(async () => {
      if (!selectedCircle) return
      try {
        setLoading(true)
        const studentList = await listCircleStudents(selectedCircle.id)
        setStudents(studentList)
        // Initialize attendance map and restore draft if available.
        const map = new Map<number, StudentAttendance>()
        studentList.forEach((s) => {
          map.set(s.id, {
            student_id: s.id,
            student_name: s.name || `#${s.id}`,
            status: "present",
            notes: null,
          })
        })

        try {
          const raw = localStorage.getItem(getDraftKey(selectedCircle.id, selectedDate))
          if (raw) {
            const draft = JSON.parse(raw) as Array<{
              student_id: number
              status: AttendanceStatus
              notes?: string | null
            }>
            draft.forEach((d) => {
              const current = map.get(d.student_id)
              if (!current) return
              map.set(d.student_id, {
                ...current,
                status: d.status,
                notes: d.notes ?? null,
              })
            })
          }
        } catch {
          // ignore corrupted drafts
        }

        setAttendance(map)
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "تعذر تحميل الطلاب")
        setStudents([])
        setAttendance(new Map())
      } finally {
        setLoading(false)
      }
    })()
  }, [getDraftKey, selectedCircle, selectedDate])

  useEffect(() => {
    if (!selectedCircle || attendance.size === 0) return
    setAutosaveState("saving")

    const t = window.setTimeout(() => {
      try {
        const records = Array.from(attendance.values()).map((x) => ({
          student_id: x.student_id,
          status: x.status,
          notes: x.notes ?? null,
        }))
        localStorage.setItem(getDraftKey(selectedCircle.id, selectedDate), JSON.stringify(records))
      } finally {
        setAutosaveState("saved")
        window.setTimeout(() => setAutosaveState("idle"), 1000)
      }
    }, 450)

    return () => window.clearTimeout(t)
  }, [attendance, getDraftKey, selectedCircle, selectedDate])

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendance((prev) => {
      const next = new Map(prev)
      const current = next.get(studentId)
      if (current) {
        next.set(studentId, { ...current, status })
      }
      return next
    })
  }

  const handleNoteChange = (studentId: number, notes: string) => {
    setAttendance((prev) => {
      const next = new Map(prev)
      const current = next.get(studentId)
      if (current) {
        next.set(studentId, { ...current, notes })
      }
      return next
    })
  }

  const markAllPresent = () => {
    if (!students.length) return
    setBulkPulse(true)
    window.setTimeout(() => setBulkPulse(false), 900)
    if (!window.confirm("تأكيد تعيين جميع الطلاب كحاضر؟")) return

    setAttendance((prev) => {
      const next = new Map(prev)
      students.forEach((s) => {
        const current = next.get(s.id)
        if (current) next.set(s.id, { ...current, status: "present" })
      })
      return next
    })
  }

  const handleSave = async () => {
    if (!selectedCircle) return toast.error("اختر الحلقة أولاً")
    if (attendance.size === 0) return toast.error("لا توجد طلاب في الحلقة")

    setSaving(true)
    try {
      const records = Array.from(attendance.values())
      const promises = records.map((att) =>
        createAttendance({
          student_id: att.student_id,
          circle_id: selectedCircle.id,
          date: selectedDate,
          status: att.status,
          notes: att.notes || null,
        })
      )
      await Promise.all(promises)
      toast.success(`تم حفظ كشف الحضور ل ${records.length} طالب`)
      try {
        localStorage.removeItem(getDraftKey(selectedCircle.id, selectedDate))
      } catch {
        // ignore
      }

      const resetMap = new Map<number, StudentAttendance>()
      students.forEach((s) => {
        resetMap.set(s.id, {
          student_id: s.id,
          student_name: s.name || `#${s.id}`,
          status: "present",
          notes: null,
        })
      })
      setAttendance(resetMap)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل حفظ الكشف")
    } finally {
      setSaving(false)
    }
  }

  const trackColor = useMemo(
    () => (selectedCircle ? getCircleTrackColor(selectedCircle.track) : null),
    [selectedCircle]
  )

  const presentCount = useMemo(() => {
    let count = 0
    attendance.forEach((att) => {
      if (att.status === "present") count++
    })
    return count
  }, [attendance])

  const absentCount = useMemo(() => {
    let count = 0
    attendance.forEach((att) => {
      if (att.status === "absent") count++
    })
    return count
  }, [attendance])

  const lateCount = useMemo(() => {
    let count = 0
    attendance.forEach((att) => {
      if (att.status === "late" || att.status === "excused") count++
    })
    return count
  }, [attendance])

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => s.name.toLowerCase().includes(q))
  }, [search, students])

  const sessionTimeLabel = useMemo(() => {
    const m = Math.floor(sessionSeconds / 60)
    const s = sessionSeconds % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }, [sessionSeconds])

  const statusButtonClass = (active: boolean, tone: "emerald" | "rose" | "amber") => {
    if (!active) {
      return "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
    }
    if (tone === "emerald") {
      return "border border-emerald-300 bg-emerald-100 text-emerald-700 shadow-[0_0_0_2px_rgba(16,185,129,0.14)]"
    }
    if (tone === "rose") {
      return "border border-rose-300 bg-rose-100 text-rose-700 shadow-[0_0_0_2px_rgba(244,63,94,0.14)]"
    }
    return "border border-amber-300 bg-amber-100 text-amber-700 shadow-[0_0_0_2px_rgba(245,158,11,0.14)]"
  }

  const cardToneClass = (status: AttendanceStatus) => {
    if (status === "present") {
      return "border-emerald-200 bg-emerald-50/60 shadow-[0_10px_30px_rgba(16,185,129,0.13)]"
    }
    if (status === "absent") {
      return "border-rose-200 bg-rose-50/60 shadow-[0_10px_30px_rgba(244,63,94,0.13)]"
    }
    return "border-amber-200 bg-amber-50/60 shadow-[0_10px_30px_rgba(245,158,11,0.13)]"
  }

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6 p-4 sm:p-6">
        <Header title="سجل الحضور اليومي" subtitle="تجربة تسجيل ذكية وسريعة للحضور والغياب" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/75 backdrop-blur-xl p-5 shadow-[0_20px_40px_rgba(16,185,129,0.14)]">
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
              <UserCheck size={16} /> حاضر الآن
            </div>
            <div className="text-4xl font-black text-emerald-700 mt-2">{presentCount}</div>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50/75 backdrop-blur-xl p-5 shadow-[0_20px_40px_rgba(244,63,94,0.14)]">
            <div className="flex items-center gap-2 text-rose-700 text-sm font-semibold">
              <UserMinus size={16} /> غائب
            </div>
            <div className="text-4xl font-black text-rose-700 mt-2">{absentCount}</div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 backdrop-blur-xl p-5 shadow-[0_20px_40px_rgba(245,158,11,0.14)]">
            <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold">
              <Timer size={16} /> متأخر / معذور
            </div>
            <div className="text-4xl font-black text-amber-700 mt-2">{lateCount}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className="block text-xs font-semibold mb-2 text-slate-600">الحلقة</label>
              <Select
                value={selectedCircle?.id.toString() || ""}
                onValueChange={(val) => {
                  const circle = circles.find((c) => c.id === Number(val))
                  setSelectedCircle(circle || null)
                }}
              >
                <SelectTrigger className="rounded-2xl border-slate-200 bg-white/90">
                  <SelectValue placeholder="اختر الحلقة..." />
                </SelectTrigger>
                <SelectContent>
                  {circles.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCircle && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    style={{
                      background: trackColor?.background,
                      borderColor: trackColor?.border,
                      color: trackColor?.text,
                    }}
                  >
                    {getCircleTrackName(selectedCircle.track)}
                  </Badge>
                  <span className="text-xs text-slate-500">{getCircleTrackDescription(selectedCircle.track)}</span>
                </div>
              )}
            </div>

            <div className="rounded-full border border-white/20 bg-white/40 backdrop-blur-xl px-4 py-2.5 flex items-center gap-3 shadow-[0_10px_30px_rgba(99,102,241,0.14)]">
              <CalendarDays size={16} className="text-indigo-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm text-slate-700 focus:outline-none"
              />
              <span className="h-4 w-px bg-slate-200" />
              <Clock3 size={16} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">{sessionTimeLabel}</span>
            </div>

            <Button
              onClick={handleSave}
              disabled={!selectedCircle || loading || saving || attendance.size === 0}
              className="rounded-2xl"
            >
              {saving ? "جاري الحفظ..." : "حفظ كشف الحضور"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن طالب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <button
              onClick={markAllPresent}
              disabled={!selectedCircle || !students.length || loading}
              className={`rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-all ${
                bulkPulse ? "animate-pulse" : ""
              } ${
                !selectedCircle || !students.length || loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-[0_10px_30px_rgba(16,185,129,0.25)] animate-pulse"
              }`}
            >
              تحديد الكل كـ حاضر
            </button>
          </div>
        </div>

        {!selectedCircle ? (
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl px-6 py-16 text-center text-slate-500">
            اختر الحلقة لعرض طلاب اليوم.
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl px-6 py-16 text-center text-slate-500">
            جاري التحميل...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl px-6 py-16 text-center text-slate-500">
            لا يوجد طلاب مطابقون للبحث.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredStudents.map((student, idx) => {
              const att = attendance.get(student.id)
              const status = att?.status === "excused" ? "late" : att?.status || "present"

              return (
                <div
                  key={student.id}
                  className={`rounded-3xl border p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 ${cardToneClass(
                    status
                  )}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
                          student.name
                        )} text-white text-xs font-black flex items-center justify-center shadow-md`}
                      >
                        {getInitials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-400">#{idx + 1} • ID: {student.id}</div>
                        <h3 className="text-base font-bold text-slate-800 truncate">{student.name}</h3>
                      </div>

                      {att?.notes ? (
                        <p className="text-xs text-slate-500 truncate mt-0.5">ملاحظة: {att.notes}</p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">لا توجد ملاحظات</p>
                      )}
                    </div>

                    <button
                      onClick={() => setNoteEditorId((prev) => (prev === student.id ? null : student.id))}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition"
                      title="إضافة ملاحظة"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleStatusChange(student.id, "present")}
                      className={`rounded-2xl px-3 py-2.5 text-sm font-bold transition ${statusButtonClass(
                        status === "present",
                        "emerald"
                      )}`}
                    >
                      حاضر
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, "absent")}
                      className={`rounded-2xl px-3 py-2.5 text-sm font-bold transition ${statusButtonClass(
                        status === "absent",
                        "rose"
                      )}`}
                    >
                      غائب
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, "late")}
                      className={`rounded-2xl px-3 py-2.5 text-sm font-bold transition ${statusButtonClass(
                        status === "late",
                        "amber"
                      )}`}
                    >
                      متأخر
                    </button>
                  </div>

                  {noteEditorId === student.id && (
                    <div className="mt-3">
                      <label className="text-xs text-slate-500">سبب/ملاحظة</label>
                      <textarea
                        value={att?.notes || ""}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        placeholder="مثال: عذر طبي"
                        rows={2}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {autosaveState !== "idle" && (
          <div className="fixed bottom-5 left-5 z-40 rounded-full border border-slate-200 bg-white/90 backdrop-blur-md px-3 py-2 text-xs text-slate-600 shadow-lg flex items-center gap-2">
            <Save size={13} className={autosaveState === "saving" ? "animate-pulse" : ""} />
            {autosaveState === "saving" ? "Saving..." : "All Changes Saved"}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Users size={14} />
          {selectedCircle ? `${filteredStudents.length} طالب ظاهر من أصل ${students.length}` : "لا يوجد طلاب بعد"}
        </div>
      </div>
    </AppLayout>
  )
}
