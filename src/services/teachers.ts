// src/services/teachers.ts
import api from "@/services/api"
import { normalizeId } from "@/lib/normalize"

export type Teacher = {
    id: number
    name: string
    gender?: "male" | "female" | string | null
    email?: string | null
    phone?: string | null
    hire_date?: string | null

    institute_id?: number | null
    circle_id?: number | null
    status?: number | null

    institute?: { id: number; name: string }
    circle?: { id: number; name: string }

    // أحيانًا الباك يرجع user.name
    user?: { id: number; name: string }

    [k: string]: any
}

export type ListParams = {
    page?: number
    per_page?: number
    search?: string
    institute_id?: number
    circle_id?: number
}

export type Paginated<T> = { data: T[]; meta?: any;[k: string]: any }

function normalizeGender(g: any): "male" | "female" | undefined {
    if (g == null) return undefined
    const v = String(g).toLowerCase()
    if (["male", "m", "1", "ذكر"].includes(v)) return "male"
    if (["female", "f", "0", "أنثى"].includes(v)) return "female"
    return undefined
}

function normalizeDate(d: any): string | null | undefined {
    if (!d) return d
    try {
        const dt = new Date(d)
        if (Number.isNaN(dt.getTime())) return String(d)
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
    } catch {
        return String(d)
    }
}

function normalizeTeacher(raw: any): Teacher {
    const x = normalizeId(raw)

    // اسم المعلم ممكن يكون name أو user.name أو full_name
    const name =
        x.name ??
        x.full_name ??
        x.user?.name ??
        x.user_name ??
        ""

    return {
        ...x,
        name,
        gender: normalizeGender(x.gender) ?? x.gender,
        hire_date: normalizeDate(x.hire_date),
    } as Teacher
}

function coerceNullish<T extends Record<string, any>>(o: T): T {
    const out: any = { ...o }
    for (const k in out) if (out[k] === "" || out[k] === undefined) out[k] = null
    return out
}

/**
 * ✅ دايمًا برجع نفس الشكل: { data, meta }
 * وبتدعم:
 * - array: [ ... ]
 * - paginate: { data: [...], meta: {...} }
 * - resource: { data: {...} } (ممكن بعض الباك يرجعها هيك)
 */
export async function listTeachers(
    params?: ListParams
): Promise<{ data: Teacher[]; meta?: any }> {
    const { data } = await api.get("/teachers", { params })

    // Paginated
    if (Array.isArray(data?.data)) {
        return {
            data: data.data.map(normalizeTeacher),
            meta: data.meta ?? null,
        }
    }

    // Plain array
    if (Array.isArray(data)) {
        return { data: data.map(normalizeTeacher), meta: null }
    }

    // Single resource fallback
    if (data?.data && typeof data.data === "object") {
        return { data: [normalizeTeacher(data.data)], meta: null }
    }

    return { data: [], meta: null }
}

export async function getTeacher(id: number): Promise<Teacher> {
    const { data } = await api.get(`/teachers/${id}`)
    return normalizeTeacher(data?.data ?? data)
}

export async function createTeacher(payload: any): Promise<Teacher> {
    const { data } = await api.post("/teachers", coerceNullish(payload))
    return normalizeTeacher(data?.data ?? data)
}

export async function updateTeacher(id: number, payload: any): Promise<Teacher> {
    const { data } = await api.put(`/teachers/${id}`, coerceNullish(payload))
    return normalizeTeacher(data?.data ?? data)
}

export async function deleteTeacher(id: number) {
    const { data } = await api.delete(`/teachers/${id}`)
    return data
}
