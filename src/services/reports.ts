import api from "@/services/api"

function extractFilename(contentDisposition?: string | null, fallback = "monthly-report.pdf"): string {
  if (!contentDisposition) return fallback
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1])
    } catch {
      return utfMatch[1]
    }
  }

  const asciiMatch = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return asciiMatch?.[1] || fallback
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

export async function downloadStudentMonthlyReport(month: string, studentId?: number | null) {
  const monthKey = String(month || "").trim()
  if (!monthKey) throw new Error("Month is required")

  const requests: Array<() => Promise<{ blob: Blob; filename: string }>> = [
    async () => {
      const response = await api.get(`/student/report/${monthKey}`, {
        params: studentId ? { student_id: Number(studentId) } : undefined,
        responseType: "blob",
      })
      const filename = extractFilename(response.headers?.["content-disposition"], `student-report-${monthKey}.pdf`)
      return { blob: response.data as Blob, filename }
    },
  ]

  if (studentId) {
    requests.push(async () => {
      const response = await api.get(`/students/${Number(studentId)}/report/${monthKey}`, {
        responseType: "blob",
      })
      const filename = extractFilename(response.headers?.["content-disposition"], `student-${studentId}-report-${monthKey}.pdf`)
      return { blob: response.data as Blob, filename }
    })
  }

  let lastError: unknown = null
  for (const request of requests) {
    try {
      const result = await request()
      triggerBlobDownload(result.blob, result.filename)
      return
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error("Failed to download report")
}
