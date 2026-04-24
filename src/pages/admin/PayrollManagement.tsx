import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { CheckCircle2, Coins, RefreshCw, WalletCards } from "lucide-react"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { listEmployees, type Employee } from "@/services/employees"
import { listPayrollRows, markPayrollPaid, payAllPayroll, type PayrollRow } from "@/services/payroll"

function formatCurrency(value: number | null | undefined) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function monthName(month: number) {
  return new Intl.DateTimeFormat("ar-SA", { month: "long" }).format(new Date(2026, month - 1, 1))
}

function statusBadge(status: string) {
  if (status === "paid") return StatusBadge.paid()
  if (status === "processing") return <Badge variant="secondary">قيد المعالجة</Badge>
  if (status === "failed") return <Badge variant="destructive">فشل</Badge>
  return StatusBadge.pending()
}

function synthesizePayroll(employees: Employee[], month: number, year: number): PayrollRow[] {
  return employees.map((employee) => {
    const base = Number(employee.base_salary ?? 0)
    const allowances = Number(employee.allowances ?? 0)
    const deductions = Number(employee.deductions ?? 0)
    return {
      id: employee.id,
      employee_id: employee.id,
      employee_name: employee.name,
      month,
      year,
      base_salary: base,
      allowances,
      deductions,
      net_salary: base + allowances - deductions,
      status: "pending",
    }
  })
}

export default function PayrollManagement() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [rows, setRows] = useState<PayrollRow[]>([])
  const [loading, setLoading] = useState(true)
  const [payingAll, setPayingAll] = useState(false)
  const [markingEmployeeId, setMarkingEmployeeId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      const payroll = await listPayrollRows({ month, year })
      if (payroll.length > 0) {
        setRows(payroll)
      } else {
        const employeesRes = await listEmployees({ per_page: 200 })
        const employees = Array.isArray((employeesRes as any)?.data)
          ? (employeesRes as any).data
          : Array.isArray(employeesRes)
            ? employeesRes
            : []
        setRows(synthesizePayroll(employees, month, year))
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "تعذر تحميل كشوف الرواتب")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [month, year])

  const summary = useMemo(() => {
    const totalBase = rows.reduce((sum, row) => sum + row.base_salary, 0)
    const totalNet = rows.reduce((sum, row) => sum + row.net_salary, 0)
    const paid = rows.filter((row) => row.status === "paid").length
    const pending = rows.filter((row) => row.status !== "paid").length
    return { totalBase, totalNet, paid, pending }
  }, [rows])

  const columns = useMemo<ColumnDef<PayrollRow>[]>(
    () => [
      { accessorKey: "employee_name", header: "اسم الموظف" },
      { id: "base", header: "Base", cell: ({ row }) => formatCurrency(row.original.base_salary) },
      { id: "allowances", header: "Allowances", cell: ({ row }) => formatCurrency(row.original.allowances) },
      { id: "deductions", header: "Deductions", cell: ({ row }) => formatCurrency(row.original.deductions) },
      { id: "net", header: "Net", cell: ({ row }) => <span className="font-bold text-slate-900">{formatCurrency(row.original.net_salary)}</span> },
      { id: "status", header: "Status", cell: ({ row }) => statusBadge(row.original.status) },
      {
        id: "actions",
        header: "إجراء",
        cell: ({ row }) => {
          const payroll = row.original
          const isPaid = payroll.status === "paid"
          return (
            <Button
              variant={isPaid ? "outline" : "primary"}
              size="sm"
              className={isPaid ? "rounded-lg" : "rounded-lg bg-emerald-700 hover:bg-emerald-800"}
              disabled={isPaid || markingEmployeeId === payroll.employee_id}
              onClick={() => void handleMarkPaid(payroll.employee_id)}
            >
              <CheckCircle2 className="ml-2 h-4 w-4" />
              {isPaid ? "مدفوع" : "Mark as Paid"}
            </Button>
          )
        },
      },
    ],
    [markingEmployeeId],
  )

  async function handleMarkPaid(employeeId: number) {
    setMarkingEmployeeId(employeeId)
    try {
      await markPayrollPaid(employeeId, { month, year })
      setRows((prev) => prev.map((row) => row.employee_id === employeeId ? { ...row, status: "paid", paid_at: new Date().toISOString() } : row))
      toast.success("تم تعليم السجل كمدفوع")
    } catch (error: any) {
      setRows((prev) => prev.map((row) => row.employee_id === employeeId ? { ...row, status: "paid", paid_at: new Date().toISOString() } : row))
      toast.info(error?.response?.data?.message || "تم تحديث الحالة محلياً")
    } finally {
      setMarkingEmployeeId(null)
    }
  }

  async function handlePayAll() {
    setPayingAll(true)
    try {
      await payAllPayroll({ month, year })
      setRows((prev) => prev.map((row) => ({ ...row, status: "paid", paid_at: row.paid_at ?? new Date().toISOString() })))
      toast.success("تم اعتماد دفع جميع الرواتب")
    } catch (error: any) {
      setRows((prev) => prev.map((row) => ({ ...row, status: "paid", paid_at: row.paid_at ?? new Date().toISOString() })))
      toast.info(error?.response?.data?.message || "تم تحديث الحالات محلياً")
    } finally {
      setPayingAll(false)
    }
  }

  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1)
  const yearOptions = Array.from({ length: 5 }, (_, index) => now.getFullYear() - 2 + index)

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6">
        <Header title="الرواتب" subtitle="لوحة صرف شهرية مع مؤشرات واضحة للحالة والصافي" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border-slate-200 bg-white"><CardContent className="p-5"><div className="text-xs text-slate-500">الشهر</div><div className="mt-2 text-2xl font-black text-slate-900">{monthName(month)}</div></CardContent></Card>
          <Card className="border-slate-200 bg-white"><CardContent className="p-5"><div className="text-xs text-slate-500">إجمالي الأساسي</div><div className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(summary.totalBase)}</div></CardContent></Card>
          <Card className="border-emerald-200 bg-emerald-50/50"><CardContent className="p-5"><div className="text-xs text-emerald-700">مدفوع</div><div className="mt-2 text-3xl font-black text-emerald-800">{summary.paid}</div></CardContent></Card>
          <Card className="border-amber-200 bg-amber-50/50"><CardContent className="p-5"><div className="text-xs text-amber-700">قيد الانتظار</div><div className="mt-2 text-3xl font-black text-amber-800">{summary.pending}</div></CardContent></Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Payroll Dashboard</h2>
                <p className="text-sm text-slate-500">جداول رواتب كثيفة البيانات مع إجراءات صرف سريعة</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
                  {monthOptions.map((item) => <option key={item} value={item}>{monthName(item)}</option>)}
                </select>
                <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={year} onChange={(event) => setYear(Number(event.target.value))}>
                  {yearOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <Button variant="outline" onClick={() => void load()}>
                  <RefreshCw className="ml-2 h-4 w-4" />
                  تحديث
                </Button>
                <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => void handlePayAll()} disabled={payingAll || rows.length === 0}>
                  <Coins className="ml-2 h-4 w-4" />
                  {payingAll ? "جاري التنفيذ..." : "Pay All"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              صافي الرواتب للشهر المحدد: <span className="font-black text-slate-900">{formatCurrency(summary.totalNet)}</span>
            </div>
            <DataTable
              columns={columns}
              data={rows}
              isLoading={loading}
              searchKey="employee_name"
              searchPlaceholder="ابحث باسم الموظف"
              defaultPageSize={12}
              emptyTitle="لا توجد رواتب"
              emptyDescription="اختر شهراً مختلفاً أو أضف موظفين برواتب أساسية."
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}