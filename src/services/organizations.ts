import api from "./api"
import { normalizeId } from "@/lib/normalize"
import type { BaseRow } from "@/types/base"

/** قائمة المنظمات لاستخدامها كـ Select */
export async function listOrganizations(): Promise<BaseRow[]> {
  const { data } = await api.get("/organizations", { params: { per_page: 1000 } })

  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : []

  return arr.map((x: any) =>
    normalizeId({
      ...x,
      name: x.name,
    })
  )
}
