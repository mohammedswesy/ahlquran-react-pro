// src/services/students.ts
import api from "./api"
import { normalizeId } from "@/lib/normalize"


export type StudentRow = {
  id: number
  name?: string | null
  [k: string]: any
}

export async function fetchStudents(params?: { search?: string; page?: number; per_page?: number }) {
  const { data } = await api.get("/students", { params })
  const src = data?.data ?? data
  const rows = Array.isArray(src) ? src.map((x: any) => normalizeId(x) as StudentRow) : []
  const meta = data?.meta ?? data?.pagination ?? {}
  return { data: rows, meta }
}

export async function activateStudent(id: number) {
  const { data } = await api.patch(`/students/${id}/activate`)
  return data
}

// تايب خفيف لاستخدامه في الحضور/القوائم الصغيرة
export type MiniStudent = {
  id: number
  name: string
}

export type Student = MiniStudent & {
  gender?: "male" | "female" | string | null
  birthdate?: string | null
  phone?: string | null
  institute_id?: number | null
  circle_id?: number | null
  status?: number | null
  // علاقات اختيارية قد ترجعها الـ API:
  institute?: { id: number; name: string }
  circle?: { id: number; name: string }
  [k: string]: any
}

export type ListParams = {
  page?: number
  per_page?: number
  search?: string
  institute_id?: number
  circle_id?: number
}
export type Paginated<T> = { data: T[]; meta?: any;[k: string]: any }

// -------- Helpers --------
function normalizeGender(g: any): "male" | "female" | undefined {
  if (g == null) return undefined
  const v = String(g).toLowerCase()
  if (["male", "m", "1", "ذكر"].includes(v)) return "male"
  if (["female", "f", "0", "أنثى"].includes(v)) return "female"
  return undefined
}

function normalizeStudent(raw: any): Student {
  const x = normalizeId(raw)
  return {
    ...x,
    name: String(x.name ?? "").trim(),
    gender: normalizeGender(x.gender),
  } as Student
}

function coerceNullish<T extends Record<string, any>>(o: T): T {
  const out: any = { ...o }
  for (const k in out) if (out[k] === "" || out[k] === undefined) out[k] = null
  return out
}

function hasBinaryValue(payload: Record<string, any>): boolean {
  return Object.values(payload).some((value) => value instanceof Blob)
}

function toFormData(payload: Record<string, any>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (value == null || value === "") continue
    if (value instanceof Blob) {
      formData.append(key, value)
      continue
    }
    formData.append(key, String(value))
  }
  return formData
}

// ===== الدوال العامة =====
export async function listStudents(
  params?: ListParams
): Promise<Student[] | Paginated<Student>> {
  const { data } = await api.get("/students", { params })
  if (Array.isArray(data)) return data.map(normalizeStudent)
  if (Array.isArray(data?.data)) return { ...data, data: data.data.map(normalizeStudent) }
  return data
}

export async function getStudent(id: number): Promise<Student> {
  const { data } = await api.get(`/students/${id}`)
  return normalizeStudent(data?.data ?? data)
}

export async function createStudent(payload: any): Promise<Student> {
  if (payload instanceof FormData) {
    const { data } = await api.post("/students", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return normalizeStudent(data?.data ?? data)
  }

  if (payload && typeof payload === "object" && hasBinaryValue(payload)) {
    const multipartPayload = toFormData(payload)
    const { data } = await api.post("/students", multipartPayload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return normalizeStudent(data?.data ?? data)
  }

  const { data } = await api.post("/students", coerceNullish(payload))
  return normalizeStudent(data?.data ?? data)
}

export async function updateStudent(id: number, payload: any): Promise<Student> {
  const { data } = await api.put(`/students/${id}`, coerceNullish(payload))
  return normalizeStudent(data?.data ?? data)
}

export async function transferStudentCircle(payload: {
  student_id: number
  from_circle_id: number
  to_circle_id: number
}) {
  try {
    const { data } = await api.post("/admin/students/transfer", payload)
    return data
  } catch {
    const { data } = await api.post("/students/transfer", payload)
    return data
  }
}

export async function deleteStudent(id: number) {
  const { data } = await api.delete(`/students/${id}`)
  return data
}

/** خيارات مختصرة [{id,name}] لاستخدامها في Select/Combobox */
export async function listStudentsOptions(params?: {
  search?: string
  institute_id?: number
  circle_id?: number
}): Promise<MiniStudent[]> {
  const { data } = await api.get("/students", { params: { per_page: 1000, ...(params || {}) } })
  const src = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
  return src.map((s: any) => {
    const x = normalizeId(s)
    return { id: Number(x.id), name: String(x?.name ?? "").trim() }
  })
}

/** ===== للدور Teacher: حضور الحلقة ===== */
export async function listStudentsByCircleForAttendance(
  circle_id: number
): Promise<MiniStudent[]> {
  try {
    const { data } = await api.get("/students", { params: { circle_id, per_page: 1000 } })
    const src = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return src.map((raw: any) => {
      const x = normalizeId(raw)
      return { id: Number(x.id), name: String(x.name ?? "").trim() }
    })
  } catch (err) {
    console.error("listStudentsByCircleForAttendance error", err)
    return []
  }
}

/* =========================================================
   ======== Student Dashboard (types + API) ========
   لتلبية الاستيرادات في صفحة لوحة الطالب
   ========================================================= */

// شكل صف الحضور الأخير للطالب
export type StudentAttendanceRow = {
  date: string
  status: "present" | "absent" | "late" | "excused" | string
  circle?: string | null
}

export type StudentDashboardActivityRow = {
  id: number
  date: string
  surah: string
  pages: string
  grade: string
}

// ملخص الأرقام أعلى صفحة الطالب
export type StudentDashboardTotals = {
  circles?: number | null            // عدد الحلقات المنتسب لها (إن وُجد)
  attendance_rate?: number | null    // نسبة الحضور %
  assessments_count?: number | null  // عدد التقييمات الأخيرة
  present_days?: number | null
  absent_days?: number | null
  late_days?: number | null
  excused_days?: number | null
  [k: string]: any
}

// استجابة لوحة الطالب
export type StudentDashboardResponse = {
  studentName?: string | null
  currentLevelName?: string | null
  progressPercent?: number | null
  totals: StudentDashboardTotals
  recentAttendance: StudentAttendanceRow[]
  recentActivities: StudentDashboardActivityRow[]
  recentAssessments?: Array<{
    date: string
    kind?: string
    title?: string | null
    score?: number | null
    grade?: string | null
  }>
}

// تطبيع صف الحضور
function normalizeStudentAttendanceRow(raw: any): StudentAttendanceRow {
  const d = raw?.date ?? raw?.day ?? raw?.created_at ?? ""
  const status =
    raw?.status ??
    raw?.state ??
    raw?.s ??
    (raw?.present ? "present" : raw?.absent ? "absent" : raw?.late ? "late" : raw?.excused ? "excused" : "")
  return {
    date: String(d),
    status: String(status || ""),
    circle: raw?.circle ?? raw?.circle_name ?? raw?.class ?? null,
  }
}

function normalizeProgressPercent(raw: any): number | null {
  const numeric = Number(raw ?? NaN)
  if (!Number.isFinite(numeric)) return null
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function normalizePagesLabel(raw: any): string {
  if (raw == null || raw === "") return "--"
  if (Array.isArray(raw)) {
    const joined = raw.filter(Boolean).join(" - ")
    return joined || "--"
  }
  if (typeof raw === "object") {
    const from = raw?.from ?? raw?.from_page ?? raw?.start ?? raw?.start_page
    const to = raw?.to ?? raw?.to_page ?? raw?.end ?? raw?.end_page
    if (from != null || to != null) {
      return [from, to].filter((value) => value != null && value !== "").join(" - ") || "--"
    }
  }
  const text = String(raw).trim()
  return text || "--"
}

function normalizeDashboardActivityRow(raw: any): StudentDashboardActivityRow {
  const pagesRange =
    raw?.pages ??
    raw?.page_range ??
    raw?.pages_range ??
    (raw?.from_page != null || raw?.to_page != null ? { from_page: raw?.from_page, to_page: raw?.to_page } : null)

  const rawGrade = raw?.grade ?? raw?.score ?? raw?.mark ?? raw?.result ?? raw?.evaluation

  return {
    id: Number(raw?.id ?? 0),
    date: String(raw?.date ?? raw?.created_at ?? raw?.logged_at ?? ""),
    surah: String(raw?.surah_name ?? raw?.surah ?? raw?.title ?? raw?.lesson_name ?? "غير محدد"),
    pages: normalizePagesLabel(pagesRange),
    grade: rawGrade == null || rawGrade === "" ? "--" : String(rawGrade),
  }
}

/** جلب لوحة الطالب (عدّل المسار إذا كان مختلفًا في الباك) */
export async function fetchStudentDashboard(): Promise<StudentDashboardResponse> {
  const { data } = await api.get("/student/dashboard")
  const root = (data?.data ?? data) || {}
  const student = root.student ?? root.profile ?? root.user ?? root

  const totals: StudentDashboardTotals =
    root.totals ?? root.stats ?? root.summary ?? root.overview ?? {}

  const attendanceSrc: any[] =
    root.recentAttendance ?? root.attendance_recent ?? root.attendance ?? []

  const assessmentsSrc: any[] =
    root.recentAssessments ?? root.assessments_recent ?? root.assessments ?? []

  const activitiesSrc: any[] =
    root.recentActivities ??
    root.recent_logs ??
    root.teacher_logs ??
    root.teacherLogs ??
    root.memorization_logs ??
    root.logs ??
    assessmentsSrc

  const currentLevelName =
    student?.level?.name ??
    student?.level_name ??
    student?.current_level?.name ??
    root?.level?.name ??
    root?.level_name ??
    totals?.level_name ??
    null

  const progressPercent =
    normalizeProgressPercent(root?.progress_percent) ??
    normalizeProgressPercent(root?.level_progress_percent) ??
    normalizeProgressPercent(root?.progress?.percent) ??
    normalizeProgressPercent(totals?.progress_percent) ??
    normalizeProgressPercent(totals?.completion_rate)

  return {
    studentName: student?.name ?? student?.full_name ?? null,
    currentLevelName: currentLevelName == null ? null : String(currentLevelName),
    progressPercent,
    totals,
    recentAttendance: Array.isArray(attendanceSrc)
      ? attendanceSrc.map(normalizeStudentAttendanceRow)
      : [],
    recentActivities: Array.isArray(activitiesSrc)
      ? activitiesSrc.map(normalizeDashboardActivityRow).slice(0, 5)
      : [],
    recentAssessments: Array.isArray(assessmentsSrc)
      ? assessmentsSrc.map((x: any) => ({
        date: String(x?.date ?? x?.created_at ?? ""),
        kind: x?.kind ?? x?.type ?? undefined,
        title: x?.title ?? null,
        score: x?.score ?? x?.mark ?? null,
        grade: x?.grade ?? null,
      }))
      : [],
  }




}
