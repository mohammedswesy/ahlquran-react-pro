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

type AuthState = {
  token: string | null
  role: Role | null
  setToken: (token: string | null) => void
  setRole: (role: Role | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  role: typeof window !== "undefined"
    ? (normalizeRole(localStorage.getItem("role")) || null)
    : null,

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
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("role")
    }
    set({ token: null, role: null })
  },

}))
