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

