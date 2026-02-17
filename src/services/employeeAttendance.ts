import { normalizeId } from "@/lib/normalize"

export type EmployeeAttendanceStatus = "present" | "absent" | "late" | "excused"

export type EmployeeAttendance = {
    id: number
    date: string // YYYY-MM-DD
    employee_name: string
    start_time?: string | null // HH:MM
    end_time?: string | null
    status: EmployeeAttendanceStatus
    notes?: string | null
    created_at?: string
    updated_at?: string
}

const LS_KEY = "qc_employee_attendance_v1"

function nowIso() {
    return new Date().toISOString()
}

function safeParse<T>(raw: string | null): T | null {
    try {
        if (!raw) return null
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

function readAll(): EmployeeAttendance[] {
    const data = safeParse<EmployeeAttendance[]>(localStorage.getItem(LS_KEY))
    return Array.isArray(data) ? data.map(normalizeRow) : []
}

function writeAll(rows: EmployeeAttendance[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(rows))
}

function normalizeRow(raw: any): EmployeeAttendance {
    const x = normalizeId(raw)
    return {
        id: Number(x.id),
        date: String(x.date ?? ""),
        employee_name: String(x.employee_name ?? ""),
        start_time: x.start_time ?? null,
        end_time: x.end_time ?? null,
        status: (x.status ?? "present") as EmployeeAttendanceStatus,
        notes: x.notes ?? null,
        created_at: x.created_at ?? null,
        updated_at: x.updated_at ?? null,
    }
}

export type ListParams = {
    search?: string
    status?: EmployeeAttendanceStatus | ""
    date_from?: string
    date_to?: string
    page?: number
    per_page?: number
}

export type Paginated<T> = { data: T[]; meta: { current_page: number; last_page: number; total: number } }

export async function listEmployeeAttendances(params?: ListParams): Promise<Paginated<EmployeeAttendance>> {
    const all = readAll()

    const search = (params?.search ?? "").trim().toLowerCase()
    const status = params?.status ?? ""
    const dateFrom = params?.date_from ? new Date(params.date_from) : null
    const dateTo = params?.date_to ? new Date(params.date_to) : null

    let filtered = all

    if (search) {
        filtered = filtered.filter((r) => r.employee_name.toLowerCase().includes(search))
    }
    if (status) {
        filtered = filtered.filter((r) => r.status === status)
    }
    if (dateFrom) {
        filtered = filtered.filter((r) => new Date(r.date) >= dateFrom)
    }
    if (dateTo) {
        filtered = filtered.filter((r) => new Date(r.date) <= dateTo)
    }

    // أحدث للأقدم
    filtered = filtered.sort((a, b) => {
        const ad = a.date + (a.start_time ?? "")
        const bd = b.date + (b.start_time ?? "")
        return bd.localeCompare(ad)
    })

    const page = Math.max(1, Number(params?.page ?? 1))
    const perPage = Math.max(1, Number(params?.per_page ?? 10))

    const total = filtered.length
    const lastPage = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(page, lastPage)

    const start = (safePage - 1) * perPage
    const data = filtered.slice(start, start + perPage)

    return {
        data,
        meta: { current_page: safePage, last_page: lastPage, total },
    }
}

export async function createEmployeeAttendance(payload: Partial<EmployeeAttendance>): Promise<EmployeeAttendance> {
    const all = readAll()
    const nextId = all.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1

    const row: EmployeeAttendance = normalizeRow({
        id: nextId,
        date: payload.date ?? new Date().toISOString().slice(0, 10),
        employee_name: payload.employee_name ?? "",
        start_time: payload.start_time ?? null,
        end_time: payload.end_time ?? null,
        status: payload.status ?? "present",
        notes: payload.notes ?? null,
        created_at: nowIso(),
        updated_at: nowIso(),
    })

    writeAll([row, ...all])
    return row
}

export async function updateEmployeeAttendance(id: number, payload: Partial<EmployeeAttendance>): Promise<EmployeeAttendance> {
    const all = readAll()
    const idx = all.findIndex((r) => Number(r.id) === Number(id))
    if (idx < 0) throw new Error("Not found")

    const updated = normalizeRow({
        ...all[idx],
        ...payload,
        id: all[idx].id,
        updated_at: nowIso(),
    })

    const next = [...all]
    next[idx] = updated
    writeAll(next)
    return updated
}

export async function deleteEmployeeAttendance(id: number) {
    const all = readAll()
    writeAll(all.filter((r) => Number(r.id) !== Number(id)))
    return true
}
