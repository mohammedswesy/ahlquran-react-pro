// src/pages/admin/StudentsList.tsx
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useNavigate } from "react-router-dom"

import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

import ExportMenu from "@/components/app/ExportMenu"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page"

import Stat from "@/components/Stat"
import { StatusBadge } from "@/components/ui/badge"
import { Users, UserCheck, UserPlus } from "lucide-react"

import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  type Student,
} from "@/services/students"

import { listInstitutesOptions } from "@/services/institutes"
import { listCirclesByInstitute, type Circle } from "@/services/circles"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"

import { ChevronsUpDown, Check, MoreHorizontal, Edit, Trash } from "lucide-react"
import { cn } from "@/lib/utils"

import StudentForm, { type StudentFormValues } from "./StudentForm"
import SkeletonTable from "@/components/ui/skeleton-table"
import EmptyState from "@/components/ui/empty-state"
import LoadingBar from "@/components/ui/loading-bar"
import ModalFormShell from "@/components/ui/modal-form-shell"

export default function StudentsList() {
  const nav = useNavigate()
  // ====== Table state ======
  const [rows, setRows] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<any>(null)

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState<Student | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ====== Filters (institute / circle) ======
  const [filterInstituteId, setFilterInstituteId] = useState<number | undefined>(undefined)
  const [filterCircleId, setFilterCircleId] = useState<number | undefined>(undefined)

  // ====== lookups for names (id -> name) ======
  const [instOptions, setInstOptions] = useState<Array<{ id: number; name: string }>>([])
  const [circleOptions, setCircleOptions] = useState<Circle[]>([])

  const [instOpen, setInstOpen] = useState(false)
  const [circleOpen, setCircleOpen] = useState(false)

  // Load institute options once
  useEffect(() => {
    ; (async () => {
      try {
        const insts = await listInstitutesOptions()
        setInstOptions(insts)
      } catch {
        // ignore
      }
    })()
  }, [])

  // Load circle options based on selected institute (for filter)
  useEffect(() => {
    ; (async () => {
      try {
        if (!filterInstituteId) {
          setCircleOptions([])
          setFilterCircleId(undefined)
          return
        }
        const circles = await listCirclesByInstitute(filterInstituteId)
        setCircleOptions(circles)
        if (!circles.some((c) => c.id === filterCircleId)) setFilterCircleId(undefined)
      } catch {
        // ignore
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterInstituteId])

  // ====== Columns ======
  const columns = useMemo<ColumnDef<Student>[]>(() => {
    return [
      { header: "#", cell: ({ row }) => row.index + 1 },
      { accessorKey: "name", header: "اسم الطالب" },
      {
        id: "gender",
        header: "النوع",
        cell: ({ row }) => {
          const g = (row.original.gender || "").toString()
          return g === "female" ? "أنثى" : "ذكر"
        },
      },
      { accessorKey: "phone", header: "الهاتف", cell: ({ getValue }) => (getValue() as any) || "—" },
      {
        id: "institute",
        header: "المعهد",
        cell: ({ row }) => row.original.institute?.name || "—",
      },
      {
        id: "circle",
        header: "الحلقة",
        cell: ({ row }) => row.original.circle?.name || "—",
      },
      {
        id: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const status = row.original.status
          if (status === 1) return StatusBadge.active()
          if (status === 0) return StatusBadge.inactive()
          return StatusBadge.pending()
        },
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => {
          const r = row.original
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40" align="end">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setOpenEdit(r)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => onDelete(r.id)}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    حذف
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )
        },
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ====== Load data ======
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listStudents({
        per_page: 1000, // Load all for client-side pagination
        ...(filterInstituteId ? { institute_id: filterInstituteId } : {}),
        ...(filterCircleId ? { circle_id: filterCircleId } : {}),
      } as any)

      const next =
        (res && Array.isArray((res as any).data) && (res as any).data) ||
        (Array.isArray(res) ? res : [])

      setRows(next as Student[])
      setMeta((res as any)?.meta ?? null)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل الطلاب")
    } finally {
      setLoading(false)
    }
  }, [filterCircleId, filterInstituteId])

  // Load data when filters change
  useEffect(() => {
    load()
  }, [load])

  // ====== Create / Edit / Delete ======
  const onCreate = async (v: StudentFormValues) => {
    setSubmitting(true)
    try {
      const created = await createStudent(v)
      setRows((prev) => [created, ...prev])
      setOpenCreate(false)
      toast.success("تمت الإضافة بنجاح")
      nav("/admin/students", { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الإضافة")
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async (v: StudentFormValues) => {
    if (!openEdit) return
    setSubmitting(true)
    try {
      const updated = await updateStudent(openEdit.id, v)
      setRows((prev) => prev.map((r) => (r.id === openEdit.id ? updated : r)))
      setOpenEdit(null)
      toast.success("تم التعديل بنجاح")
      nav("/admin/students", { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل التعديل")
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm("متأكد من حذف هذا الطالب؟")) return
    try {
      await deleteStudent(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast.success("تم الحذف")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الحذف")
    }
  }

  // ====== Helpers (display names) ======
  const instName = (id?: number) => instOptions.find((i) => i.id === id)?.name || "اختر المعهد…"
  const circleName = (id?: number) => circleOptions.find((c) => c.id === id)?.name || "اختر الحلقة…"

  const clearFilters = () => {
    setFilterInstituteId(undefined)
    setFilterCircleId(undefined)
  }

  // ====== Render ======
  return (
    <div className="space-y-6" dir="rtl">
      <LoadingBar active={loading} />
      <PageHeader
        title="الطلاب"
        subtitle="إدارة الطلاب (بحث + فلاتر + إضافة/تعديل/حذف) مع تصدير."
        actions={
          <>
            <Button variant="outline" onClick={load}>
              تحديث
            </Button>
            <Button onClick={() => setOpenCreate(true)}>إضافة طالب</Button>
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat
          label="إجمالي الطلاب"
          value={meta?.total || rows.length}
          icon={<Users className="w-6 h-6" />}
          color="primary"
        />
        <Stat
          label="الطلاب النشطين"
          value={rows.filter(s => s.status === 1).length}
          icon={<UserCheck className="w-6 h-6" />}
          color="success"
        />
        <Stat
          label="طلاب جدد هذا الشهر"
          value={rows.filter(s => {
            if (!s.created_at) return false
            const created = new Date(s.created_at)
            const now = new Date()
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
          }).length}
          icon={<UserPlus className="w-6 h-6" />}
          color="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end gap-3">
            {/* Filter: Institute */}
            <div className="min-w-[220px]">
              <label className="block text-sm text-gray-700 mb-1">المعهد</label>
              <Popover open={instOpen} onOpenChange={setInstOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {instName(filterInstituteId)}
                    <ChevronsUpDown className="opacity-50 size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="ابحث عن معهد…" className="text-right" />
                    <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key={0}
                        value="الكل"
                        onSelect={() => {
                          setFilterInstituteId(undefined)
                          setFilterCircleId(undefined)
                          setInstOpen(false)
                        }}
                      >
                        <Check className={cn("ml-2 size-4", !filterInstituteId ? "opacity-100" : "opacity-0")} />
                        الكل
                      </CommandItem>

                      {instOptions.map((i) => (
                        <CommandItem
                          key={i.id}
                          value={i.name}
                          onSelect={() => {
                            setFilterInstituteId(i.id)
                            setInstOpen(false)
                          }}
                        >
                          <Check className={cn("ml-2 size-4", i.id === filterInstituteId ? "opacity-100" : "opacity-0")} />
                          {i.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter: Circle (depends on institute) */}
            <div className="min-w-[220px]">
              <label className="block text-sm text-gray-700 mb-1">الحلقة</label>
              <Popover open={circleOpen} onOpenChange={setCircleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={!filterInstituteId}
                    title={!filterInstituteId ? "اختر المعهد أولاً" : ""}
                  >
                    {circleName(filterCircleId)}
                    <ChevronsUpDown className="opacity-50 size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="ابحث عن حلقة…" className="text-right" />
                    <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        key={0}
                        value="الكل"
                        onSelect={() => {
                          setFilterCircleId(undefined)
                          setCircleOpen(false)
                        }}
                      >
                        <Check className={cn("ml-2 size-4", !filterCircleId ? "opacity-100" : "opacity-0")} />
                        الكل
                      </CommandItem>

                      {circleOptions.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => {
                            setFilterCircleId(c.id)
                            setCircleOpen(false)
                          }}
                        >
                          <Check className={cn("ml-2 size-4", c.id === filterCircleId ? "opacity-100" : "opacity-0")} />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="outline" onClick={clearFilters}>
              مسح الفلاتر
            </Button>

            <div className="ms-auto flex items-center gap-2">
              <ExportMenu rows={rows} filename="students" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            isLoading={loading}
            searchKey="name"
            searchPlaceholder="البحث في أسماء الطلاب..."
          />
        </CardContent>
      </Card>

      {/* Create */}
      <ModalFormShell
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="إضافة طالب"
        formId="student-create-form"
        submitting={submitting}
      >
        <StudentForm formId="student-create-form" showActions={false} submitting={submitting} onSubmit={onCreate} />
      </ModalFormShell>

      {/* Edit */}
      <ModalFormShell
        open={!!openEdit}
        onClose={() => setOpenEdit(null)}
        title="تعديل طالب"
        formId="student-edit-form"
        submitting={submitting}
      >
        <StudentForm formId="student-edit-form" showActions={false} submitting={submitting} defaultValues={openEdit ?? undefined} onSubmit={onEdit} />
      </ModalFormShell>
    </div>
  )
}
