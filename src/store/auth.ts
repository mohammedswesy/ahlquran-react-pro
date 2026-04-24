// src/store/auth.ts
import { create } from "zustand"

export type Role =
  | "super-admin"
  | "org-admin"
  | "institute-admin"
  | "sub-admin"
  | "teacher"
  | "student"
  | "parent"
  | "employee"

export const DEFAULT_BRAND_NAME = "Ma'ahed Al-Khalil"

const KNOWN_ROLES: Role[] = [
  "super-admin",
  "org-admin",
  "institute-admin",
  "sub-admin",
  "teacher",
  "student",
  "parent",
  "employee",
]

function toKebab(input: string): string {
  return input.trim().toLowerCase().replace(/[_\s]+/g, "-")
}

export function normalizeRole(input: unknown): Role | null {
  if (typeof input !== "string") return null
  const value = toKebab(input)
  return (KNOWN_ROLES.includes(value as Role) ? (value as Role) : null)
}

export function resolveRoleFromUser(user: any, fallback?: unknown): Role | null {
  const direct =
    normalizeRole(user?.role) ||
    normalizeRole(user?.user_role) ||
    normalizeRole(user?.type)

  if (direct) return direct

  const rolesArr =
    (Array.isArray(user?.roles) ? user.roles : []) as Array<string | { name?: string }>

  for (const item of rolesArr) {
    const roleName = typeof item === "string" ? item : item?.name
    const normalized = normalizeRole(roleName)
    if (normalized) return normalized
  }

  return normalizeRole(fallback)
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toNullableText(value: unknown): string | null {
  if (typeof value !== "string") return null
  const next = value.trim()
  return next.length ? next : null
}

export type TenantContext = {
  instituteId?: number | null
  instituteName?: string | null
  brandName?: string | null
}

export function resolveTenantContextFromUser(user: any, fallback?: TenantContext): Required<TenantContext> {
  const instituteId =
    toNullableNumber(user?.institute_id) ??
    toNullableNumber(user?.institute?.id) ??
    toNullableNumber(user?.organization?.institute_id) ??
    fallback?.instituteId ??
    null

  const instituteName =
    toNullableText(user?.institute_name) ??
    toNullableText(user?.institute?.name) ??
    toNullableText(fallback?.instituteName) ??
    null

  const brandName =
    toNullableText(user?.brand_name) ??
    toNullableText(user?.brand?.name) ??
    toNullableText(user?.institute?.brand_name) ??
    toNullableText(fallback?.brandName) ??
    DEFAULT_BRAND_NAME

  return {
    instituteId,
    instituteName,
    brandName,
  }
}

type AuthState = {
  token: string | null
  role: Role | null
  instituteId: number | null
  instituteName: string | null
  brandName: string
  setAuth: (payload: { token: string; role: Role; tenant?: TenantContext }) => void
  setToken: (token: string | null) => void
  setRole: (role: Role | null) => void
  setTenantContext: (ctx: TenantContext) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  role: typeof window !== "undefined"
    ? (normalizeRole(localStorage.getItem("role")) || null)
    : null,
  instituteId:
    typeof window !== "undefined"
      ? toNullableNumber(localStorage.getItem("institute_id"))
      : null,
  instituteName:
    typeof window !== "undefined"
      ? toNullableText(localStorage.getItem("institute_name"))
      : null,
  brandName:
    typeof window !== "undefined"
      ? toNullableText(localStorage.getItem("brand_name")) || DEFAULT_BRAND_NAME
      : DEFAULT_BRAND_NAME,

  setAuth: ({ token, role, tenant }) => {
    const normalizedRole = normalizeRole(role)
    const resolvedTenant = resolveTenantContextFromUser(undefined, tenant)

    if (typeof window !== "undefined") {
      localStorage.setItem("token", token)

      if (normalizedRole) localStorage.setItem("role", normalizedRole)
      else localStorage.removeItem("role")

      if (resolvedTenant.instituteId != null) localStorage.setItem("institute_id", String(resolvedTenant.instituteId))
      else localStorage.removeItem("institute_id")

      if (resolvedTenant.instituteName) localStorage.setItem("institute_name", resolvedTenant.instituteName)
      else localStorage.removeItem("institute_name")

      localStorage.setItem("brand_name", resolvedTenant.brandName || DEFAULT_BRAND_NAME)
    }

    set({
      token,
      role: normalizedRole,
      instituteId: resolvedTenant.instituteId,
      instituteName: resolvedTenant.instituteName,
      brandName: resolvedTenant.brandName || DEFAULT_BRAND_NAME,
    })
  },

  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("token", token)
      else localStorage.removeItem("token")
    }
    set({ token })
  },

  setRole: (role) => {
    const normalized = normalizeRole(role)
    if (typeof window !== "undefined") {
      if (normalized) localStorage.setItem("role", normalized)
      else localStorage.removeItem("role")
    }
    set({ role: normalized })
  },
  setTenantContext: (ctx) => {
    const normalizedInstituteId = toNullableNumber(ctx?.instituteId)
    const normalizedInstituteName = toNullableText(ctx?.instituteName)
    const normalizedBrandName = toNullableText(ctx?.brandName) || DEFAULT_BRAND_NAME

    if (typeof window !== "undefined") {
      if (normalizedInstituteId != null) localStorage.setItem("institute_id", String(normalizedInstituteId))
      else localStorage.removeItem("institute_id")

      if (normalizedInstituteName) localStorage.setItem("institute_name", normalizedInstituteName)
      else localStorage.removeItem("institute_name")

      localStorage.setItem("brand_name", normalizedBrandName)
    }

    set({
      instituteId: normalizedInstituteId,
      instituteName: normalizedInstituteName,
      brandName: normalizedBrandName,
    })
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("role")
      localStorage.removeItem("institute_id")
      localStorage.removeItem("institute_name")
      localStorage.removeItem("brand_name")
    }
    set({
      token: null,
      role: null,
      instituteId: null,
      instituteName: null,
      brandName: DEFAULT_BRAND_NAME,
    })
  },

}))
