import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SkeletonTable from "@/components/ui/skeleton-table"
import EmptyState from "@/components/ui/empty-state"

import { listOrganizations } from "@/services/organizations"

type Organization = {
  id: number
  name: string
}

export default function OrganizationsList() {
  const [rows, setRows] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const columns = useMemo<ColumnDef<Organization>[]>(
    () => [
      { header: "#", cell: ({ row }) => row.index + 1 },
      { accessorKey: "name", header: "اسم المنظمة" },
    ],
    []
  )

  const load = async () => {
    setLoading(true)
    try {
      const all = await listOrganizations()
      const mapped = all.map((x) => ({ id: Number(x.id), name: String(x.name || "") }))
      const q = search.trim().toLowerCase()
      setRows(q ? mapped.filter((r) => r.name.toLowerCase().includes(q)) : mapped)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل المنظمات")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="space-y-4" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end gap-2">
            <Input
              label="بحث"
              placeholder="ابحث باسم المنظمة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72"
            />
            <div className="ms-auto flex items-center gap-2">
              <Button onClick={load} variant="outline">
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <SkeletonTable rows={6} cols={2} />
          ) : rows.length === 0 ? (
            <EmptyState title="لا توجد منظمات" desc="لم يتم العثور على أي منظمة." />
          ) : (
            <DataTable columns={columns} data={rows} isLoading={false} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
