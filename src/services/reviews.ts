import api from "./api"
import { normalizeId } from "@/lib/normalize"

export type ReviewRecord = {
  id: number
  student_id?: number | null
  session_date: string // YYYY-MM-DD
  pages_count?: number | null
  evaluation?: number | null
  mistakes_count?: number | null
  notes?: string | null
  range: {
    from_surah: number
    from_ayah: number
    to_surah: number
    to_ayah: number
  }
  student?: any
  teacher?: any
  circle?: any
}

function normalizeReviewRecord(raw: any): ReviewRecord {
  const x = normalizeId(raw)
  const range = x.range ?? {}
  return {
    id: x.id,
    student_id: x.student_id ?? x.student?.id ?? null,
    session_date: String(x.session_date ?? ""),
    pages_count: x.pages_count ?? null,
    evaluation: x.evaluation ?? null,
    mistakes_count: x.mistakes_count ?? 0,
    notes: x.notes ?? null,
    range: {
      from_surah: Number(range.from_surah ?? x.from_surah ?? 0),
      from_ayah: Number(range.from_ayah ?? x.from_ayah ?? 0),
      to_surah: Number(range.to_surah ?? x.to_surah ?? 0),
      to_ayah: Number(range.to_ayah ?? x.to_ayah ?? 0),
    },
    student: x.student,
    teacher: x.teacher,
    circle: x.circle,
  }
}

/** جلب سجلات المراجعة لحلقة معيّنة (اختياري حسب التاريخ) */
export async function listCircleReviews(circleId: number, date?: string): Promise<ReviewRecord[]> {
  const params: any = {}
  if (date) params.date = date

  const { data } = await api.get(`/teacher/circles/${circleId}/reviews`, { params })
  const src = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
  return src.map(normalizeReviewRecord)
}

/** إضافة مراجعة لطالب معيّن داخل حلقة معيّنة */
export async function createReviewRecord(payload: {
  circle_id: number
  student_id: number
  session_date: string
  from_surah: number
  from_ayah: number
  to_surah: number
  to_ayah: number
  pages_count?: number | null
  evaluation?: number | null
  mistakes_count?: number | null
  notes?: string | null
}) {
  const { circle_id, student_id, ...rest } = payload
  const { data } = await api.post(`/teacher/circles/${circle_id}/students/${student_id}/reviews`, rest)
  return data
}
