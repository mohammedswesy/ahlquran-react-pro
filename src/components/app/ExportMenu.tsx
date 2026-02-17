import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandInput } from "@/components/ui/command"
import { Download } from "lucide-react"
import { toCSV, toXLSX } from "@/lib/exporters"

type Props<T> = {
    rows: T[]
    filename?: string
    enableXlsx?: boolean // مرّر true لو منصّب xlsx
}

export default function ExportMenu<T>({ rows, filename = "export", enableXlsx = true }: Props<T>) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    تصدير
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-56 p-0" align="end">
                <Command>
                    <CommandInput placeholder="ابحث عن صيغة…" className="text-right" />
                    <CommandEmpty>لا نتائج.</CommandEmpty>
                    <CommandGroup>
                        <CommandItem
                            value="csv"
                            onSelect={() => toCSV(rows as any[], `${filename}.csv`)}
                        >
                            CSV
                        </CommandItem>

                        {enableXlsx && (
                            <CommandItem
                                value="xlsx"
                                onSelect={() => toXLSX(rows as any[], `${filename}.xlsx`)}
                            >
                                Excel (XLSX)
                            </CommandItem>
                        )}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
