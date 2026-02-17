import api from "./api"

export type LibrarySubCategory = {
    id: number
    institute_id?: number
    category_id: number
    name: string
    order?: number
    is_active?: boolean
    category?: { id: number; name: string }
}

export async function listLibrarySubCategories(params?: {
    per_page?: number
    page?: number
    search?: string
    category_id?: number
    institute_id?: number // للسوبر أدمن
}) {
    const { data } = await api.get("/library/sub-categories", { params })
    return data
}

export async function createLibrarySubCategory(payload: {
    category_id: number
    name: string
    order?: number
    is_active?: boolean
    institute_id?: number // للسوبر أدمن
}) {
    const { data } = await api.post("/library/sub-categories", payload)
    return data
}

export async function updateLibrarySubCategory(id: number, payload: Partial<{
    category_id: number
    name: string
    order: number
    is_active: boolean
}>) {
    const { data } = await api.put(`/library/sub-categories/${id}`, payload)
    return data
}

export async function deleteLibrarySubCategory(id: number) {
    const { data } = await api.delete(`/library/sub-categories/${id}`)
    return data
}
