export function normalizeId<T extends Record<string, any>>(item: T): T & { id: number } {
    if (typeof item?.id === "number") return item as T & { id: number }
    const key = Object.keys(item || {}).find(
        k => k.endsWith("_id") && typeof item[k] === "number"
    )
    if (key) return { ...item, id: item[key] as number }
    return item as T & { id: number }
}
