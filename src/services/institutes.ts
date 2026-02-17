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
): Promise<Institute[] | Paginated<Institute>> {
  const res = await api.get("/institutes", { params })

  if (Array.isArray(res.data)) {
    return res.data.map(normalizeInstitute)
  }

  if (Array.isArray(res.data?.data)) {
    return {
      ...res.data,
      data: res.data.data.map(normalizeInstitute),
    } as Paginated<Institute>
  }

  return res.data
}

export async function getInstitute(id: number): Promise<Institute> {
  const res = await api.get(`/institutes/${id}`)
  const item = res.data?.data ?? res.data
  return normalizeInstitute(item)
}

// إنشاء معهد جديد
export async function createInstitute(
  payload: InstituteFormValues
): Promise<Institute> {
  const res = await api.post("/institutes", payload)
  const item = res.data?.data ?? res.data
  return normalizeInstitute(item)
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

