import { useEffect, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable } from "@/components/ui/datatable"
import { Button } from "@/components/ui/button"
import { listBillings, type Billing } from "@/services/billings"

export default function BillingsList() {
  const [rows, setRows] = useState<Billing[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await listBillings({ per_page: 100 })
      const list: Billing[] = Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray(data)
          ? data
          : []
      setRows(list)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "تعذر تحميل الفواتير")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const columns = useMemo<ColumnDef<Billing>[]>(
    () => [
      { header: "#", cell: ({ row }) => row.index + 1 },
      { accessorKey: "reference", header: "المرجع" },
      { accessorKey: "enrollment_id", header: "رقم التسجيل" },
      { accessorKey: "amount", header: "المبلغ" },
      { accessorKey: "payment_method", header: "طريقة الدفع" },
      { accessorKey: "created_at", header: "التاريخ" },
    ],
    []
  )

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-right">الفواتير</h2>
            <Button variant="outline" onClick={load}>تحديث</Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rows} isLoading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
