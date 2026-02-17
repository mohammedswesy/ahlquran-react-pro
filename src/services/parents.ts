import api from "./api"
import { normalizeId } from "@/lib/normalize"

export type ParentRow = {
    id: number
    relation_type?: string | null
    children_count?: number
    user?: { id: number; name?: string; email?: string; mobile?: string }
    students?: Array<{ id: number; name?: string | null }>
    [k: string]: any
}

function norm(raw: any): ParentRow {
    return normalizeId(raw) as ParentRow
}

export async function fetchParents(params?: { search?: string; page?: number; per_page?: number }) {
    const { data } = await api.get("/parents", { params })
    const src = data?.data ?? data
    const rows = Array.isArray(src) ? src.map(norm) : []
    const meta = data?.meta ?? data?.pagination ?? {}
    return { data: rows, meta }
}

export async function getParent(id: number): Promise<ParentRow> {
    const { data } = await api.get(`/parents/${id}`)
    const src = data?.data ?? data
    return norm(src)
}

export async function createParent(payload: {
    name: string
    email?: string | null
    mobile?: string | null
    password: string
    relation_type: string
}) {
    const { data } = await api.post("/parents", payload)
    const src = data?.data ?? data
    return norm(src)
}

export async function updateParent(id: number, payload: {
    name?: string
    email?: string | null
    mobile?: string | null
    password?: string | null
    relation_type?: string
}) {
    const { data } = await api.put(`/parents/${id}`, payload)
    const src = data?.data ?? data
    return norm(src)
}

/** ربط / تحديث أبناء ولي الأمر */
export async function linkParentChildren(parentId: number, studentIds: number[]) {
    const { data } = await api.post(`/parents/${parentId}/children`, {
        student_ids: studentIds,
    })
    return data
}

/** حذف ولي الأمر */
export async function deleteParent(parentId: number) {
    await api.delete(`/parents/${parentId}`)
}
