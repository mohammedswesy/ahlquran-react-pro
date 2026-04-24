import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { PiCertificateBold, PiDownloadSimpleBold, PiExamBold } from "react-icons/pi"
import { downloadStudentCertificate, getStudentExams, type StudentExam } from "@/services/studentService"
import { getCircleTrackColor } from "@/lib/circleTracks"
import { useAuth } from "@/store/auth"

function ScoreBar({ score, maxScore, result }: { score: number; maxScore: number; result: "passed" | "failed" }) {
  const percent = maxScore > 0 ? Math.max(0, Math.min(100, Math.round((score / maxScore) * 100))) : 0
  const barColor = result === "passed" ? "#16a34a" : "#dc2626"
  const backgroundColor = result === "passed" ? "rgba(22,163,74,.12)" : "rgba(220,38,38,.12)"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold tabular-nums" style={{ color: barColor }}>
          {score}/{maxScore}
        </span>
        <span style={{ color: "var(--muted)" }}>{percent}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: backgroundColor }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: barColor }} />
      </div>
    </div>
  )
}

export default function MyExams() {
  const instituteName = useAuth((s) => s.instituteName)
  const brandName = useAuth((s) => s.brandName)
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [rows, setRows] = useState<StudentExam[]>([])

  useEffect(() => {
    ; (async () => {
      setLoading(true)
      try {
        setRows(await getStudentExams())
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "تعذر تحميل الاختبارات")
        setRows([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(() => {
    const total = rows.length
    const passed = rows.filter((row) => row.result === "passed").length
    const latest = rows[0] ?? null
    return { total, passed, latest }
  }, [rows])

  async function handleDownload(examId: number) {
    setDownloadingId(examId)
    try {
      await downloadStudentCertificate(examId)
      toast.success("تم بدء تحميل الشهادة")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "تعذر تحميل الشهادة")
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6">
        <Header title="اختباراتي وشهاداتي" subtitle="نتائجك الأخيرة وشهادات النجاح في مكان واحد" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="flex items-center justify-between gap-4 py-6">
              <div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>إجمالي الاختبارات</div>
                <div className="text-3xl font-black" style={{ color: "var(--text)" }}>{stats.total}</div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(0,61,53,.08)", color: "var(--brand)" }}>
                <PiExamBold size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between gap-4 py-6">
              <div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>الشهادات المتاحة</div>
                <div className="text-3xl font-black" style={{ color: "#16a34a" }}>{stats.passed}</div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(22,163,74,.1)", color: "#15803d" }}>
                <PiCertificateBold size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
            : rows.map((exam) => {
              const trackColor = getCircleTrackColor(exam.track)
              return (
                <Card key={exam.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{exam.exam_name}</CardTitle>
                        <CardDescription>
                          {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString("ar-SA") : "بدون تاريخ"}
                          {exam.circle_name ? ` • ${exam.circle_name}` : ""}
                        </CardDescription>
                      </div>
                      <Badge
                        style={{
                          background: trackColor.background,
                          borderColor: trackColor.border,
                          color: trackColor.text,
                        }}
                      >
                        {exam.track_name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScoreBar score={exam.score} maxScore={exam.max_score} result={exam.result} />

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <Badge variant={exam.result === "passed" ? "success" : "destructive"}>
                        {exam.result === "passed" ? "ناجح" : "غير مجتاز"}
                      </Badge>

                      <Button
                        onClick={() => handleDownload(exam.id)}
                        disabled={!exam.certificate_available || exam.result !== "passed" || downloadingId === exam.id}
                      >
                        <PiDownloadSimpleBold size={16} />
                        {downloadingId === exam.id ? "جاري التحميل..." : "تحميل الشهادة"}
                      </Button>
                    </div>

                    {exam.notes && (
                      <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(0,61,53,.05)", color: "var(--text)" }}>
                        {exam.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
        </div>

        {!loading && rows.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="text-lg font-bold" style={{ color: "var(--text)" }}>لا توجد اختبارات حتى الآن</div>
              <div className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                ستظهر اختباراتك وشهاداتك هنا فور اعتمادها من المعهد.
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pb-6 text-center text-xs" style={{ color: "var(--muted)" }}>
          {instituteName || brandName}
        </div>
      </div>
    </AppLayout>
  )
}
