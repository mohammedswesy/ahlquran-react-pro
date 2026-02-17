import api from "./api"
import { normalizeId } from "@/lib/normalize"
import type { BaseRow } from "@/types/base"

export async function listCities(params?: { country_id?: number; search?: string }): Promise<BaseRow[]> {
  const { data } = await api.get("/cities", { params })
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  return arr.map((x: any) =>
    normalizeId({
      ...x,
      name: x.name,
      country_id: x.country_id,
    })
  )
}
