// import * as React from "react"
// import { cn } from "@/lib/utils"

// type Props = React.InputHTMLAttributes<HTMLInputElement> & {
//   label?: string
//   hint?: string
// }

// export const Input = React.forwardRef<HTMLInputElement, Props>(
//   ({ className, label, hint, id, ...props }, ref) => {
//     const input = (
//       <input
//         id={id}
//         ref={ref}
//         className={cn(
//           "w-full rounded-2xl px-4 py-3 text-sm",
//           "bg-white",
//           "border border-[rgba(0,61,53,.22)]",
//           "text-[#003d35] placeholder:text-[rgba(0,61,53,.45)]",
//           "focus:outline-none focus:ring-4 focus:ring-[rgba(0,61,53,.15)]",
//           "transition-all",
//           className
//         )}
//         {...props}
//       />
//     )

//     if (!label) return input

//     return (
//       <label className="block space-y-1">
//         <span className="text-sm text-[rgba(0,61,53,.7)]">{label}</span>
//         {input}
//         {hint && <span className="text-xs text-[rgba(0,61,53,.55)]">{hint}</span>}
//       </label>
//     )
//   }
// )
// Input.displayName = "Input"

import * as React from "react"
import { cn } from "@/lib/utils"

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ className, label, hint, id, ...props }, ref) => {
    const input = (
      <input
        id={id}
        ref={ref}
        className={cn(
          "w-full rounded-2xl px-4 py-3 text-sm",
          "bg-white/70 backdrop-blur",
          "border border-[var(--border)]",
          "text-[var(--text)] placeholder:text-[rgba(2,8,7,.45)]",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]",
          "transition-all",
          className
        )}
        {...props}
      />
    )

    if (!label) return input

    return (
      <label className="block space-y-1">
        <span className="text-sm text-[rgba(0,61,53,.7)]">{label}</span>
        {input}
        {hint && <span className="text-xs text-[rgba(0,61,53,.55)]">{hint}</span>}
      </label>
    )
  }
)
Input.displayName = "Input"
