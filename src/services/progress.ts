import api from "./api"

export type ProgressType = "memorization" | "revision"

export type ProgressGrade = "excellent" | "very_good" | "good" | "weak"

export type StudentProgressInput = {
  student_id: number
  surah: number
  from_ayah: number
  to_ayah: number
  grade: ProgressGrade
  type: ProgressType
}

export type BulkProgressPayload = {
  circle_id: number
  date: string
  items: StudentProgressInput[]
}

export type ProgressHistoryItem = {
  id: number
  date: string
  type: ProgressType
  surah: number
  from_ayah: number
  to_ayah: number
  grade: string
  [k: string]: any
}

function normalizeHistoryItem(raw: any): ProgressHistoryItem {
  return {
    id: Number(raw?.id ?? 0),
    date: String(raw?.date ?? raw?.session_date ?? raw?.created_at ?? ""),
    type: String(raw?.type ?? "memorization") as ProgressType,
    surah: Number(raw?.surah ?? raw?.surah_number ?? raw?.from_surah ?? 0),
    from_ayah: Number(raw?.from_ayah ?? raw?.ayah_from ?? 0),
    to_ayah: Number(raw?.to_ayah ?? raw?.ayah_to ?? 0),
    grade: String(raw?.grade ?? raw?.evaluation ?? ""),
    ...raw,
  }
}

export async function submitBulkProgress(payload: BulkProgressPayload) {
  const body = {
    circle_id: payload.circle_id,
    date: payload.date,
    items: payload.items,
    progress: payload.items,
  }
  const { data } = await api.post("/progress/bulk", body)
  return data
}

export async function listStudentProgressHistory(studentId: number, type?: ProgressType) {
  const attempts: Array<{ url: string; params?: Record<string, any> }> = [
    { url: `/progress/students/${studentId}/history`, params: type ? { type } : undefined },
    { url: `/students/${studentId}/progress`, params: type ? { type } : undefined },
    { url: "/progress/history", params: { student_id: studentId, ...(type ? { type } : {}) } },
  ]

  for (const attempt of attempts) {
    try {
      const { data } = await api.get(attempt.url, { params: attempt.params })
      const src = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      return src.map(normalizeHistoryItem)
    } catch {
      // try next endpoint shape
    }
  }

  return [] as ProgressHistoryItem[]
}