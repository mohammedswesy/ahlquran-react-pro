import api from "./api"
import { normalizeId } from "@/lib/normalize"
import type { InstituteFormValues } from "@/pages/admin/InstituteForm"

// ========== Types ==========
export type CreateInstitutePayload = {
  name: string
  country_id: number
  city_id: number
  organization_id?: number | null
  latitude?: number | null
  longitude?: number | null
  status?: number | null
}

export type UpdateInstitutePayload = Partial<CreateInstitutePayload>

export type Institute = {
  id: number
  name: string
  country_id?: number | null
  city_id?: number | null
  organization_id?: number | null
  latitude?: number | null
  longitude?: number | null
  status?: number | null
  [k: string]: any
}

export type AdminCredentials = {
  email: string
  password: string
}

export type CreateInstituteResult = {
  institute: Institute
  admin_credentials?: AdminCredentials | null
}

export type ListParams = { page?: number; per_page?: number; search?: string }
export type Paginated<T> = {
  data: T[]
  current_page?: number
  per_page?: number
  total?: number
  [k: string]: any
}

// ========== Helpers ==========
function normalizeInstitute(raw: any): Institute {
  const withId = normalizeId(raw)
  return { ...withId } as Institute
}

// ========== API Calls ==========
export async function listInstitutes(
  params?: ListParams
): Promise<{ data: Institute[]; meta: Record<string, any> | null }> {
  const res = await api.get("/institutes", { params })

  // Debug — remove once data flow is confirmed
  console.log("[listInstitutes] raw API response:", res.data)

  let items: any[] = []
  let meta: Record<string, any> | null = null

  if (Array.isArray(res.data)) {
    // plain array (non-paginated collection)
    items = res.data
  } else if (Array.isArray(res.data?.data)) {
    // standard Laravel paginator: { data:[…], links:{…}, meta:{…} }
    items = res.data.data
    meta = res.data.meta ?? null
  } else if (Array.isArray(res.data?.data?.data)) {
    // double-wrapped edge case
    items = res.data.data.data
    meta = res.data.data.meta ?? null
  }

  const data = items.map(normalizeInstitute)
  console.log("[listInstitutes] extracted rows:", data, "meta:", meta)

  return { data, meta }
}

export async function getInstitute(id: number): Promise<Institute> {
  const res = await api.get(`/institutes/${id}`)
  const item = res.data?.data ?? res.data
  return normalizeInstitute(item)
}

// إنشاء معهد جديد
export async function createInstitute(
  payload: InstituteFormValues
): Promise<CreateInstituteResult> {
  const res = await api.post("/institutes", payload)
  const root = res.data?.data ?? res.data ?? {}

  const instituteRaw =
    root?.institute ??
    root?.record ??
    root

  const credsRaw =
    root?.admin_credentials ??
    res.data?.admin_credentials ??
    null

  const admin_credentials = credsRaw
    ? {
        email: String(credsRaw.email ?? "").trim(),
        password: String(credsRaw.password ?? credsRaw.plain_text_password ?? "").trim(),
      }
    : null

  return {
    institute: normalizeInstitute(instituteRaw),
    admin_credentials,
  }
}

// تعديل معهد
export async function updateInstitute(
  id: number,
  payload: Partial<InstituteFormValues>
): Promise<Institute> {
  const res = await api.put(`/institutes/${id}`, payload)
  const item = res.data?.data ?? res.data
  return normalizeInstitute(item)
}

// حذف معهد
export async function deleteInstitute(id: number) {
  const res = await api.delete(`/institutes/${id}`)
  return res.data
}

// ========== Options for Selects ==========
export type InstituteOption = { id: number; name: string }

// ========== Subscription Types ==========
export type SubscriptionPlan = "free" | "pro" | "enterprise"
export type SubscriptionStatus = "active" | "expired" | "trial" | "suspended"

export type InstituteSubscription = {
  id: number
  institute_id: number
  institute_name: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  expiry_date: string | null
  monthly_fee: number
  students_count?: number
  [k: string]: any
}

export type SubscriptionPayment = {
  id: number
  institute_id: number
  institute_name: string
  amount: number
  payment_date: string
  method: string
  reference?: string | null
  notes?: string | null
}

export type SubscriptionStats = {
  total_monthly_revenue: number
  total_active_institutes: number
  upcoming_renewals: number
}

export type UpdateSubscriptionPayload = {
  plan: SubscriptionPlan
  expiry_date: string | null
  monthly_fee?: number
}

export async function listSubscriptions(): Promise<InstituteSubscription[]> {
  const res = await api.get("/subscriptions")
  const src = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
  return src as InstituteSubscription[]
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const res = await api.get("/subscriptions/stats")
  const d = res.data?.data ?? res.data ?? {}
  return {
    total_monthly_revenue: Number(d.total_monthly_revenue ?? d.monthly_revenue ?? 0),
    total_active_institutes: Number(d.total_active_institutes ?? d.active_institutes ?? 0),
    upcoming_renewals: Number(d.upcoming_renewals ?? d.renewals ?? 0),
  }
}

export async function listSubscriptionPayments(): Promise<SubscriptionPayment[]> {
  const res = await api.get("/subscriptions/payments")
  const src = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
  return src as SubscriptionPayment[]
}

export async function updateSubscription(
  instituteId: number,
  payload: UpdateSubscriptionPayload
): Promise<InstituteSubscription> {
  const res = await api.put(`/institutes/${instituteId}/subscription`, payload)
  return (res.data?.data ?? res.data) as InstituteSubscription
}

// ========== Options helper ==========
/**
 * دالة لإرجاع قائمة مبسطة من المعاهد
 * تستخدم في الـSelect أو الـCombobox
 */
// يعطيك [{ id, name }] بدون أي توابع
export async function listInstitutesOptions(): Promise<Array<{ id: number; name: string }>> {
  const res = await api.get("/institutes", { params: { per_page: 1000 } })

  // يدعم شكلين: {data:[...]} أو Array مباشرة
  const src = Array.isArray(res.data?.data)
    ? res.data.data
    : Array.isArray(res.data)
    ? res.data
    : []

  return src.map((row: any) => {
    // نلتقط المعرف من أي حقل محتمل
    const rawId = row?.id ?? row?._id ?? row?.uuid ?? row?.ID
    const id = Number(rawId)
    return {
      id: Number.isFinite(id) ? id : 0,
      name: String(row?.name ?? row?.title ?? "").trim(),
    }
  })
}

