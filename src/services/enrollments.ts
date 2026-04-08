import api from "./api"

export type EnrollmentStatus = "pending" | "active" | "suspended" | "completed" | "cancelled"
export type EnrollmentPaymentStatus = "unpaid" | "partial" | "paid"

export type Enrollment = {
  id: number
  student_id: number
  institute_id: number
  circle_id?: number | null
  status: EnrollmentStatus
  enrollment_date: string
  start_date?: string | null
  end_date?: string | null
  payment_status?: EnrollmentPaymentStatus
  total_fees?: number
  paid_amount?: number
  enrollment_code?: string | null
  notes?: string | null
  student?: { id: number; name: string }
  institute?: { id: number; name: string }
  circle?: { id: number; name: string }
  [k: string]: any
}

export type EnrollmentListParams = {
  page?: number
  per_page?: number
  search?: string
  status?: EnrollmentStatus
  payment_status?: EnrollmentPaymentStatus
  student_id?: number
  institute_id?: number
  circle_id?: number
}

export type EnrollmentPayload = {
  student_id: number
  institute_id: number
  circle_id?: number | null
  status: EnrollmentStatus
  enrollment_date: string
  start_date?: string | null
  end_date?: string | null
  total_fees: number
  notes?: string | null
}

export type Paginated<T> = { data: T[]; meta?: any; [k: string]: any }

function normalizeEnrollment(raw: any): Enrollment {
  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    student_id: Number(raw?.student_id ?? 0),
    institute_id: Number(raw?.institute_id ?? 0),
    circle_id: raw?.circle_id == null ? null : Number(raw.circle_id),
    total_fees: raw?.total_fees == null ? undefined : Number(raw.total_fees),
    paid_amount: raw?.paid_amount == null ? undefined : Number(raw.paid_amount),
  }
}

export async function listEnrollments(
  params?: EnrollmentListParams
): Promise<Enrollment[] | Paginated<Enrollment>> {
  const { data } = await api.get("/enrollments", { params })
  if (Array.isArray(data)) return data.map(normalizeEnrollment)
  if (Array.isArray(data?.data)) return { ...data, data: data.data.map(normalizeEnrollment) }
  return data
}

export async function getEnrollment(id: number): Promise<Enrollment> {
  const { data } = await api.get(`/enrollments/${id}`)
  return normalizeEnrollment(data?.data ?? data)
}

export async function createEnrollment(payload: EnrollmentPayload): Promise<Enrollment> {
  const { data } = await api.post("/enrollments", payload)
  return normalizeEnrollment(data?.data ?? data)
}

export async function updateEnrollment(id: number, payload: EnrollmentPayload): Promise<Enrollment> {
  const { data } = await api.put(`/enrollments/${id}`, payload)
  return normalizeEnrollment(data?.data ?? data)
}

export async function deleteEnrollment(id: number) {
  const { data } = await api.delete(`/enrollments/${id}`)
  return data
}
