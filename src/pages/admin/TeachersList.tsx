// src/pages/admin/TeachersList.tsx
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SkeletonTable from "@/components/ui/skeleton-table"
import EmptyState from "@/components/ui/empty-state"
import LoadingBar from "@/components/ui/loading-bar"
import ModalFormShell from "@/components/ui/modal-form-shell"

import {
  listTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  type Teacher,
} from "@/services/teachers"

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
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

import TeacherForm, { type TeacherFormValues } from "./TeacherForm"

export default function TeachersList() {
  const nav = useNavigate()
  const [rows, setRows] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [meta, setMeta] = useState<any>(null)

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState<Teacher | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createServerErrors, setCreateServerErrors] = useState<Partial<Record<keyof TeacherFormValues, string>>>({})

  const [filterInstituteId, setFilterInstituteId] = useState<number | undefined>()
  const [filterCircleId, setFilterCircleId] = useState<number | undefined>()

  const [instOptions, setInstOptions] = useState<Array<{ id: number; name: string }>>([])
  const [circleOptions, setCircleOptions] = useState<Circle[]>([])
  const [instOpen, setInstOpen] = useState(false)
  const [circleOpen, setCircleOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const insts = await listInstitutesOptions()
        setInstOptions(insts)
      } catch {
        // ignore
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
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

  const columns = useMemo<ColumnDef<Teacher>[]>(
    () => [
      { id: "serial", header: "#", cell: ({ row }) => row.index + 1 },
      { id: "name", accessorKey: "name", header: "اسم المعلّم" },
      {
        id: "gender",
        header: "النوع",
        cell: ({ row }) => ((row.original.gender || "") === "female" ? "أنثى" : "ذكر"),
      },
      { id: "email", accessorKey: "email", header: "البريد", cell: ({ getValue }) => getValue() || "—" },
      { id: "phone", accessorKey: "phone", header: "الهاتف", cell: ({ getValue }) => getValue() || "—" },
      { id: "institute", header: "المعهد", cell: ({ row }) => row.original.institute?.name || "—" },
      { id: "circle", header: "الحلقة", cell: ({ row }) => row.original.circle?.name || "—" },
      {
        id: "user_status",
        header: "حساب المستخدم",
        cell: ({ row }) => {
          const userId = (row.original as any).user_id
          if (userId) return <span className="text-green-600 font-semibold">✓ مرتبط</span>
          return <span className="text-gray-500">—</span>
        },
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
    ],
    []
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTeachers({
        page,
        per_page: perPage,
        search,
        ...(filterInstituteId ? { institute_id: filterInstituteId } : {}),
        ...(filterCircleId ? { circle_id: filterCircleId } : {}),
      } as any)

      const next =
        (res && Array.isArray((res as any).data) && (res as any).data) ||
        (Array.isArray(res) ? res : [])

      setRows(next as Teacher[])
      setMeta((res as any)?.meta ?? null)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل المعلّمين")
    } finally {
      setLoading(false)
    }
  }, [filterCircleId, filterInstituteId, page, perPage, search])

  useEffect(() => {
    const id = setTimeout(() => load(), 350)
    return () => clearTimeout(id)
  }, [load])

  const onCreate = async (v: TeacherFormValues) => {
    setSubmitting(true)
    setCreateServerErrors({})
    try {
      const created = await createTeacher(v)
      setRows((prev) => [created, ...prev])
      setOpenCreate(false)
      toast.success("تمت الإضافة بنجاح")
      nav("/admin/teachers", { replace: true })
    } catch (e: any) {
      const backendErrors = (e?.response?.data?.errors ?? {}) as Record<string, string | string[]>
      const nextErrors: Partial<Record<keyof TeacherFormValues, string>> = {}
      // Map common backend error fields
      for (const key of ["name", "email", "password", "phone", "hire_date", "institute_id", "circle_id"] as const) {
        const err = backendErrors[key]
        if (err) {
          nextErrors[key] = Array.isArray(err) ? String(err[0] ?? "") : String(err)
        }
      }
      setCreateServerErrors(nextErrors)
      toast.error(e?.response?.data?.message || "فشل الإضافة")
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async (v: TeacherFormValues) => {
    if (!openEdit) return
    setSubmitting(true)
    try {
      const updated = await updateTeacher(openEdit.id, v)
      setRows((prev) => prev.map((r) => (r.id === openEdit.id ? updated : r)))
      setOpenEdit(null)
      toast.success("تم التعديل بنجاح")
      nav("/admin/teachers", { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل التعديل")
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm("متأكد من حذف هذا المعلّم؟")) return
    try {
      await deleteTeacher(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast.success("تم الحذف")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الحذف")
    }
  }

  const instName = (id?: number) => instOptions.find((i) => i.id === id)?.name || "كل المعاهد"
  const circleName = (id?: number) => circleOptions.find((c) => c.id === id)?.name || "كل الحلقات"

  return (
    <div className="space-y-4" dir="rtl">
      <LoadingBar active={loading} />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end gap-2">
            <Input
              label="بحث"
              placeholder="ابحث باسم المعلّم…"
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className="w-64"
            />

            {/* Institute filter */}
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

            {/* Circle filter */}
            <div className="min-w-[220px]">
              <label className="block text-sm text-gray-700 mb-1">الحلقة</label>
              <Popover open={circleOpen} onOpenChange={setCircleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={!filterInstituteId}
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
                          setPage(1)
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
                            setPage(1)
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

            <div className="ms-auto flex gap-2">
              <Button onClick={load} variant="outline">
                تحديث
              </Button>
              <Button onClick={() => setOpenCreate(true)}>إضافة معلّم</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <SkeletonTable rows={8} cols={7} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="لا توجد بيانات معلّمين"
              desc="أضف أول معلّم للبدء."
              actionLabel="إضافة معلّم"
              onAction={() => setOpenCreate(true)}
            />
          ) : (
            <DataTable columns={columns} data={rows} isLoading={false} />
          )}

          {meta && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                صفحة {meta.current_page} من {meta.last_page}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ModalFormShell
        open={openCreate}
        onClose={() => {
          setOpenCreate(false)
          setCreateServerErrors({})
        }}
        title="إضافة معلّم"
        formId="teacher-create-form"
        submitting={submitting}
      >
        <TeacherForm formId="teacher-create-form" showActions={false} submitting={submitting} onSubmit={onCreate} serverErrors={createServerErrors} />
      </ModalFormShell>

      <ModalFormShell
        open={!!openEdit}
        onClose={() => setOpenEdit(null)}
        title="تعديل معلّم"
        formId="teacher-edit-form"
        submitting={submitting}
      >
        <TeacherForm formId="teacher-edit-form" showActions={false} submitting={submitting} defaultValues={openEdit ?? undefined} onSubmit={onEdit} />
      </ModalFormShell>
    </div>
  )
}
