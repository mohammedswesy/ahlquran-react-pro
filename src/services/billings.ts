import api from "./api"

export type Billing = {
  id: number
  enrollment_id: number
  amount: number
  payment_method?: string | null
  reference?: string | null
  notes?: string | null
  created_at?: string | null
  [k: string]: any
}

export type BillingListParams = {
  page?: number
  per_page?: number
  search?: string
  enrollment_id?: number
}

export type BillingPayload = {
  enrollment_id: number
  amount: number
  payment_method?: string | null
  reference?: string | null
  notes?: string | null
}

export type Paginated<T> = { data: T[]; meta?: any; [k: string]: any }

function normalizeBilling(raw: any): Billing {
  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    enrollment_id: Number(raw?.enrollment_id ?? 0),
    amount: Number(raw?.amount ?? 0),
  }
}

export async function listBillings(
  params?: BillingListParams
): Promise<Billing[] | Paginated<Billing>> {
  const { data } = await api.get("/billings", { params })
  if (Array.isArray(data)) return data.map(normalizeBilling)
  if (Array.isArray(data?.data)) return { ...data, data: data.data.map(normalizeBilling) }
  return data
}

export async function getBilling(id: number): Promise<Billing> {
  const { data } = await api.get(`/billings/${id}`)
  return normalizeBilling(data?.data ?? data)
}

export async function createBilling(payload: BillingPayload): Promise<Billing> {
  const { data } = await api.post("/billings", payload)
  return normalizeBilling(data?.data ?? data)
}

export async function updateBilling(id: number, payload: BillingPayload): Promise<Billing> {
  const { data } = await api.put(`/billings/${id}`, payload)
  return normalizeBilling(data?.data ?? data)
}

export async function deleteBilling(id: number) {
  const { data } = await api.delete(`/billings/${id}`)
  return data
}
