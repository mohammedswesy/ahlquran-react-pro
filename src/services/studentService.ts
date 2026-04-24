import api from "@/services/api"
import { getCircleTrackDescription, getCircleTrackName, normalizeCircleTrack, type CircleTrack } from "@/lib/circleTracks"

export type StudentProfile = {
  id: number
  name: string
  code?: string | null
  email?: string | null
  mobile?: string | null
  level?: string | number | null
  institute_name?: string | null
  circle_name?: string | null
  track?: CircleTrack | null
  track_name?: string | null
  track_description?: string | null
  [k: string]: any
}

export type StudentExam = {
  id: number
  exam_name: string
  score: number
  max_score: number
  result: "passed" | "failed"
  exam_date: string
  notes?: string | null
  circle_id?: number | null
  circle_name?: string | null
  track?: CircleTrack | null
  track_name?: string | null
  certificate_available?: boolean
  [k: string]: any
}

export type StudentAttendanceSummary = {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  presence_percent: number
  absence_percent: number
}

export type StudentAttendanceRecord = {
  id: number
  date: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string | null
  circle_id?: number | null
  circle_name?: string | null
  track?: CircleTrack | null
  track_name?: string | null
  [k: string]: any
}

function unwrap<T = any>(data: any): T {
  return (data?.data ?? data) as T
}

function normalizePercent(value: unknown): number {
  const numberValue = Number(value ?? 0)
  if (!Number.isFinite(numberValue)) return 0
  return Math.max(0, Math.min(100, numberValue))
}

function normalizeStudentProfile(raw: any): StudentProfile {
  const source = raw?.student ?? raw?.profile ?? raw ?? {}
  const track = normalizeCircleTrack(
    source?.track ?? source?.track_key ?? source?.current_track ?? source?.circle?.track ?? source?.current_circle?.track
  )

  return {
    ...source,
    id: Number(source?.id ?? 0),
    name: String(source?.name ?? source?.full_name ?? source?.student_name ?? "الطالب"),
    code: source?.code ?? source?.student_code ?? null,
    email: source?.email ?? null,
    mobile: source?.mobile ?? source?.phone ?? null,
    level: source?.level ?? source?.grade_level ?? null,
    institute_name: source?.institute_name ?? source?.institute?.name ?? source?.current_circle?.institute?.name ?? null,
    circle_name: source?.circle_name ?? source?.circle?.name ?? source?.current_circle?.name ?? null,
    track,
    track_name: source?.track_name ?? getCircleTrackName(track),
    track_description: source?.track_description ?? getCircleTrackDescription(track),
  }
}

function normalizeStudentExam(raw: any): StudentExam {
  const score = Number(raw?.score ?? 0)
  const maxScore = Number(raw?.max_score ?? 100)
  const percent = maxScore > 0 ? (score / maxScore) * 100 : 0
  const rawResult = String(raw?.result ?? "").toLowerCase()
  const result = rawResult === "passed" || rawResult === "failed" ? rawResult : percent >= 60 ? "passed" : "failed"
  const track = normalizeCircleTrack(raw?.track ?? raw?.circle?.track ?? raw?.track_key)

  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    exam_name: String(raw?.exam_name ?? raw?.name ?? raw?.subject ?? "اختبار"),
    score,
    max_score: maxScore,
    result,
    exam_date: String(raw?.exam_date ?? raw?.date ?? raw?.created_at ?? ""),
    circle_id: raw?.circle_id == null ? null : Number(raw.circle_id),
    circle_name: raw?.circle_name ?? raw?.circle?.name ?? null,
    track,
    track_name: raw?.track_name ?? getCircleTrackName(track),
    certificate_available: Boolean(raw?.certificate_available ?? (result === "passed")),
  }
}

function normalizeStudentAttendanceRecord(raw: any): StudentAttendanceRecord {
  const track = normalizeCircleTrack(raw?.track ?? raw?.circle?.track ?? raw?.track_key)

  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    date: String(raw?.date ?? raw?.attendance_date ?? raw?.created_at ?? ""),
    status: (raw?.status ?? "present") as StudentAttendanceRecord["status"],
    notes: raw?.notes ?? null,
    circle_id: raw?.circle_id == null ? null : Number(raw.circle_id),
    circle_name: raw?.circle_name ?? raw?.circle?.name ?? null,
    track,
    track_name: raw?.track_name ?? getCircleTrackName(track),
  }
}

export async function getStudentProfile(): Promise<StudentProfile> {
  const { data } = await api.get("/student/profile")
  return normalizeStudentProfile(unwrap(data))
}

export async function getStudentExams(): Promise<StudentExam[]> {
  const { data } = await api.get("/student/exams")
  const root = unwrap(data)
  const source = Array.isArray(root) ? root : Array.isArray(root?.exams) ? root.exams : []
  return source.map(normalizeStudentExam)
}

export async function getStudentAttendanceSummary(): Promise<StudentAttendanceSummary> {
  const { data } = await api.get("/student/attendance-summary")
  const root = unwrap(data)
  const source = root?.attendance ?? root?.summary ?? root?.totals ?? root ?? {}
  const total = Number(source?.total ?? source?.total_days ?? source?.sessions ?? 0)
  const present = Number(source?.present ?? source?.present_days ?? 0)
  const absent = Number(source?.absent ?? source?.absences ?? source?.absent_days ?? 0)
  const late = Number(source?.late ?? source?.lates ?? source?.late_days ?? 0)
  const excused = Number(source?.excused ?? source?.excused_days ?? 0)
  const presencePercent = normalizePercent(
    source?.presence_percent ?? source?.attendance_percent ?? source?.attendance_rate ?? (total > 0 ? (present / total) * 100 : 0)
  )
  const absencePercent = normalizePercent(source?.absence_percent ?? (total > 0 ? (absent / total) * 100 : 0))

  return {
    total,
    present,
    absent,
    late,
    excused,
    presence_percent: presencePercent,
    absence_percent: absencePercent,
  }
}

export async function getStudentAttendanceHistory(): Promise<StudentAttendanceRecord[]> {
  const { data } = await api.get("/student/attendance")
  const root = unwrap(data)
  const source = Array.isArray(root) ? root : Array.isArray(root?.attendance) ? root.attendance : Array.isArray(root?.records) ? root.records : []
  return source.map(normalizeStudentAttendanceRecord)
}

export async function downloadStudentCertificate(examId: number): Promise<void> {
  const response = await api.get(`/student/exams/${examId}/certificate`, {
    responseType: "blob",
  })

  const contentDisposition = response.headers["content-disposition"]
  const utf8Match = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)
  const plainMatch = contentDisposition?.match(/filename="?([^";]+)"?/i)
  const filename = utf8Match?.[1]
    ? decodeURIComponent(utf8Match[1])
    : plainMatch?.[1] || `student-certificate-${examId}.pdf`

  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/pdf",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
