import api from "./api"

export type LibraryItemType = "pdf" | "audio" | "video" | "document"

export type LibraryItem = {
    id: number
    institute_id: number
    category_id: number
    sub_category_id?: number | null
    title: string
    description?: string | null
    type: LibraryItemType
    file_path?: string | null
    external_url?: string | null
    is_active?: boolean
    category?: { id: number; name: string }
    subCategory?: { id: number; name: string }
}

export async function listLibraryItems(params?: {
    per_page?: number
    page?: number
    search?: string
    category_id?: number
    sub_category_id?: number
    type?: LibraryItemType
    institute_id?: number // للسوبر أدمن (لو فعلته بالباك)
}) {
    const { data } = await api.get("/library", { params })
    return data
}

export async function getLibraryItem(id: number) {
    const { data } = await api.get(`/library/${id}`)
    return data
}

//  upload via multipart
export async function createLibraryItem(form: FormData) {
    const { data } = await api.post("/library", form, {
        headers: { "Content-Type": "multipart/form-data" },
    })
    return data
}

export async function updateLibraryItem(id: number, form: FormData) {
    // كثير مشاريع Laravel ما بتقبل PUT مع multipart بسهولة
    // فبنستخدم POST + _method=PUT
    form.append("_method", "PUT")
    const { data } = await api.post(`/library/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
    })
    return data
}

export async function deleteLibraryItem(id: number) {
    const { data } = await api.delete(`/library/${id}`)
    return data
}
