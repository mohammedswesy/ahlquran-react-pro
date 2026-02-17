// import { useEffect, useMemo, useRef, useState } from "react"
// import { useSearchParams } from "react-router-dom"
// import AppLayout from "@/layouts/AppLayout"
// import Header from "@/components/ui/Header"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { DataTable } from "@/components/ui/datatable"
// import { toast } from "sonner"
// import api from "@/services/api"

// import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
// import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
// import { ChevronsUpDown, Check, Download, Printer } from "lucide-react"
// import { cn } from "@/lib/utils"

// import { toCSV, toXLSX, printSection } from "@/lib/exporters"

// type ChildOpt = { id: number; name: string }
// type AttRow = { date: string; circle?: string | null; status: string }
// type AsRow = { date: string; kind?: string; title?: string | null; score?: number | null; grade?: string | null }

// export default function Reports() {
//     const [params, setParams] = useSearchParams()
//     const initialChild = Number(params.get("child_id") || 0)

//     // اختيارات الأبناء
//     const [children, setChildren] = useState<ChildOpt[]>([])
//     const [openChild, setOpenChild] = useState(false)
//     const [childId, setChildId] = useState<number | undefined>(initialChild || undefined)

//     // فلاتر التاريخ
//     const [dateFrom, setDateFrom] = useState<string>("")
//     const [dateTo, setDateTo] = useState<string>("")

//     // بيانات
//     const [attRows, setAttRows] = useState<AttRow[]>([])
//     const [asRows, setAsRows] = useState<AsRow[]>([])
//     const [loading, setLoading] = useState(true)

//     // مراجع للطباعة
//     const attPrintRef = useRef<HTMLDivElement>(null)
//     const asPrintRef = useRef<HTMLDivElement>(null)

//     // تحميل الأبناء
//     useEffect(() => {
//         (async () => {
//             try {
//                 const { data } = await api.get("/parent/children", { params: { per_page: 100 } })
//                 const src: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
//                 const opts: ChildOpt[] = src.map(x => ({ id: Number(x?.id ?? 0), name: String(x?.name ?? "").trim() }))
//                 setChildren(opts)
//                 if (initialChild && !opts.some(o => o.id === initialChild)) setChildId(undefined)
//             } catch {
//                 toast.info("سيتم ربط الأبناء لاحقًا")
//             }
//         })()
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [])

//     // تحميل التقارير
//     async function load() {
//         setLoading(true)
//         try {
//             const [att, as] = await Promise.all([
//                 api.get("/parent/reports/attendance", {
//                     params: { child_id: childId, date_from: dateFrom || undefined, date_to: dateTo || undefined, per_page: 100 },
//                 }),
//                 api.get("/parent/reports/assessments", {
//                     params: { child_id: childId, date_from: dateFrom || undefined, date_to: dateTo || undefined, per_page: 100 },
//                 }),
//             ])

//             const attSrc: any[] = Array.isArray(att.data?.data) ? att.data.data : Array.isArray(att.data) ? att.data : []
//             const asSrc: any[] = Array.isArray(as.data?.data) ? as.data.data : Array.isArray(as.data) ? as.data : []

//             setAttRows(attSrc.map(x => ({
//                 date: String(x?.date ?? x?.day ?? ""),
//                 circle: x?.circle ?? x?.circle_name ?? null,
//                 status: String(x?.status ?? ""),
//             })))

//             setAsRows(asSrc.map(x => ({
//                 date: String(x?.date ?? x?.created_at ?? ""),
//                 kind: x?.kind ?? x?.type ?? "",
//                 title: x?.title ?? null,
//                 score: x?.score ?? x?.mark ?? null,
//                 grade: x?.grade ?? null,
//             })))

//             const p = new URLSearchParams(params)
//             if (childId) p.set("child_id", String(childId)); else p.delete("child_id")
//             setParams(p, { replace: true })
//         } catch {
//             toast.info("سيتم ربط التقارير حال تجهيز الـ API")
//             setAttRows([]); setAsRows([])
//         } finally {
//             setLoading(false)
//         }
//     }

//     useEffect(() => {
//         const id = setTimeout(load, 250)
//         return () => clearTimeout(id)
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [childId, dateFrom, dateTo])

//     const childName = (id?: number) => children.find(c => c.id === id)?.name || "اختر الابن…"

//     const attCols = useMemo(() => [
//         { key: "date", label: "التاريخ" },
//         { key: "circle", label: "الحلقة" },
//         { key: "status", label: "الحالة" },
//     ], [])

//     const asCols = useMemo(() => [
//         { key: "date", label: "التاريخ" },
//         { key: "kind", label: "النوع" },
//         { key: "title", label: "العنوان" },
//         { key: "score", label: "الدرجة" },
//         { key: "grade", label: "التقدير" },
//     ], [])

//     // تصدير/طباعة لكل قسم
//     const exportAttendanceCsv = () => toCSV(attRows, "attendance.csv")
//     const exportAttendanceXlsx = () => toXLSX(attRows, "attendance.xlsx")
//     const printAttendance = () => attPrintRef.current && printSection(attPrintRef.current.innerHTML, "تقرير الحضور")

//     const exportAssessCsv = () => toCSV(asRows, "assessments.csv")
//     const exportAssessXlsx = () => toXLSX(asRows, "assessments.xlsx")
//     const printAssess = () => asPrintRef.current && printSection(asPrintRef.current.innerHTML, "تقرير التقييمات")

//     return (
//         <AppLayout>
//             <Header />
//             <div className="p-4 space-y-6" dir="rtl">
//                 <div className="flex flex-wrap items-end gap-3">
//                     {/* اختيار الابن */}
//                     <div className="min-w-[260px]">
//                         <label className="block text-sm text-gray-700 mb-1">الابن</label>
//                         <Popover open={openChild} onOpenChange={setOpenChild}>
//                             <PopoverTrigger asChild>
//                                 <Button variant="outline" className="w-full justify-between">
//                                     {childName(childId)}
//                                     <ChevronsUpDown className="opacity-50 size-4" />
//                                 </Button>
//                             </PopoverTrigger>
//                             <PopoverContent className="w-[300px] p-0" align="end">
//                                 <Command>
//                                     <CommandInput placeholder="ابحث عن اسم…" className="text-right" />
//                                     <CommandEmpty>لا توجد نتائج.</CommandEmpty>
//                                     <CommandGroup>
//                                         <CommandItem
//                                             value="الكل"
//                                             onSelect={() => { setChildId(undefined); setOpenChild(false) }}
//                                         >
//                                             <Check className={cn("ml-2 size-4", !childId ? "opacity-100" : "opacity-0")} />
//                                             جميع الأبناء
//                                         </CommandItem>
//                                         {children.map(c => (
//                                             <CommandItem
//                                                 key={c.id}
//                                                 value={c.name}
//                                                 onSelect={() => { setChildId(c.id); setOpenChild(false) }}
//                                             >
//                                                 <Check className={cn("ml-2 size-4", c.id === childId ? "opacity-100" : "opacity-0")} />
//                                                 {c.name}
//                                             </CommandItem>
//                                         ))}
//                                     </CommandGroup>
//                                 </Command>
//                             </PopoverContent>
//                         </Popover>
//                     </div>

//                     {/* التاريخ */}
//                     <div>
//                         <label className="block text-sm text-gray-700 mb-1">من</label>
//                         <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
//                     </div>
//                     <div>
//                         <label className="block text-sm text-gray-700 mb-1">إلى</label>
//                         <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
//                     </div>

//                     <div className="ml-auto">
//                         <Button variant="outline" onClick={load}>تحديث</Button>
//                     </div>
//                 </div>

//                 {/* حضور */}
//                 <section className="space-y-3">
//                     <div className="flex items-center justify-between">
//                         <h2 className="text-lg font-semibold">سجل الحضور</h2>
//                         <div className="flex gap-2 no-print">
//                             <Button variant="outline" onClick={exportAttendanceCsv}><Download className="ml-1" size={16} /> CSV</Button>
//                             <Button variant="outline" onClick={exportAttendanceXlsx}><Download className="ml-1" size={16} /> XLSX</Button>
//                             <Button onClick={printAttendance}><Printer className="ml-1" size={16} /> طباعة/PDF</Button>
//                         </div>
//                     </div>
//                     <div ref={attPrintRef}>
//                         <DataTable data={attRows} columns={attCols as any} isLoading={loading} />
//                     </div>
//                 </section>

//                 {/* تقييمات */}
//                 <section className="space-y-3">
//                     <div className="flex items-center justify-between">
//                         <h2 className="text-lg font-semibold">التقييمات</h2>
//                         <div className="flex gap-2 no-print">
//                             <Button variant="outline" onClick={exportAssessCsv}><Download className="ml-1" size={16} /> CSV</Button>
//                             <Button variant="outline" onClick={exportAssessXlsx}><Download className="ml-1" size={16} /> XLSX</Button>
//                             <Button onClick={printAssess}><Printer className="ml-1" size={16} /> طباعة/PDF</Button>
//                         </div>
//                     </div>
//                     <div ref={asPrintRef}>
//                         <DataTable data={asRows as any[]} columns={asCols as any} isLoading={loading} />
//                     </div>
//                 </section>
//             </div>
//         </AppLayout>
//     )
// }

// src/pages/parent/Reports.tsx
import { useEffect, useRef, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import api from "@/services/api"
import { Download, Printer } from "lucide-react"
import { toCSV, toXLSX, printSection } from "@/lib/exporters"

type AttendanceSummary = {
    total: number
    present: number
    absent: number
    rate: number
}

type AssessmentsSummary = {
    avg_score: number | null
}

type ChildReport = {
    id: number
    name: string
    code?: string | null
    circles_count?: number
    attendance: AttendanceSummary
    assessments: AssessmentsSummary
}

type ParentReportsPayload = {
    children: ChildReport[]
}

export default function Reports() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ParentReportsPayload | null>(null)

    // مرجع للطباعة
    const tablePrintRef = useRef<HTMLDivElement | null>(null)

    async function load() {
        try {
            setLoading(true)
            const res = await api.get("/parent/reports")
            setData(res.data?.data as ParentReportsPayload)
        } catch (e: any) {
            console.error(e)
            toast.error(e?.response?.data?.message || "تعذر تحميل تقارير الأبناء")
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const children = data?.children ?? []

    // تصدير الملخص
    const exportCsv = () => {
        if (!children.length) return
        const rows = children.map((child, idx) => ({
            "#": idx + 1,
            name: child.name,
            code: child.code || "",
            circles_count: child.circles_count ?? 0,
            total_sessions: child.attendance?.total ?? 0,
            present: child.attendance?.present ?? 0,
            absent: child.attendance?.absent ?? 0,
            attendance_rate: `${child.attendance?.rate ?? 0}%`,
            avg_score:
                child.assessments?.avg_score != null
                    ? child.assessments.avg_score
                    : "",
        }))
        toCSV(rows, "parent-reports-summary.csv")
    }

    const exportXlsx = () => {
        if (!children.length) return
        const rows = children.map((child, idx) => ({
            "#": idx + 1,
            name: child.name,
            code: child.code || "",
            circles_count: child.circles_count ?? 0,
            total_sessions: child.attendance?.total ?? 0,
            present: child.attendance?.present ?? 0,
            absent: child.attendance?.absent ?? 0,
            attendance_rate: `${child.attendance?.rate ?? 0}%`,
            avg_score:
                child.assessments?.avg_score != null
                    ? child.assessments.avg_score
                    : "",
        }))
        toXLSX(rows, "parent-reports-summary.xlsx")
    }

    const printTable = () => {
        if (!tablePrintRef.current) return
        printSection(tablePrintRef.current.innerHTML, "تقارير أبنائي - ملخص")
    }

    return (
        <AppLayout>
            <Header />
            <div className="p-4" dir="rtl">
                {/* العنوان + أزرار عامة */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h1 className="text-xl font-bold">تقارير أبنائي</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            ملخص الحضور والتقييمات لكل ابن مرتبط بحسابك.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={load}
                            disabled={loading}
                        >
                            {loading ? "جاري التحديث…" : "تحديث"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={exportCsv}
                            disabled={!children.length}
                        >
                            <Download className="ml-1" size={16} /> CSV
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={exportXlsx}
                            disabled={!children.length}
                        >
                            <Download className="ml-1" size={16} /> XLSX
                        </Button>
                        <Button
                            size="sm"
                            onClick={printTable}
                            disabled={!children.length}
                        >
                            <Printer className="ml-1" size={16} /> طباعة / PDF
                        </Button>
                    </div>
                </div>

                {/* محتوى الصفحة */}
                <Card>
                    <CardHeader>
                        <div className="text-sm font-semibold">قائمة الأبناء</div>
                    </CardHeader>
                    <CardContent>
                        {loading && !children.length ? (
                            <div className="text-sm text-gray-600">جاري تحميل التقارير…</div>
                        ) : !children.length ? (
                            <div className="space-y-3">
                                <div className="text-sm text-gray-500">
                                    لا يوجد أبناء مرتبطون بحسابك حتى الآن، أو لا توجد بيانات
                                    تقارير متاحة.
                                </div>
                                <Button variant="outline" size="sm" onClick={load}>
                                    إعادة المحاولة
                                </Button>
                            </div>
                        ) : (
                            <div ref={tablePrintRef} className="overflow-x-auto">
                                <table className="min-w-full text-sm border">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="border px-3 py-2 text-right">#</th>
                                            <th className="border px-3 py-2 text-right">
                                                اسم الابن
                                            </th>
                                            <th className="border px-3 py-2 text-right">
                                                رقم الطالب
                                            </th>
                                            <th className="border px-3 py-2 text-right">
                                                عدد الحلقات
                                            </th>
                                            <th className="border px-3 py-2 text-right">
                                                إجمالي الجلسات
                                            </th>
                                            <th className="border px-3 py-2 text-right">حضور</th>
                                            <th className="border px-3 py-2 text-right">غياب</th>
                                            <th className="border px-3 py-2 text-right">
                                                نسبة الحضور
                                            </th>
                                            <th className="border px-3 py-2 text-right">
                                                متوسط التقييم
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {children.map((child, idx) => {
                                            const att = child.attendance || {
                                                total: 0,
                                                present: 0,
                                                absent: 0,
                                                rate: 0,
                                            }
                                            const asmt = child.assessments || { avg_score: null }

                                            return (
                                                <tr key={child.id}>
                                                    <td className="border px-3 py-1">{idx + 1}</td>
                                                    <td className="border px-3 py-1">{child.name}</td>
                                                    <td className="border px-3 py-1">
                                                        {child.code || "—"}
                                                    </td>
                                                    <td className="border px-3 py-1 text-center">
                                                        {child.circles_count ?? 0}
                                                    </td>
                                                    <td className="border px-3 py-1 text-center">
                                                        {att.total}
                                                    </td>
                                                    <td className="border px-3 py-1 text-center">
                                                        {att.present}
                                                    </td>
                                                    <td className="border px-3 py-1 text-center">
                                                        {att.absent}
                                                    </td>
                                                    <td className="border px-3 py-1 text-center">
                                                        {att.rate}%
                                                    </td>
                                                    <td className="border px-3 py-1 text-center">
                                                        {asmt.avg_score != null ? asmt.avg_score : "—"}
                                                    </td>
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
        </AppLayout>
    )
}

