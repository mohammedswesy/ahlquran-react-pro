import api from "./api"
import { normalizeId } from "@/lib/normalize"
import type { BaseRow } from "@/types/base"

export async function fetchCountries(): Promise<BaseRow[]> {
    const { data } = await api.get("/countries")
    return (Array.isArray(data) ? data : []).map((x: any) =>
        normalizeId({
            ...x,
            name: x.name,
        })
    )
}

export async function deleteCountry(id: number) {
    return api.delete(`/countries/${id}`)
}
