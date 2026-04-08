import * as React from "react"
import { cn } from "@/lib/utils"
import { PiWarningBold } from "react-icons/pi"

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ className, label, hint, error, icon, id, ...props }, ref) => {
    const input = (
      <div className="relative">
        {icon && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted)" }}
          >
            {icon}
          </div>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-xl px-4 py-2.5 text-sm transition-all",
            "bg-[var(--surface)]",
            "border",
            "text-[var(--text)] placeholder:text-[var(--muted)]",
            "focus:outline-none focus:ring-2",
            error
              ? "border-red-400 focus:ring-red-300 focus:border-red-400"
              : "border-[var(--border)] focus:ring-[var(--ring)] focus:border-[var(--brand)]",
            icon && "pr-10",
            className
          )}
          {...props}
        />
      </div>
    )

    if (!label) return input

    return (
      <label className="block space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {label}
          </span>
          {error && (
            <span className="text-xs flex items-center gap-1" style={{ color: "#dc2626" }}>
              <PiWarningBold size={14} />
              {error}
            </span>
          )}
        </div>
        {input}
        {hint && !error && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {hint}
          </span>
        )}
      </label>
    )
  }
)
Input.displayName = "Input"
