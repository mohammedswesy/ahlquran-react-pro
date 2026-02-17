// src/pages/admin/ParentsList.tsx
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { DataTable } from "@/components/ui/datatable"
import type { ColumnDef } from "@tanstack/react-table"
import { fetchParents, type ParentRow } from "@/services/parents"
import { Button } from "@/components/ui/button"

function relToAr(rel?: string | null) {
  const v = (rel || "").toLowerCase()
  if (v === "father") return "أب"
  if (v === "mother") return "أم"
  if (v === "guardian") return "ولي"
  return rel || "—"
}

export default function ParentsList() {
  const [rows, setRows] = useState<ParentRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await fetchParents({ per_page: 200 })
      setRows(res.data || [])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const columns: ColumnDef<ParentRow>[] = useMemo(
    () => [
      {
        id: "name",
        header: "الاسم",
        accessorFn: (row) => row.user?.name ?? "",
        cell: ({ row }) => row.original.user?.name ?? "—",
      },
      {
        id: "relation_type",
        header: "صلة القرابة",
        accessorFn: (row) => row.relation_type ?? "",
        cell: ({ row }) => relToAr(row.original.relation_type),
      },
      {
        id: "children_count",
        header: "عدد الأبناء",
        accessorFn: (row) => Number(row.children_count ?? 0),
        cell: ({ row }) => Number(row.original.children_count ?? 0),
      },
      {
        id: "contact",
        header: "التواصل",
        cell: ({ row }) => {
          const u = row.original.user
          return (
            <div className="flex flex-col gap-1">
              {u?.mobile ? <span>📱 {u.mobile}</span> : <span className="text-gray-400">—</span>}
              {u?.email ? <span className="text-gray-500">✉️ {u.email}</span> : null}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) => {
          const id = row.original.id
          return (
            <div className="flex items-center gap-2">
              <Link
                to={`/admin/parents/${id}`}
                className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-50"
              >
                عرض
              </Link>
              <Link
                to={`/admin/parents/${id}/edit`}
                className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-50"
              >
                تعديل
              </Link>
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <AppLayout>
      <Header
        title="أولياء الأمور"
        subtitle="إدارة أولياء الأمور وربطهم بأبنائهم"
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load}>
              تحديث
            </Button>
            <Link to="/admin/parents/create">
              <Button>+ إضافة ولي أمر</Button>
            </Link>
          </div>
        }
      />

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          searchKey="name"
          searchPlaceholder="ابحث باسم ولي الأمر…"
          defaultPageSize={10}
        />
      </div>
    </AppLayout>
  )
}
