import api from "@/services/api"

export type NotificationItem = {
  id: number
  message: string
  created_at: string
  read_at?: string | null
  type?: string | null
  [k: string]: any
}

function normalizeNotification(raw: any): NotificationItem {
  return {
    ...raw,
    id: Number(raw?.id ?? raw?.notification_id ?? 0),
    message: String(raw?.message ?? raw?.title ?? raw?.body ?? raw?.text ?? "").trim(),
    created_at: String(raw?.created_at ?? raw?.date ?? raw?.time ?? ""),
    read_at: raw?.read_at ?? (raw?.is_read ? String(raw?.created_at ?? "") : null),
    type: raw?.type ?? raw?.category ?? raw?.kind ?? null,
  }
}

export async function listNotifications(limit = 5): Promise<NotificationItem[]> {
  const endpoints = ["/notifications", "/parent/notifications"]

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint, { params: { per_page: limit, limit } })
      const source =
        Array.isArray(data) ? data :
        Array.isArray(data?.data) ? data.data :
        Array.isArray(data?.notifications) ? data.notifications :
        Array.isArray(data?.items) ? data.items :
        []

      const normalized = source
        .map(normalizeNotification)
        .filter((item) => Number.isFinite(item.id) && item.id > 0)

      return normalized.slice(0, limit)
    } catch {
      continue
    }
  }

  return []
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const endpoints = [
    { method: "post" as const, url: `/notifications/${id}/read` },
    { method: "post" as const, url: `/notifications/${id}/mark-as-read` },
    { method: "patch" as const, url: `/notifications/${id}/read` },
    { method: "patch" as const, url: `/notifications/${id}` },
    { method: "post" as const, url: `/parent/notifications/${id}/read` },
  ]

  for (const endpoint of endpoints) {
    try {
      if (endpoint.method === "post") {
        await api.post(endpoint.url)
      } else {
        await api.patch(endpoint.url, { read: true })
      }
      return
    } catch {
      continue
    }
  }

  throw new Error("Unable to mark notification as read")
}
