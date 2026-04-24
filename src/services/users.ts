import api from "./api"
import { normalizeId } from "@/lib/normalize"

export type UserOption = {
  id: number
  name: string
  email?: string | null
  mobile?: string | null
  status?: number | string | null
  institute_id?: number | null
  [k: string]: any
}

function normalizeUser(raw: any): UserOption {
  const x = normalizeId(raw)
  return {
    ...x,
    id: Number(x.id ?? 0),
    name: String(x.name ?? x.full_name ?? "").trim(),
    email: x.email ?? null,
    mobile: x.mobile ?? x.phone ?? null,
    status: x.status ?? null,
    institute_id: x.institute_id == null ? null : Number(x.institute_id),
  }
}

function extractUsers(data: any): UserOption[] {
  const src = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.users)
        ? data.users
        : []

  return src.map(normalizeUser).filter((user) => user.id > 0 && user.name)
}

export async function listAssignableUsers(params?: { search?: string; per_page?: number }): Promise<UserOption[]> {
  const endpoints = [
    "/users",
    "/admin/users",
    "/employees/assignable-users",
  ]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint, { params })
      const users = extractUsers(data?.data ?? data)
      if (users.length > 0) return users
    } catch {
      continue
    }
  }

  return []
}