// src/services/circles.ts
import api from "./api"
import { normalizeId } from "@/lib/normalize"

export type Circle = {
    id: number
    name: string
    institute_id?: number | null
    type?: string | null
    start_time?: string | null
    end_time?: string | null
    schedule?: any
    level?: number | null
    status?: number | null

    institute?: { id: number; name: string } | null
    students_count?: number
    teachers_count?: number
    [k: string]: any
}


function normalizeCircle(raw: any): Circle {
    const x = normalizeId(raw)

    let schedule: any = null

    if (x.schedule) {
        if (typeof x.schedule === "string") {
            try {
                schedule = JSON.parse(x.schedule)
            } catch {
                schedule = null
            }
        } else {
            schedule = x.schedule
        }
    }

    return {
        ...x,
        schedule,
    } as Circle
}



export type ListCirclesParams = {
    page?: number
    per_page?: number
    institute_id?: number
    type?: string
    search?: string
}
export type Paginated<T> = {
    data: T[]
    meta?: {
        current_page: number
        last_page: number
        per_page?: number
        total?: number
    }
}


export async function listCircles(params?: ListCirclesParams): Promise<Paginated<Circle>> {
    const { data } = await api.get("/circles", { params })

    // Laravel Resource Collection غالباً: { data: [], meta: {} }
    if (Array.isArray(data?.data)) {
        return { ...data, data: data.data.map(normalizeCircle) }
    }


    if (Array.isArray(data)) {
        return {
            data: data.map(normalizeCircle),
            meta: undefined,
        }
    }

    // fallback
    return {
        data: Array.isArray(data?.data) ? data.data.map(normalizeCircle) : [],
        meta: data?.meta,
    }
}


export async function listCirclesByInstitute(institute_id: number): Promise<Circle[]> {
    const { data } = await api.get("/circles", { params: { institute_id, per_page: 1000 } })

    const src =
        Array.isArray(data?.data) ? data.data :
            Array.isArray(data) ? data :
                []

    return src.map(normalizeCircle)
}

export async function getCircle(id: number): Promise<Circle> {
    const { data } = await api.get(`/circles/${id}`)
    return normalizeCircle(data?.data ?? data)
}

export async function createCircle(payload: any): Promise<Circle> {
    const { data } = await api.post(`/circles`, payload)
    return normalizeCircle(data?.data ?? data)
}

export async function updateCircle(id: number, payload: any): Promise<Circle> {
    const { data } = await api.put(`/circles/${id}`, payload)
    return normalizeCircle(data?.data ?? data)
}

export async function deleteCircle(id: number) {
    const { data } = await api.delete(`/circles/${id}`)
    return data
}

export async function assignCircle(
    id: number,
    payload: { teacher_id?: number | null; student_ids?: number[] }
) {
    const { data } = await api.post(`/circles/${id}/assign`, payload)
    return data
}

// ===== Teacher Circles =====
export type TeacherCircle = {
    id: number
    name: string
    institute_id?: number | null
    institute_name?: string | null
    students_count?: number
    schedule?: any
    [k: string]: any
}

function normalizeTeacherCircle(raw: any): TeacherCircle {
    const x = normalizeId(raw)
    return {
        ...x,
        institute_name: x.institute_name ?? x.institute?.name ?? null,
        students_count: Number.isFinite(Number(x.students_count)) ? Number(x.students_count) : 0,
        schedule: x.schedule ?? null,
    }
}


export async function listMyCircles(): Promise<TeacherCircle[]> {
    const { data } = await api.get("/teacher/circles")

    const src =
        Array.isArray(data?.circles) ? data.circles :
            Array.isArray(data?.data) ? data.data :
                Array.isArray(data) ? data :
                    []

    return src.map(normalizeTeacherCircle)
}
