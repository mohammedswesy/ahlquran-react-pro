import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Edit3, Landmark, Plus, RefreshCw, Wallet } from "lucide-react"

import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { listCircles, type Circle } from "@/services/circles"
import { createEmployee, listEmployees, updateEmployee, type Employee } from "@/services/employees"
import { listAssignableUsers, type UserOption } from "@/services/users"

function formatCurrency(value: number | null | undefined) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function statusLabel(status: number | string | null | undefined) {
  const normalized = String(status ?? "1")
  if (normalized === "1" || normalized.toLowerCase() === "active") return "نشط"
  if (normalized === "0" || normalized.toLowerCase() === "inactive") return "موقوف"
  return "قيد المراجعة"
}

function statusNode(status: number | string | null | undefined) {
  const normalized = String(status ?? "1")
  if (normalized === "1" || normalized.toLowerCase() === "active") return StatusBadge.active()
  if (normalized === "0" || normalized.toLowerCase() === "inactive") return StatusBadge.suspended()
  return StatusBadge.pending()
}

type EditState = {
  id: number
  name: string
  job_title: string
  base_salary: string
  status: string
}

const EMPTY_EDIT: EditState = {
  id: 0,
  name: "",
  job_title: "",
  base_salary: "",
  status: "1",
}

export default function EmployeeList() {
  const [rows, setRows] = useState<Employee[]>([])
  const [circles, setCircles] = useState<Circle[]>([])
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [newSalary, setNewSalary] = useState("")
  const [newJobTitle, setNewJobTitle] = useState("")
  const [newStatus, setNewStatus] = useState("1")
  const [editForm, setEditForm] = useState<EditState>(EMPTY_EDIT)

  async function load() {
    setLoading(true)
    try {
      const [employeeRes, circleRes] = await Promise.all([
        listEmployees({ per_page: 200 }),
        listCircles({ per_page: 200 }),
      ])

      const employees = Array.isArray((employeeRes as any)?.data)
        ? (employeeRes as any).data
        : Array.isArray(employeeRes)
          ? employeeRes
          : []

      setRows(employees)
      setCircles(circleRes.data ?? [])
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "تعذر تحميل بيانات الموظفين")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers(search = "") {
    try {
      const users = await listAssignableUsers({ search: search.trim() || undefined, per_page: 50 })
      setAvailableUsers(users)
      if (!selectedUserId && users[0]?.id) setSelectedUserId(users[0].id)
    } catch {
      setAvailableUsers([])
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!openCreate) return
    const timerId = window.setTimeout(() => {
      void loadUsers(userSearch)
    }, 250)
    return () => window.clearTimeout(timerId)
  }, [openCreate, userSearch])

  const totals = useMemo(() => {
    const totalEmployees = rows.length
    const activeEmployees = rows.filter((row) => String(row.status ?? "1") === "1" || String(row.status).toLowerCase() === "active").length
    const payrollBase = rows.reduce((sum, row) => sum + Number(row.base_salary ?? 0), 0)
    return { totalEmployees, activeEmployees, payrollBase }
  }, [rows])

  const circlesById = useMemo(() => {
    const map = new Map<number, string>()
    circles.forEach((circle) => map.set(circle.id, circle.name))
    return map
  }, [circles])

  const selectedUser = useMemo(
    () => availableUsers.find((user) => user.id === selectedUserId) ?? null,
    [availableUsers, selectedUserId],
  )

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        id: "name",
        header: "الاسم",
        accessorKey: "name",
        cell: ({ row }) => {
          const employee = row.original
          return (
            <div className="space-y-1">
              <div className="font-bold text-slate-900">{employee.name}</div>
              <div className="text-xs text-slate-500">{employee.email || employee.mobile || employee.phone || "بدون وسيلة تواصل"}</div>
            </div>
          )
        },
      },
      {
        id: "job_title",
        header: "المسمى الوظيفي",
        accessorKey: "job_title",
        cell: ({ row }) => row.original.job_title || "—",
      },
      {
        id: "base_salary",
        header: "الراتب الأساسي",
        accessorKey: "base_salary",
        cell: ({ row }) => <span className="font-semibold text-emerald-700">{formatCurrency(row.original.base_salary)}</span>,
      },
      {
        id: "circles",
        header: "الحلقات المعيّنة",
        cell: ({ row }) => {
          const employee = row.original
          const assigned = Array.isArray(employee.circles) && employee.circles.length > 0
            ? employee.circles
            : Array.isArray(employee.circle_ids)
              ? employee.circle_ids.map((id) => ({ id, name: circlesById.get(id) || `حلقة #${id}` }))
              : []

          if (assigned.length === 0) {
            return <span className="text-slate-400">—</span>
          }

          return (
            <div className="flex flex-wrap gap-2">
              {assigned.slice(0, 3).map((circle) => (
                <Link
                  key={circle.id}
                  to={`/admin/circles/${circle.id}`}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                >
                  {circle.name}
                </Link>
              ))}
              {assigned.length > 3 ? <Badge variant="secondary">+{assigned.length - 3}</Badge> : null}
            </div>
          )
        },
      },
      {
        id: "status",
        header: "الحالة",
        cell: ({ row }) => statusNode(row.original.status),
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => {
              const employee = row.original
              setEditForm({
                id: employee.id,
                name: employee.name,
                job_title: employee.job_title || "",
                base_salary: String(employee.base_salary ?? ""),
                status: String(employee.status ?? 1),
              })
              setOpenEdit(true)
            }}
          >
            <Edit3 className="ml-2 h-4 w-4" />
            Edit
          </Button>
        ),
      },
    ],
    [circlesById],
  )

  async function handleCreate() {
    if (!selectedUser) {
      toast.error("اختر مستخدماً أولاً")
      return
    }
    if (!newSalary.trim() || Number(newSalary) <= 0) {
      toast.error("أدخل الراتب الافتتاحي")
      return
    }
    if (!newJobTitle.trim()) {
      toast.error("أدخل المسمى الوظيفي")
      return
    }

    setSaving(true)
    try {
      await createEmployee({
        user_id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.mobile,
        role: "staff",
        job_title: newJobTitle.trim(),
        base_salary: Number(newSalary),
        status: Number(newStatus),
        institute_id: selectedUser.institute_id ?? null,
      })
      toast.success("تم تعيين المستخدم كموظف")
      setOpenCreate(false)
      setSelectedUserId(null)
      setNewSalary("")
      setNewJobTitle("")
      setNewStatus("1")
      setUserSearch("")
      await load()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "تعذر إضافة الموظف")
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!editForm.id) return
    if (!editForm.base_salary.trim() || Number(editForm.base_salary) <= 0) {
      toast.error("الراتب الأساسي غير صالح")
      return
    }

    setSaving(true)
    try {
      const updated = await updateEmployee(editForm.id, {
        job_title: editForm.job_title.trim() || null,
        base_salary: Number(editForm.base_salary),
        status: Number(editForm.status),
      })

      setRows((prev) => prev.map((row) => (row.id === editForm.id ? { ...row, ...updated } : row)))
      setOpenEdit(false)
      setEditForm(EMPTY_EDIT)
      toast.success("تم تحديث بيانات الموظف")
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "تعذر تحديث الموظف")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div dir="rtl" className="space-y-6">
        <Header title="إدارة الموظفين" subtitle="دليل وظيفي احترافي مع صلاحيات التحديث والرواتب الأساسية" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <div className="text-xs font-semibold text-slate-500">إجمالي الموظفين</div>
                <div className="mt-2 text-3xl font-black text-slate-900">{totals.totalEmployees}</div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <Landmark className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <div className="text-xs font-semibold text-emerald-700">الموظفون النشطون</div>
                <div className="mt-2 text-3xl font-black text-emerald-800">{totals.activeEmployees}</div>
              </div>
              {StatusBadge.active()}
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <div className="text-xs font-semibold text-amber-700">إجمالي الرواتب الأساسية</div>
                <div className="mt-2 text-2xl font-black text-amber-800">{formatCurrency(totals.payrollBase)}</div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">دليل الموظفين</h2>
                <p className="text-sm text-slate-500">عرض سريع للوظيفة والحالة والرواتب والارتباط بالحلقات</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => void load()}>
                  <RefreshCw className="ml-2 h-4 w-4" />
                  تحديث
                </Button>
                <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => setOpenCreate(true)}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة موظف
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={rows}
              isLoading={loading}
              searchKey="name"
              searchPlaceholder="ابحث باسم الموظف"
              defaultPageSize={12}
              emptyTitle="لا يوجد موظفون"
              emptyDescription="ابدأ بإضافة موظف من مستخدم موجود في النظام."
            />
          </CardContent>
        </Card>

        <Modal
          open={openCreate}
          onClose={() => !saving && setOpenCreate(false)}
          title="إضافة موظف"
          description="اختر مستخدماً موجوداً وامنحه راتباً افتتاحياً ومسمىً وظيفياً"
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={saving}>إلغاء</Button>
              <Button onClick={() => void handleCreate()} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                {saving ? "جاري الحفظ..." : "تعيين كموظف"}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input label="بحث المستخدم" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="اكتب الاسم أو البريد" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">اختر مستخدماً موجوداً</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                value={selectedUserId ?? ""}
                onChange={(event) => setSelectedUserId(Number(event.target.value))}
              >
                <option value="">اختر مستخدماً</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} {user.email ? `- ${user.email}` : ""}</option>
                ))}
              </select>
            </div>
            <Input label="المسمى الوظيفي" value={newJobTitle} onChange={(event) => setNewJobTitle(event.target.value)} placeholder="مثال: مسؤول إداري" />
            <Input label="الراتب الافتتاحي" type="number" min="0" value={newSalary} onChange={(event) => setNewSalary(event.target.value)} placeholder="0" />
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">الحالة</label>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" value={newStatus} onChange={(event) => setNewStatus(event.target.value)}>
                <option value="1">نشط</option>
                <option value="0">موقوف</option>
              </select>
            </div>
            {selectedUser ? (
              <div className="md:col-span-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                سيتم تعيين: <span className="font-bold">{selectedUser.name}</span>
                <span className="mx-2">•</span>
                {selectedUser.email || selectedUser.mobile || "لا توجد بيانات إضافية"}
              </div>
            ) : null}
          </div>
        </Modal>

        <Modal
          open={openEdit}
          onClose={() => !saving && setOpenEdit(false)}
          title="تعديل الموظف"
          description="تحديث الراتب الأساسي أو حالة التفعيل"
          footer={
            <>
              <Button variant="outline" onClick={() => setOpenEdit(false)} disabled={saving}>إلغاء</Button>
              <Button onClick={() => void handleEdit()} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                {saving ? "جاري التحديث..." : "حفظ التعديلات"}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="اسم الموظف" value={editForm.name} disabled />
            <Input label="المسمى الوظيفي" value={editForm.job_title} onChange={(event) => setEditForm((prev) => ({ ...prev, job_title: event.target.value }))} />
            <Input label="الراتب الأساسي" type="number" min="0" value={editForm.base_salary} onChange={(event) => setEditForm((prev) => ({ ...prev, base_salary: event.target.value }))} />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">الحالة</label>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" value={editForm.status} onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="1">{statusLabel(1)}</option>
                <option value="0">{statusLabel(0)}</option>
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}