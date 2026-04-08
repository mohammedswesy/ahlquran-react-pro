// src/services/attendances.ts
import api from "./api"
import { normalizeId } from "@/lib/normalize"

/* ================= Types ================= */
export type AttendanceStatus = "present" | "absent" | "late" | "excused"

export type Attendance = {
    id: number
    date: string // YYYY-MM-DD
    start_time?: string | null // HH:MM
    end_time?: string | null
    status?: AttendanceStatus | null
    notes?: string | null

    student_id: number
    circle_id?: number | null
    institute_id?: number | null

    student?: { id: number; name: string }
    circle?: { id: number; name: string }
    institute?: { id: number; name: string }

    [k: string]: any
}

export type ListParams = {
    page?: number
    per_page?: number
    search?: string
    q?: string
    date_from?: string
    date_to?: string
    status?: AttendanceStatus
    institute_id?: number
    circle_id?: number
    student_id?: number
}


export type Paginated<T> = { data: T[]; meta?: any;[k: string]: any }

export type AttendanceAnalytics = {
    totals?: {
        total?: number
        present?: number
        absent?: number
        late?: number
        excused?: number
        present_rate?: number
        [k: string]: any
    }
    best_circle?: {
        circle_id: number
        circle_name: string
        total: number
        present_rate: number
        [k: string]: any
    } | null
    worst_circle?: {
        circle_id: number
        circle_name: string
        total: number
        present_rate: number
        [k: string]: any
    } | null
    by_circle?: Array<{
        circle_id: number
        circle_name: string
        total: number
        present: number
        absent: number
        present_rate: number
        [k: string]: any
    }>
    top_absences?: Array<{
        user_id: number
        user_name: string
        absences: number
        [k: string]: any
    }>
    [k: string]: any
}

/* ================= Helpers ================= */
function normalizeTime(t: any): string | null {
    if (!t) return null
    const s = String(t).slice(0, 5)
    return /^\d{2}:\d{2}$/.test(s) ? s : null
}

function normalizeAttendance(raw: any): Attendance {
    const x = normalizeId(raw)
    return {
        ...x,
        start_time: normalizeTime(x.start_time),
        end_time: normalizeTime(x.end_time),
    } as Attendance
}

function coerceNullish<T extends Record<string, any>>(o: T): T {
    const out: any = { ...o }
    for (const k in out) if (out[k] === "" || out[k] === undefined) out[k] = null
    return out
}

/* ================= Admin / Sub-admin ================= */
/** GET /attendance */
/** GET /attendance */
export async function listAttendances(params?: ListParams): Promise<Paginated<Attendance> | Attendance[]> {
    const { data } = await api.get("/attendance", { params })

    // Laravel paginator shape: { data: [], current_page, last_page, per_page, total, ... }
    if (Array.isArray((data as any)?.data) && typeof (data as any)?.current_page === "number") {
        const d = data as any
        return {
            data: d.data.map(normalizeAttendance),
            meta: {
                current_page: d.current_page,
                last_page: d.last_page,
                per_page: d.per_page,
                total: d.total,
                from: d.from,
                to: d.to,
            },
        }
    }

    // Resource Collection
    if (Array.isArray((data as any)?.data)) return { ...(data as any), data: (data as any).data.map(normalizeAttendance) }

    // Array direct
    if (Array.isArray(data)) return (data as any[]).map(normalizeAttendance)

    return data
}


/** GET /attendance/summary */
export async function attendanceSummary(params?: ListParams): Promise<any[]> {
    const { data } = await api.get("/attendance/summary", { params })
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
}

/** GET /attendance/export (CSV) */
export async function exportAttendancesCSV(params?: ListParams): Promise<Blob> {
    const res = await api.get("/attendance/export", {
        params,
        responseType: "blob",
    })
    return res.data as Blob
}


/** PUT /attendance/{id} */
export async function updateAttendance(id: number, payload: Partial<Attendance>): Promise<Attendance> {
    const { data } = await api.put(`/attendance/${id}`, coerceNullish(payload))
    return normalizeAttendance(data?.data ?? data)
}

/** DELETE /attendance/{id} */
export async function deleteAttendance(id: number) {
    const { data } = await api.delete(`/attendance/${id}`)
    return data
}

export async function attendanceAnalytics(params?: ListParams) {
    const { data } = await api.get("/attendance/analytics", { params })
    return data as AttendanceAnalytics
}


export async function exportAttendancesPDF(params?: ListParams): Promise<Blob> {
    const res = await api.get("/attendance/export-pdf", {
        params,
        responseType: "blob",
    })
    return res.data as Blob
}

/* ================= Teacher ================= */
/**
 *  POST /attendance  (سجل واحد)
 * 
 */
export async function createAttendance(payload: {
    date: string
    circle_id: number
    student_id: number
    status: AttendanceStatus
    notes?: string | null
    start_time?: string | null
    end_time?: string | null
    institute_id?: number | null
}): Promise<Attendance> {
    const { data } = await api.post("/attendance", coerceNullish(payload))
    return normalizeAttendance(data?.data ?? data)
}

/**
 * 
 *
 */
export async function saveAttendance(payload: {
    date: string
    circle_id: number
    records: Array<{ student_id: number; status: AttendanceStatus; notes?: string | null }>
}) {
    const { date, circle_id, records } = payload

    // sequential (أضمن وأخف على السيرفر)
    for (const r of records) {
        await createAttendance({
            date,
            circle_id,
            student_id: r.student_id,
            status: r.status,
            notes: r.notes ?? null,
        })
    }

    return { message: "saved" }
}

export async function submitAttendance(payload: {
    date: string
    circle_id: number
    records: Array<{ student_id: number; status: AttendanceStatus; notes?: string | null }>
}) {
    return saveAttendance(payload)
}

export async function submitBulkAttendance(payload: {
    date: string
    circle_id: number
    records: Array<{ student_id: number; status: AttendanceStatus; notes?: string | null }>
}) {
    const { data } = await api.post("/attendance/bulk", coerceNullish(payload))
    return data
}

export async function listAttendanceByCircleAndDate(params: {
    circle_id: number
    date: string
}) {
    const { data } = await api.get("/attendance", {
        params: {
            circle_id: params.circle_id,
            date_from: params.date,
            date_to: params.date,
            per_page: 1000,
        },
    })

    const src =
        Array.isArray(data?.data) ? data.data :
            Array.isArray(data?.data?.data) ? data.data.data :
                Array.isArray(data) ? data : []

    return src
        .map((raw: any) => normalizeAttendance(raw))
        .filter((r: Attendance) => Number(r.student_id) > 0)
        .map((r: Attendance) => ({
            student_id: Number(r.student_id),
            status: (r.status ?? "present") as AttendanceStatus,
            notes: r.notes ?? null,
        }))
}
