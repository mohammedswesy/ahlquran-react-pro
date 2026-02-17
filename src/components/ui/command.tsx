// src/components/ui/command.tsx
import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@/lib/utils"

export function Command({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive>) {
    return (
        <CommandPrimitive
            className={cn(
                "flex w-full flex-col overflow-hidden rounded-xl border bg-white text-sm",
                className
            )}
            {...props}
        />
    )
}

export const CommandInput = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Input>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
    <div className="p-2">
        <CommandPrimitive.Input
            ref={ref}
            className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm outline-none",
                "focus:ring-2 focus:ring-emerald-600",
                className
            )}
            {...props}
        />
    </div>
))
CommandInput.displayName = "CommandInput"

export const CommandList = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.List
        ref={ref}
        className={cn("max-h-64 overflow-y-auto p-1", className)}
        {...props}
    />
))
CommandList.displayName = "CommandList"

export const CommandEmpty = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Empty>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Empty
        ref={ref}
        className={cn("px-3 py-6 text-center text-gray-500", className)}
        {...props}
    />
))
CommandEmpty.displayName = "CommandEmpty"

export const CommandGroup = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Group>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Group
        ref={ref}
        className={cn("space-y-1 p-1", className)}
        {...props}
    />
))
CommandGroup.displayName = "CommandGroup"

export const CommandItem = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
    <CommandPrimitive.Item
        ref={ref}
        className={cn(
            "flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-2",
            "aria-selected:bg-emerald-50 aria-selected:text-emerald-900",
            className
        )}
        {...props}
    />
))
CommandItem.displayName = "CommandItem"
