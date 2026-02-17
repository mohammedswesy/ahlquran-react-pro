import { useEffect, useMemo, useState } from "react"
import AppLayout from "@/layouts/AppLayout"
import Header from "@/components/ui/Header"
import { DataTable } from "@/components/ui/datatable"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import api from "@/services/api"
import { toast } from "sonner"

type Person = {
  id: number
  name: string
  role?: string | null
  email?: string | null
  phone?: string | null
}

export default function People() {
  const [all, setAll] = useState<Person[]>([])
  const [rows, setRows] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const { data } = await api.get("/employee/people", { params: { per_page: 200 } })
        const src: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
        const mapped = src.map(p => ({
          id: Number(p?.id ?? 0),
          name: String(p?.name ?? "").trim(),
          role: p?.role ?? p?.position ?? null,
          email: p?.email ?? null,
          phone: p?.phone ?? null,
        }))
        setAll(mapped); setRows(mapped)
      } catch {
        toast.info("سيتم ربط دليل الأشخاص حال تجهيز الـ API")
        const fallback = [
          { id: 1, name: "Ahmad", role: "Teacher", email: "ahmad@example.com", phone: "0599000000" },
          { id: 2, name: "Mona", role: "Employee", email: "mona@example.com", phone: "0599111111" },
        ]
        setAll(fallback); setRows(fallback)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const s = q.trim().toLowerCase()
    if (!s) { setRows(all); return }
    setRows(all.filter(r =>
      r.name.toLowerCase().includes(s) ||
      (r.role ?? "").toLowerCase().includes(s) ||
      (r.email ?? "").toLowerCase().includes(s)
    ))
  }, [q, all])

  const cols = useMemo(() => [
    { key: "name", label: "الاسم" },
    { key: "role", label: "الدور" },
    { key: "email", label: "البريد" },
    { key: "phone", label: "الهاتف" },
  ], [])

  return (
    <AppLayout>
      <Header />
      <div className="p-6 space-y-4" dir="rtl">
        <div className="flex items-end gap-2">
          <div className="w-64">
            <Input
              label="بحث"
              placeholder="ابحث بالاسم/الدور/البريد…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setQ("")}>مسح البحث</Button>
        </div>

        <DataTable data={rows} columns={cols as any} isLoading={loading} />
      </div>
    </AppLayout>
  )
}
