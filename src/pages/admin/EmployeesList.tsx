import { useEffect, useMemo, useState } from "react"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"

import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
} from "@/services/employees"

import { listInstitutesOptions } from "@/services/institutes"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

import EmployeeForm, { type EmployeeFormValues } from "./EmployeeForm"

const ROLE_LABEL: Record<string, string> = {
  admin: "مشرف",
  teacher: "معلّم",
  staff: "موظّف",
}

export default function EmployeesList() {
  const [rows, setRows] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [meta, setMeta] = useState<any>(null)

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState<Employee | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined)
  const [filterInstituteId, setFilterInstituteId] = useState<number | undefined>(undefined)

  // Lookups
  const [instOptions, setInstOptions] = useState<Array<{ id: number; name: string }>>([])
  const [instOpen, setInstOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)

  useEffect(() => {
    ; (async () => setInstOptions(await listInstitutesOptions()))()
  }, [])

  // ✅ أعمدة صحيحة حسب الـ API response (user.name / user.email / institute.name)
  const columns = useMemo<ColumnDef<Employee>[]>(() => [
    { header: "#", cell: ({ row }) => row.index + 1 },

    {
      id: "name",
      header: "الاسم",
      cell: ({ row }) => row.original.user?.name || "—",
    },

    {
      id: "email",
      header: "البريد",
      cell: ({ row }) => row.original.user?.email || "—",
    },

    {
      accessorKey: "job_title",
      header: "المسمى الوظيفي",
      cell: ({ getValue }) => (getValue() as any) || "—",
    },

    // إذا الباك ما برجع phone/moblie في list، خليها —
    {
      id: "phone",
      header: "الهاتف",
      cell: ({ row }) => row.original.mobile || row.original.phone || "—",
    },

    // الـ role مش ظاهر في response الحالي، فخليه “—” أو اقرأ من role_name لو موجود
    {
      id: "role",
      header: "الدور",
      cell: ({ row }) => {
        const r = (row.original as any).role || (row.original as any).role_name
        return ROLE_LABEL[r || ""] || r || "—"
      },
    },

    {
      id: "institute",
      header: "المعهد",
      cell: ({ row }) => row.original.institute?.name || "—",
    },

    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenEdit(r)}>
              تعديل
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(r.id)}>
              حذف
            </Button>
          </div>
        )
      },
    },
  ], [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await listEmployees({
        page,
        per_page: perPage,
        search,
        ...(filterRole ? { role: filterRole } : {}),
        ...(filterInstituteId ? { institute_id: filterInstituteId } : {}),
      } as any)

      // ✅ استخراج صحيح: res.data (array) + res.meta
      const next =
        Array.isArray((res as any)?.data) ? (res as any).data :
          Array.isArray((res as any)?.data?.data) ? (res as any).data.data :
            Array.isArray(res) ? res : []

      setRows(next as Employee[])
      setMeta((res as any)?.meta ?? (res as any)?.data?.meta ?? null)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل الموظفين")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = setTimeout(() => load(), 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, filterRole, filterInstituteId])

  const onCreate = async (v: EmployeeFormValues) => {
    setSubmitting(true)
    try {
      const created = await createEmployee(v)
      // ✅ created ممكن يرجع object واحد، فبنضيفه فوق
      setRows((prev) => [created as any, ...prev])
      setOpenCreate(false)
      toast.success("تمت الإضافة بنجاح")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الإضافة")
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async (v: EmployeeFormValues) => {
    if (!openEdit) return
    setSubmitting(true)
    try {
      const updated = await updateEmployee(openEdit.id, v)
      setRows((prev) => prev.map((r) => (r.id === openEdit.id ? (updated as any) : r)))
      setOpenEdit(null)
      toast.success("تم التعديل بنجاح")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل التعديل")
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm("متأكد من حذف هذا الموظف؟")) return
    try {
      await deleteEmployee(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast.success("تم الحذف")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الحذف")
    }
  }

  const instName = (id?: number) => instOptions.find((i) => i.id === id)?.name || "اختر المعهد…"
  const roleLabel = (r?: string) => ROLE_LABEL[r || ""] || "اختر الدور…"

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-end gap-2">
        <Input
          label="بحث"
          placeholder="ابحث باسم الموظف…"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          className="w-64"
        />

        {/* Filter: Role */}
        <div className="min-w-[200px]">
          <label className="block text-sm text-gray-700 mb-1">الدور</label>
          <Popover open={roleOpen} onOpenChange={setRoleOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {roleLabel(filterRole)}
                <ChevronsUpDown className="opacity-50 size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="end">
              <Command>
                <CommandInput placeholder="ابحث عن دور…" className="text-right" />
                <CommandEmpty>لا توجد نتائج.</CommandEmpty>
                <CommandGroup>
                  {[
                    { key: undefined, label: "الكل" },
                    { key: "admin", label: "مشرف" },
                    { key: "teacher", label: "معلّم" },
                    { key: "staff", label: "موظّف" },
                  ].map((r) => (
                    <CommandItem
                      key={String(r.key)}
                      value={r.label}
                      onSelect={() => {
                        setFilterRole(r.key as any)
                        setRoleOpen(false)
                        setPage(1)
                      }}
                    >
                      <Check className={cn("ml-2 size-4", filterRole === r.key ? "opacity-100" : "opacity-0")} />
                      {r.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

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
                      setInstOpen(false)
                      setPage(1)
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
                        setPage(1)
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

        <Button onClick={load} variant="outline">
          تحديث
        </Button>
        <Button onClick={() => setOpenCreate(true)}>إضافة موظف</Button>
      </div>

      <DataTable columns={columns} data={rows} isLoading={loading} />

      {meta && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            صفحة {meta.current_page} من {meta.last_page}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              السابق
            </Button>
            <Button variant="outline" size="sm" disabled={meta && page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
              التالي
            </Button>
          </div>
        </div>
      )}

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="إضافة موظف" footer={null}>
        <EmployeeForm submitting={submitting} onSubmit={onCreate} />
      </Modal>

      <Modal open={!!openEdit} onClose={() => setOpenEdit(null)} title="تعديل موظف" footer={null}>
        <EmployeeForm submitting={submitting} defaultValues={openEdit ?? undefined} onSubmit={onEdit} />
      </Modal>
    </div>
  )
}
