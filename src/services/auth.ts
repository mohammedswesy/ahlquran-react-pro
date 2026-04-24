// src/services/auth.ts
import api from "./api"
import { resolveRoleFromUser, resolveTenantContextFromUser } from "@/store/auth"

export type LoginPayload = { email: string; password: string }

export async function login(payload: LoginPayload) {
    const res = await api.post("/auth/login", payload)
    const { token, role, user } = res.data
    const resolvedRole = resolveRoleFromUser(user, role)
    const tenant = resolveTenantContextFromUser(user, {
        instituteId: res.data?.institute_id,
        instituteName: res.data?.institute_name,
        brandName: res.data?.brand_name,
    })

    return { token, role: resolvedRole, user, tenant }
}

export async function me() {
    const res = await api.get("/auth/me")
    return res.data
}

export function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("institute_id")
    localStorage.removeItem("institute_name")
    localStorage.removeItem("brand_name")
}

export async function requestPasswordReset(email: string) {
    const { data } = await api.post("/auth/forgot-password", { email })
    return data
}

export async function registerStudent(payload: {
    name: string
    email: string
    mobile?: string
    password: string
    password_confirmation: string
}) {
    const { data } = await api.post("/auth/register-student", payload)
    return data
}
