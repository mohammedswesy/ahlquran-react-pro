import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PiCaretUpBold, PiCaretDownBold } from "react-icons/pi"

/** ✅ الشكل القديم اللي عندك */
export type SimpleColumn<T> = {
    key: keyof T | string
    label: React.ReactNode
    /** optional render */
    render?: (row: T) => React.ReactNode
    /** optional sortable */
    sortable?: boolean
}

/** ✅ يقبل الاثنين */
type AnyColumns<T> = ColumnDef<T, any>[] | SimpleColumn<T>[]

type Props<T> = {
    columns: AnyColumns<T>
    data: T[]
    isLoading?: boolean
    searchKey?: string
    searchPlaceholder?: string
    pageSizeOptions?: number[]
    defaultPageSize?: number
}

function isColumnDefArray<T>(cols: AnyColumns<T>): cols is ColumnDef<T, any>[] {
    // لو أول عنصر فيه accessorKey / accessorFn / id => ColumnDef
    const c: any = (cols as any[])?.[0]
    return !!c && ("accessorKey" in c || "accessorFn" in c || "id" in c)
}

/** ✅ تحويل الأعمدة البسيطة إلى ColumnDef */
function toTanstackColumns<T>(cols: AnyColumns<T>): ColumnDef<T, any>[] {
    if (isColumnDefArray<T>(cols)) return cols

    const simple = cols as SimpleColumn<T>[]
    return simple.map((c, idx) => {
        const key = String(c.key)

        const col: ColumnDef<T, any> = {
            id: key || `col_${idx}`, // ✅ مهم لتفادي خطأ id
            header: c.label,
            accessorKey: key as any,
            cell: ({ row, getValue }) => {
                if (typeof c.render === "function") return c.render(row.original)
                const v = getValue() as any
                return v == null || v === "" ? "—" : v
            },
            enableSorting: c.sortable ?? true,
        }

        return col
    })
}

export function DataTable<T>({
    columns,
    data,
    isLoading,
    searchKey = "name",
    searchPlaceholder = "بحث…",
    pageSizeOptions = [5, 10, 20, 50],
    defaultPageSize = 10,
}: Props<T>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [globalSearch, setGlobalSearch] = React.useState("")

    /** ✅ columnsNormalized: دائماً ColumnDef */
    const columnsNormalized = React.useMemo<ColumnDef<T, any>[]>(() => toTanstackColumns<T>(columns), [columns])

    const table = useReactTable({
        data,
        columns: columnsNormalized,
        state: { sorting, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: defaultPageSize } },
    })

    // ✅ pick safe search column:
    const safeSearchKey = React.useMemo(() => {
        if (table.getColumn(searchKey)) return searchKey

        // حاول أول accessorKey موجود
        const firstAccessor = columnsNormalized.find((c: any) => typeof c?.accessorKey === "string") as any
        if (firstAccessor?.accessorKey && table.getColumn(firstAccessor.accessorKey)) {
            return firstAccessor.accessorKey as string
        }

        // أو أول id موجود
        const firstId = columnsNormalized.find((c: any) => typeof c?.id === "string") as any
        if (firstId?.id && table.getColumn(firstId.id)) return firstId.id as string

        return "" // no filter column
    }, [columnsNormalized, searchKey, table])

    React.useEffect(() => {
        if (!safeSearchKey) return
        const col = table.getColumn(safeSearchKey)
        if (!col) return
        col.setFilterValue(globalSearch)
    }, [globalSearch, safeSearchKey, table])

    if (isLoading) {
        return (
            <div
                className="w-full rounded-[28px] overflow-hidden"
                style={{
                    background: "#fff",
                    border: "1px solid rgba(0,61,53,.18)",
                    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
                }}
            >
                <div className="animate-pulse space-y-3 p-5">
                    <div className="h-10 rounded-2xl" style={{ background: "rgba(0,61,53,.06)" }} />
                    <div className="h-4 rounded-xl" style={{ background: "rgba(0,61,53,.08)" }} />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-3 rounded-xl" style={{ background: "rgba(0,61,53,.05)" }} />
                    ))}
                </div>
            </div>
        )
    }

    const hasRows = table.getRowModel().rows.length > 0

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div
                className="rounded-[28px] p-3 flex flex-col md:flex-row gap-2 md:items-center md:justify-between"
                style={{
                    background: "#fff",
                    border: "1px solid rgba(0,61,53,.18)",
                    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
                }}
            >
                <div className="flex-1">
                    <Input
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-10"
                        disabled={!safeSearchKey}
                    />
                    <div className="text-[11px] mt-1" style={{ color: "rgba(2,8,7,.60)" }}>
                        البحث يعمل على عمود: <span className="font-semibold">{safeSearchKey || "—"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-xs" style={{ color: "rgba(2,8,7,.60)" }}>
                        حجم الصفحة
                    </div>

                    <select
                        className="h-10 rounded-2xl px-3 text-sm"
                        style={{
                            background: "#fff",
                            border: "1px solid rgba(0,61,53,.22)",
                            color: "#04110f",
                        }}
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                    >
                        {pageSizeOptions.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>

                    <Button
                        variant="outline"
                        onClick={() => {
                            setGlobalSearch("")
                            table.resetColumnFilters()
                            table.resetSorting()
                        }}
                    >
                        تصفير
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div
                className="w-full rounded-[28px] overflow-x-auto"
                style={{
                    background: "#fff",
                    border: "1px solid rgba(0,61,53,.18)",
                    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
                }}
            >
                <table className="min-w-full text-sm">
                    <thead
                        style={{
                            background: "rgba(0,61,53,.03)",
                            borderBottom: "1px solid rgba(0,61,53,.12)",
                        }}
                    >
                        {table.getHeaderGroups().map((hg) => (
                            <tr key={hg.id}>
                                {hg.headers.map((header) => {
                                    const canSort = header.column.getCanSort()
                                    const sort = header.column.getIsSorted()

                                    return (
                                        <th key={header.id} className="px-4 py-3 text-right font-bold" style={{ color: "#04110f" }}>
                                            <div className="flex items-center gap-2 justify-start">
                                                <div className="flex-1">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </div>

                                                {canSort && (
                                                    <button
                                                        className="p-1 rounded-xl transition"
                                                        style={{ background: "transparent" }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,61,53,.06)")}
                                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        title="ترتيب"
                                                    >
                                                        {sort === "asc" ? (
                                                            <PiCaretUpBold />
                                                        ) : sort === "desc" ? (
                                                            <PiCaretDownBold />
                                                        ) : (
                                                            <span style={{ opacity: 0.6 }}>↕</span>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {!hasRows ? (
                            <tr>
                                <td colSpan={columnsNormalized.length} className="p-10 text-center">
                                    <div className="text-sm font-semibold" style={{ color: "#04110f" }}>
                                        لا توجد بيانات
                                    </div>
                                    <div className="text-xs mt-1" style={{ color: "rgba(2,8,7,.60)" }}>
                                        جرّب تغيير البحث أو إضافة عناصر جديدة.
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="transition"
                                    style={{ background: "transparent", borderTop: "1px solid rgba(0,61,53,.10)" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,61,53,.04)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3" style={{ color: "#04110f" }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div
                className="rounded-[28px] p-3 flex flex-col md:flex-row gap-2 md:items-center md:justify-between"
                style={{
                    background: "#fff",
                    border: "1px solid rgba(0,61,53,.18)",
                    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
                }}
            >
                <div className="text-xs" style={{ color: "rgba(2,8,7,.60)" }}>
                    صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()} — الإجمالي:{" "}
                    {table.getFilteredRowModel().rows.length}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>
                        أول
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        السابق
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        التالي
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
                        آخر
                    </Button>
                </div>
            </div>
        </div>
    )
}
