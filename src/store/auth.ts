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
    ? ((localStorage.getItem("role") as Role) || null)
    : null,

  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("token", token)
      else localStorage.removeItem("token")
    }
    set({ token })
  },

  setRole: (role) => {
    if (typeof window !== "undefined") {
      if (role) localStorage.setItem("role", role)
      else localStorage.removeItem("role")
    }
    set({ role })
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("role")
    }
    set({ token: null, role: null })
  },

}))
