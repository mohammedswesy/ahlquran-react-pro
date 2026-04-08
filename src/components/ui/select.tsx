// src/components/ui/select.tsx
import * as React from "react"
import * as RadixSelect from "@radix-ui/react-select"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export const Select = RadixSelect.Root

export const SelectGroup = RadixSelect.Group

export const SelectValue = RadixSelect.Value

export const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof RadixSelect.Trigger>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>
>(({ className, children, ...props }, ref) => (
    <RadixSelect.Trigger
        ref={ref}
        className={cn(
            "inline-flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all",
            "focus:outline-none focus:ring-2 focus:border-[var(--brand)]",
            className
        )}
        style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
        }}
        {...props}
    >
        {children}
        <RadixSelect.Icon>
            <ChevronsUpDown className="size-4" style={{ color: "var(--muted)" }} />
        </RadixSelect.Icon>
    </RadixSelect.Trigger>
))
SelectTrigger.displayName = "SelectTrigger"

export const SelectContent = React.forwardRef<
    React.ElementRef<typeof RadixSelect.Content>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, ...props }, ref) => (
    <RadixSelect.Portal>
        <RadixSelect.Content
            ref={ref}
            className={cn(
                "z-50 min-w-[8rem] overflow-hidden rounded-lg border shadow-lg",
                className
            )}
            style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
            }}
            position="popper"
            sideOffset={8}
            {...props}
        >
            <RadixSelect.Viewport className="p-2">{children}</RadixSelect.Viewport>
        </RadixSelect.Content>
    </RadixSelect.Portal>
))
SelectContent.displayName = "SelectContent"

export const SelectItem = React.forwardRef<
    React.ElementRef<typeof RadixSelect.Item>,
    React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
    <RadixSelect.Item
        ref={ref}
        className={cn(
            "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors",
            "data-[highlighted]:bg-[rgba(0,61,53,0.1)]",
            className
        )}
        style={{
            color: "var(--text)",
        }}
        {...props}
    >
        <RadixSelect.ItemIndicator className="absolute left-2 rtl:left-auto rtl:right-2">
            <Check className="size-4" style={{ color: "var(--brand)" }} />
        </RadixSelect.ItemIndicator>
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
))
SelectItem.displayName = "SelectItem"
