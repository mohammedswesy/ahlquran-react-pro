// src/pages/admin/InstitutesList.tsx
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import ModalFormShell from "@/components/ui/modal-form-shell"
import EmptyState from "@/components/ui/empty-state"
import LoadingBar from "@/components/ui/loading-bar"
import ExportMenu from "@/components/app/ExportMenu"

import {
  listInstitutes,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  type Institute,
  type AdminCredentials,
} from "@/services/institutes"

import { fetchCountries } from "@/services/countries"
import { listCities } from "@/services/cities"
import { listOrganizations } from "@/services/organizations"

import InstituteForm, { type InstituteFormValues } from "./InstituteForm"

export default function InstitutesList() {
  const [rows, setRows] = useState<Institute[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [meta, setMeta] = useState<any>(null)

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState<Institute | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createServerErrors, setCreateServerErrors] = useState<Partial<Record<keyof InstituteFormValues, string>>>({})
  const [createdCredentials, setCreatedCredentials] = useState<AdminCredentials | null>(null)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)

  const [countryMap, setCountryMap] = useState<Map<number, string>>(new Map())
  const [cityMap, setCityMap] = useState<Map<number, string>>(new Map())
  const [orgMap, setOrgMap] = useState<Map<number, string>>(new Map())

  useEffect(() => {
    ;(async () => {
      try {
        const [countries, cities, orgs] = await Promise.all([
          fetchCountries(),
          listCities(),
          listOrganizations(),
        ])
        setCountryMap(new Map(countries.map((c: any) => [Number(c.id), String(c.name || "")])))
        setCityMap(new Map(cities.map((c: any) => [Number(c.id), String(c.name || "")])))
        setOrgMap(new Map(orgs.map((o: any) => [Number(o.id), String(o.name || "")])))
      } catch {
        // ignore
      }
    })()
  }, [])

  const columns = useMemo<ColumnDef<Institute>[]>(() => [
    { id: "serial", header: "#", cell: ({ row }) => row.index + 1 },
    { id: "name", accessorKey: "name", header: "اسم المعهد" },
    {
      id: "country",
      header: "الدولة",
      cell: ({ row }) => {
        const r: any = row.original
        // API returns country_id only (no nested object); countryMap resolves the name
        const cid = Number(r.country_id ?? r.country?.id)
        return r.country?.name || countryMap.get(cid) || (cid ? `#${cid}` : "—")
      },
    },
    {
      id: "city",
      header: "المدينة",
      cell: ({ row }) => {
        const r: any = row.original
        const cid = Number(r.city_id ?? r.city?.id)
        return r.city?.name || (typeof r.city === "string" ? r.city : null) || cityMap.get(cid) || (cid ? `#${cid}` : "—")
      },
    },
    {
      id: "organization",
      header: "المنظمة",
      cell: ({ row }) => {
        const r: any = row.original
        const oid = Number(r.organization_id ?? r.organization?.id)
        return r.organization?.name || orgMap.get(oid) || (oid ? `#${oid}` : "—")
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
  ], [countryMap, cityMap, orgMap])

  const load = useCallback(async (overrides?: { page?: number; search?: string }) => {
    const nextPage = overrides?.page ?? page
    const nextSearch = overrides?.search ?? search

    setLoading(true)
    try {
      const { data: next, meta: nextMeta } = await listInstitutes({ page: nextPage, per_page: perPage, search: nextSearch })
      console.log("[InstitutesList] load() — rows:", next.length, "meta:", nextMeta)
      setRows(next)
      setMeta(nextMeta)
      return next
    } catch (e: any) {
      setRows([])
      setMeta(null)
      toast.error(e?.response?.data?.message || "تعذر تحميل المعاهد")
      return []
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search])

  useEffect(() => {
    const id = setTimeout(() => load(), 350)
    return () => clearTimeout(id)
  }, [load])

  const onCreate = async (v: InstituteFormValues) => {
    setSubmitting(true)
    setCreateServerErrors({})
    try {
      const created = await createInstitute(v)
      setOpenCreate(false)
      await load()
      toast.success("تم إنشاء المعهد وحساب المدير بنجاح")

      if (created.admin_credentials?.email && created.admin_credentials?.password) {
        setCreatedCredentials(created.admin_credentials)
        setShowCredentialsModal(true)
      }
    } catch (e: any) {
      const backendErrors = (e?.response?.data?.errors ?? {}) as Record<string, string | string[]>
      const nextErrors: Partial<Record<keyof InstituteFormValues, string>> = {
        manager_name: Array.isArray(backendErrors.manager_name)
          ? String(backendErrors.manager_name[0] ?? "")
          : backendErrors.manager_name
            ? String(backendErrors.manager_name)
            : "",
        manager_email: Array.isArray(backendErrors.manager_email)
          ? String(backendErrors.manager_email[0] ?? "")
          : backendErrors.manager_email
            ? String(backendErrors.manager_email)
            : "",
        manager_password: Array.isArray(backendErrors.manager_password)
          ? String(backendErrors.manager_password[0] ?? "")
          : backendErrors.manager_password
            ? String(backendErrors.manager_password)
            : "",
      }
      setCreateServerErrors(nextErrors)
      toast.error(e?.response?.data?.message || "فشل الإضافة")
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async (v: InstituteFormValues) => {
    if (!openEdit) return
    setSubmitting(true)
    try {
      const updated = await updateInstitute(openEdit.id, v)
      setRows((prev) => prev.map((r) => (r.id === openEdit.id ? updated : r)))
      setOpenEdit(null)
      toast.success("تم التعديل بنجاح")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل التعديل")
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm("هل أنت متأكد من حذف هذا المعهد؟")) return
    try {
      await deleteInstitute(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      toast.success("تم الحذف")
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل الحذف")
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      <LoadingBar active={loading} />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end gap-2">
            <Input
              label="بحث"
              placeholder="ابحث باسم المعهد…"
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className="w-64"
            />
            <div className="ms-auto flex items-center gap-2">
              <ExportMenu rows={rows} filename="institutes" />
              <Button onClick={load} variant="outline">
                تحديث
              </Button>
              <Button onClick={() => setOpenCreate(true)}>إضافة معهد</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!loading && rows.length === 0 ? (
            <EmptyState
              title="لا توجد معاهد"
              desc="أضف أول معهد للبدء."
              actionLabel="إضافة معهد"
              onAction={() => setOpenCreate(true)}
            />
          ) : (
            <DataTable columns={columns} data={rows} isLoading={loading} />
          )}

          {!loading && meta && rows.length > 0 && (
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
        title="إضافة معهد"
        formId="add-institute-form"
        submitting={submitting}
      >
        <InstituteForm
          mode="create"
          formId="add-institute-form"
          showActions={false}
          submitting={submitting}
          onSubmit={onCreate}
          serverErrors={createServerErrors}
        />
      </ModalFormShell>

      <Modal
        open={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        title="بيانات دخول مدير المعهد"
        description="تُعرض هذه البيانات مرة واحدة فقط. يُرجى حفظها الآن."
        footer={null}
      >
        <div className="space-y-3" dir="rtl">
          <div className="text-sm text-gray-600">
            تم إنشاء المعهد وحساب مدير المعهد بنجاح.
          </div>

          <div className="rounded-lg border p-3 bg-slate-50">
            <div className="text-xs text-gray-500 mb-1">البريد الإلكتروني</div>
            <div className="font-mono text-sm break-all">{createdCredentials?.email || "—"}</div>
          </div>

          <div className="rounded-lg border p-3 bg-slate-50">
            <div className="text-xs text-gray-500 mb-1">كلمة المرور</div>
            <div className="font-mono text-sm break-all">{createdCredentials?.password || "—"}</div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `email: ${createdCredentials?.email ?? ""}\npassword: ${createdCredentials?.password ?? ""}`
                  )
                  toast.success("تم نسخ البيانات")
                } catch {
                  toast.error("تعذر النسخ التلقائي")
                }
              }}
            >
              نسخ البيانات
            </Button>
            <Button type="button" onClick={() => setShowCredentialsModal(false)}>
              تم
            </Button>
          </div>
        </div>
      </Modal>

      <ModalFormShell open={!!openEdit} onClose={() => setOpenEdit(null)} title="تعديل معهد" formId="edit-institute-form" submitting={submitting}>
        <InstituteForm formId="edit-institute-form" showActions={false} submitting={submitting} defaultValues={openEdit ?? undefined} onSubmit={onEdit} />
      </ModalFormShell>
    </div>
  )
}
