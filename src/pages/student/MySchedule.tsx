// src/pages/student/MySchedule.tsx
import { useEffect, useState } from "react"
import api from "@/services/api"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type CircleRow = {
    id: number
    name: string
    day_of_week?: number | null
    start_time?: string | null
    end_time?: string | null
    institute?: { id: number; name: string }
}

type StudentInfo = {
    id: number
    name: string | null
    code?: string | null
    level?: string | null
}

type SchedulePayload = {
    student: StudentInfo
    circles: CircleRow[]
}

// خريطة لأيام الأسبوع (لو عمود day_of_week عندك 1–7)
const DAY_LABELS: Record<number, string> = {
    1: "السبت",
    2: "الأحد",
    3: "الاثنين",
    4: "الثلاثاء",
    5: "الأربعاء",
    6: "الخميس",
    7: "الجمعة",
}

export default function MySchedule() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<SchedulePayload | null>(null)

    async function load() {
        try {
            setLoading(true)
            const res = await api.get("/student/schedule")
            setData(res.data?.data as SchedulePayload)
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "تعذر تحميل الجدول")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    if (loading && !data) {
        return (
            <div className="p-4" dir="rtl">
                جاري تحميل الجدول…
            </div>
        )
    }

    if (!data) {
        return (
            <div className="p-4 space-y-3" dir="rtl">
                <div className="text-red-600 font-medium">تعذر تحميل الجدول الدراسي.</div>
                <Button variant="outline" onClick={load}>
                    إعادة المحاولة
                </Button>
            </div>
        )
    }

    const { student, circles } = data

    return (
        <div className="space-y-6" dir="rtl">
            {/* العنوان + معلومات الطالب المختصرة */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold">جدولي الدراسي</h1>
                    <div className="text-sm text-gray-600 mt-1">
                        {student.name && (
                            <>
                                الطالب: <span className="font-semibold">{student.name}</span>
                            </>
                        )}
                        {student.code && (
                            <span className="ms-3">
                                رقم الطالب: <span className="font-mono">{student.code}</span>
                            </span>
                        )}
                        {student.level && (
                            <span className="ms-3">
                                المستوى: <span>{student.level}</span>
                            </span>
                        )}
                    </div>
                </div>
                <Button size="sm" variant="outline" onClick={load}>
                    تحديث
                </Button>
            </div>

            {/* جدول الحلقات */}
            <Card>
                <CardHeader>
                    <div className="text-sm font-semibold">الحلقات المسجّل بها</div>
                </CardHeader>
                <CardContent>
                    {circles.length === 0 ? (
                        <div className="text-sm text-gray-500">
                            لا توجد حلقات مسجّلة في جدولك.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border px-3 py-2 text-right">#</th>
                                        <th className="border px-3 py-2 text-right">اسم الحلقة</th>
                                        <th className="border px-3 py-2 text-right">المعهد</th>
                                        <th className="border px-3 py-2 text-right">اليوم</th>
                                        <th className="border px-3 py-2 text-right">الوقت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {circles.map((c, idx) => {
                                        const dayText =
                                            c.day_of_week != null
                                                ? DAY_LABELS[c.day_of_week] || String(c.day_of_week)
                                                : "—"

                                        const timeText =
                                            c.start_time && c.end_time
                                                ? `${c.start_time} - ${c.end_time}`
                                                : c.start_time
                                                    ? c.start_time
                                                    : "—"

                                        return (
                                            <tr key={c.id}>
                                                <td className="border px-3 py-1">{idx + 1}</td>
                                                <td className="border px-3 py-1">{c.name}</td>
                                                <td className="border px-3 py-1">
                                                    {c.institute?.name || "—"}
                                                </td>
                                                <td className="border px-3 py-1">{dayText}</td>
                                                <td className="border px-3 py-1">{timeText}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
