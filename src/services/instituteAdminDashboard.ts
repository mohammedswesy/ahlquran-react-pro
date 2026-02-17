import api from "./api"

export type InstituteDashboardRow = {
    id: number
    name: string
    country_id: number | null
    city_id: number | null
    organization_id: number | null
    status: number
    employees_count?: number
    circles_count?: number
    country?: { id: number; name: string }
    city?: { id: number; name: string }
    organization?: { id: number; name: string }
}

export type InstituteAdminDashboardStats = {
    institutes_count: number
    circles_count: number
    students_count: number
    teachers_count: number
}

export type InstituteAdminDashboardResponse = {
    stats: InstituteAdminDashboardStats
    institutes: InstituteDashboardRow[]
}

export async function fetchInstituteAdminDashboard(): Promise<InstituteAdminDashboardResponse> {
    const { data } = await api.get("/dashboard/institute-admin")
    return data
}
