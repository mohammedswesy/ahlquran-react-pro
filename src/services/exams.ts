// src/services/exams.ts
import api from "./api"

export type ExamResult = "passed" | "failed"

function getDownloadFilename(contentDisposition?: string | null, fallback = "certificate.pdf") {
  if (!contentDisposition) return fallback

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return plainMatch?.[1] || fallback
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type Exam = {
  id: number
  student_id: number
  circle_id?: number | null
  exam_name: string
  score: number
  max_score: number
  result: ExamResult
  exam_date: string
  notes?: string | null
  student?: { id: number; name: string }
  circle?: { id: number; name: string }
  [k: string]: any
}

export type ExamPayload = {
  student_id: number
  circle_id?: number | null
  exam_name: string
  score: number
  max_score: number
  exam_date: string
  notes?: string | null
}

export type ExamListParams = {
  page?: number
  per_page?: number
  search?: string
  circle_id?: number
  result?: ExamResult
}

export type Paginated<T> = { data: T[]; meta?: any; [k: string]: any }

function normalizeExam(raw: any): Exam {
  const score = Number(raw?.score ?? 0)
  const maxScore = Number(raw?.max_score ?? 100)
  const percent = maxScore > 0 ? (score / maxScore) * 100 : 0
  const rawResult = typeof raw?.result === "string" ? raw.result.toLowerCase() : undefined
  const result: ExamResult = rawResult === "passed" || rawResult === "failed"
    ? rawResult
    : (percent >= 60 ? "passed" : "failed")
  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    student_id: Number(raw?.student_id ?? 0),
    circle_id: raw?.circle_id == null ? null : Number(raw.circle_id),
    score,
    max_score: maxScore,
    result,
  }
}

export async function listExams(params?: ExamListParams): Promise<Paginated<Exam>> {
  const { data } = await api.get("/exams", { params })
  const src = data?.data ?? data
  const rows: Exam[] = Array.isArray(src) ? src.map(normalizeExam) : []
  return { data: rows, meta: data?.meta ?? data?.pagination ?? {} }
}

export async function createExam(payload: ExamPayload): Promise<Exam> {
  const { data } = await api.post("/exams", payload)
  const raw = data?.data ?? data
  return normalizeExam(raw)
}

export async function updateExam(id: number, payload: Partial<ExamPayload>): Promise<Exam> {
  const { data } = await api.put(`/exams/${id}`, payload)
  const raw = data?.data ?? data
  return normalizeExam(raw)
}

export async function deleteExam(id: number): Promise<void> {
  await api.delete(`/exams/${id}`)
}

export async function downloadCertificate(examId: number): Promise<void> {
  const response = await api.get(`/exams/${examId}/certificate`, {
    responseType: "blob",
  })

  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/pdf",
  })
  const filename = getDownloadFilename(
    response.headers["content-disposition"],
    `exam-certificate-${examId}.pdf`
  )

  triggerDownload(blob, filename)
}

/** حساب النتيجة محلياً (يُستخدم في الواجهة قبل الحفظ) */
export function calcResult(score: number, maxScore: number): ExamResult {
  if (maxScore <= 0) return "failed"
  return (score / maxScore) * 100 >= 60 ? "passed" : "failed"
}
