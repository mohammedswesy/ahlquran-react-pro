export type CircleTrack = "iqra" | "rattel" | "safwa"

type CircleTrackMeta = {
  value: CircleTrack
  name: string
  description: string
  color: {
    background: string
    border: string
    text: string
  }
}

export const CIRCLE_TRACKS: Record<CircleTrack, CircleTrackMeta> = {
  iqra: {
    value: "iqra",
    name: "مشروع (اقرأ)",
    description: "القراءة العربية السليمة (الرشيدي).",
    color: {
      background: "#dbeafe",
      border: "#93c5fd",
      text: "#1d4ed8",
    },
  },
  rattel: {
    value: "rattel",
    name: "مشروع (رتل)",
    description: "ضبط قراءة القرآن الكريم نظراً (التجويد).",
    color: {
      background: "#dcfce7",
      border: "#86efac",
      text: "#15803d",
    },
  },
  safwa: {
    value: "safwa",
    name: "مشروع (الصفوة)",
    description: "تحفيظ القرآن الكريم والإجازة.",
    color: {
      background: "#fef3c7",
      border: "#fcd34d",
      text: "#b45309",
    },
  },
}

export const CIRCLE_TRACK_OPTIONS = Object.values(CIRCLE_TRACKS)

export function normalizeCircleTrack(value: unknown): CircleTrack | null {
  const normalized = String(value ?? "").trim().toLowerCase()
  if (normalized === "iqra" || normalized === "rattel" || normalized === "safwa") {
    return normalized
  }
  return null
}

export function getCircleTrackMeta(track: unknown): CircleTrackMeta | null {
  const normalized = normalizeCircleTrack(track)
  return normalized ? CIRCLE_TRACKS[normalized] : null
}

export function getCircleTrackName(track: unknown): string {
  return getCircleTrackMeta(track)?.name ?? "غير محدد"
}

export function getCircleTrackDescription(track: unknown): string {
  return getCircleTrackMeta(track)?.description ?? ""
}

export function getCircleTrackColor(track: unknown) {
  return (
    getCircleTrackMeta(track)?.color ?? {
      background: "#f8fafc",
      border: "#cbd5e1",
      text: "#475569",
    }
  )
}