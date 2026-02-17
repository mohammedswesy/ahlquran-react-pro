// يَخدم AdminDashboard ويستوعب أكثر من شكل استجابة من الـAPI

import api from "@/services/api"

export type DashboardStats = {
    institutes?: number
    parents?: number
    students?: number
    teachers?: number
    circles?: number
    [k: string]: any
}

export type AttendancePoint = {
    date: string
    present: number
    absent: number
    late: number
    excused: number
}

export type DashboardResponse = {
    stats: DashboardStats
    recentInstitutes: any[]
    attendance_week: AttendancePoint[]
}

/** تطبيع أشكال مختلفة للاستجابة */
function normalize(res: any): DashboardResponse {
    const stats = res?.stats ?? res?.totals ?? {}
    const recentInstitutes =
        Array.isArray(res?.recentInstitutes)
            ? res.recentInstitutes
            : Array.isArray(res?.recent_institutes)
                ? res.recent_institutes
                : []

    const rawA =
        Array.isArray(res?.attendance_week)
            ? res.attendance_week
            : Array.isArray(res?.attendance?.week)
                ? res.attendance.week
                : []

    const attendance_week: AttendancePoint[] = rawA.map((p: any) => ({
        date: String(p?.date ?? p?.day ?? ""),
        present: Number(p?.present ?? p?.p ?? 0),
        absent: Number(p?.absent ?? p?.a ?? 0),
        late: Number(p?.late ?? p?.l ?? 0),
        excused: Number(p?.excused ?? p?.e ?? 0),
    }))

    return { stats, recentInstitutes, attendance_week }
}

/** الاتصال الفعلي بالـAPI */
export async function fetchDashboard(): Promise<DashboardResponse> {
    const { data } = await api.get("/admin/dashboard")
    // يدعم أن ترجع الاستجابة مباشرة أو داخل {data}
    const payload = data?.data ?? data
    return normalize(payload)
}
