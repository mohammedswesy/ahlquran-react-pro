import api from "./api"
import { normalizeId } from "@/lib/normalize"

export type EmployeeRole = "admin" | "teacher" | "staff" | string

export type Employee = {
    id: number
    name: string
    email?: string | null
    mobile?: string | null
    phone?: string | null 
    job_title?: string | null
    base_salary?: number | null
    allowances?: number | null
    deductions?: number | null
    role?: EmployeeRole | null
    hire_date?: string | null
    institute_id?: number | null
    status?: number | null
    user_id?: number | null
    circles?: Array<{ id: number; name: string }> | null
    circle_ids?: number[] | null
    institute?: { id: number; name: string }
    [k: string]: any
}


export type ListParams = {
    page?: number
    per_page?: number
    search?: string
    role?: string
    institute_id?: number
}

export type Paginated<T> = { data: T[]; meta?: any;[k: string]: any }

function normalizeDate(d: any): string | null | undefined {
    if (!d) return d
    try {
        const dt = new Date(d)
        if (Number.isNaN(dt.getTime())) return String(d)
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
    } catch { return String(d) }
}

function normalizeEmployee(raw: any): Employee {
    const x = normalizeId(raw)
    return {
        ...x,
        base_salary: x.base_salary == null ? null : Number(x.base_salary),
        allowances: x.allowances == null ? null : Number(x.allowances),
        deductions: x.deductions == null ? null : Number(x.deductions),
        user_id: x.user_id == null ? null : Number(x.user_id),
        circles: Array.isArray(x.circles)
            ? x.circles.map((circle: any) => ({ id: Number(circle?.id ?? 0), name: String(circle?.name ?? "").trim() })).filter((circle: any) => circle.id > 0 && circle.name)
            : null,
        circle_ids: Array.isArray(x.circle_ids) ? x.circle_ids.map(Number).filter(Number.isFinite) : null,
        hire_date: normalizeDate(x.hire_date),
    } as Employee
}

function coerceNullish<T extends Record<string, any>>(o: T): T {
    const out: any = { ...o }
    for (const k in out) if (out[k] === "" || out[k] === undefined) out[k] = null
    return out
}

export async function listEmployees(params?: ListParams): Promise<Employee[] | Paginated<Employee>> {
    const { data } = await api.get("/employees", { params })
    if (Array.isArray(data)) return data.map(normalizeEmployee)
    if (Array.isArray(data?.data)) return { ...data, data: data.data.map(normalizeEmployee) }
    return data
}

export async function getEmployee(id: number): Promise<Employee> {
    const { data } = await api.get(`/employees/${id}`)
    return normalizeEmployee(data?.data ?? data)
}

export async function createEmployee(payload: any): Promise<Employee> {
    const { data } = await api.post("/employees", coerceNullish(payload))
    return normalizeEmployee(data?.data ?? data)
}

export async function updateEmployee(id: number, payload: any): Promise<Employee> {
    const { data } = await api.put(`/employees/${id}`, coerceNullish(payload))
    return normalizeEmployee(data?.data ?? data)
}

export async function deleteEmployee(id: number) {
    const { data } = await api.delete(`/employees/${id}`)
    return data
}
