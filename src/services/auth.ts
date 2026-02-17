// src/services/auth.ts
import api from "./api"

export type LoginPayload = { email: string; password: string }

export async function login(payload: LoginPayload) {
    const res = await api.post("/auth/login", payload)
    const { token, role, user } = res.data

   
    localStorage.setItem("token", token)
    if (role) localStorage.setItem("role", role)

    return { token, role, user }
}

export async function me() {
    const res = await api.get("/auth/me")
    return res.data
}

export function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
}
