// src/services/circles.ts
import api from "./api"
import { normalizeId } from "@/lib/normalize"
import {
    getCircleTrackDescription,
    getCircleTrackName,
    normalizeCircleTrack,
    type CircleTrack,
} from "@/lib/circleTracks"

export type Circle = {
    id: number
    name: string
    institute_id?: number | null
    type?: string | null
    track?: CircleTrack | null
    track_name?: string | null
    track_description?: string | null
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
    const track = normalizeCircleTrack(x.track ?? x.track_key ?? x.educational_track)

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
        track,
        track_name: x.track_name ?? getCircleTrackName(track),
        track_description: x.track_description ?? getCircleTrackDescription(track),
        schedule,
    } as Circle
}



export type ListCirclesParams = {
    page?: number
    per_page?: number
    institute_id?: number
    type?: string
    track?: CircleTrack
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

export type StudentCircle = {
    id: number
    name: string
    teacher_name?: string | null
    schedule?: string | null
    [k: string]: any
}

export type CircleStudent = {
    id: number
    name: string
    mobile?: string | null
    email?: string | null
    status?: string | null
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

export async function getMyCircle(id: number): Promise<TeacherCircle> {
    const { data } = await api.get(`/teacher/circles/${id}`)
    return normalizeTeacherCircle(data?.data ?? data)
}

export async function listMyCircleStudents(circleId: number): Promise<CircleStudent[]> {
    const { data } = await api.get(`/teacher/circles/${circleId}/students`)
    const src = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return src.map((x: any) => {
        const n = normalizeId(x)
        return {
            ...n,
            id: Number(n.id),
            name: String(n.name ?? "").trim(),
            mobile: n.mobile ?? n.phone ?? null,
            email: n.email ?? null,
            status: n.status ?? null,
        }
    })
}

export async function listCircleStudents(circleId: number): Promise<CircleStudent[]> {
    try {
        const { data } = await api.get(`/circles/${circleId}/students`)
        const src = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
        return src.map((x: any) => {
            const n = normalizeId(x)
            return {
                ...n,
                id: Number(n.id),
                name: String(n.name ?? n.student_name ?? "").trim(),
                mobile: n.mobile ?? n.phone ?? null,
                email: n.email ?? null,
                status: n.status ?? null,
            }
        })
    } catch {
        return listMyCircleStudents(circleId)
    }
}

export async function listStudentCircles(): Promise<StudentCircle[]> {
    const { data } = await api.get("/student/circles")
    const src = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return src.map((x: any) => {
        const n = normalizeId(x)
        const schedule = typeof n.schedule === "string"
            ? n.schedule
            : n.schedule?.text ?? n.schedule_label ?? null
        return {
            ...n,
            id: Number(n.id),
            name: String(n.name ?? "").trim(),
            teacher_name: n.teacher_name ?? n.teacher?.name ?? null,
            schedule,
        }
    })
}
