import api from "@/services/api"

export type Level = {
  id: number
  name?: string | null
  name_ar?: string | null
  [k: string]: any
}

type LevelsResponse = {
  data?: any
  levels?: any[]
  [k: string]: any
}

function normalizeLevel(raw: any): Level {
  return {
    ...raw,
    id: Number(raw?.id ?? 0),
    name: raw?.name ?? null,
    name_ar: raw?.name_ar ?? raw?.arabic_name ?? null,
  }
}

export async function listLevels(): Promise<Level[]> {
  const { data } = await api.get<LevelsResponse | any[]>("/levels")

  const source =
    Array.isArray(data) ? data :
    Array.isArray((data as any)?.data) ? (data as any).data :
    Array.isArray((data as any)?.levels) ? (data as any).levels :
    []

  return source
    .map(normalizeLevel)
    .filter((level) => Number.isFinite(level.id) && level.id > 0)
}
