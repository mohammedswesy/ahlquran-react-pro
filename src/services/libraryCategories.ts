import api from "./api"

export type LibraryCategory = {
    id: number
    institute_id: number
    name: string
    order?: number
    is_active?: boolean
    created_at?: string
    updated_at?: string
}

export async function listLibraryCategories(params?: {
    per_page?: number
    page?: number
    search?: string
    institute_id?: number // للسوبر أدمن
}) {
    const { data } = await api.get("/library/categories", { params })
    return data
}

export async function createLibraryCategory(payload: {
    name: string
    order?: number
    is_active?: boolean
    institute_id?: number // للسوبر أدمن
}) {
    const { data } = await api.post("/library/categories", payload)
    return data
}

export async function updateLibraryCategory(id: number, payload: Partial<{
    name: string
    order: number
    is_active: boolean
}>) {
    const { data } = await api.put(`/library/categories/${id}`, payload)
    return data
}

export async function deleteLibraryCategory(id: number) {
    const { data } = await api.delete(`/library/categories/${id}`)
    return data
}
