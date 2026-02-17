// import * as React from "react"
// import { cn } from "@/lib/utils"

// const Card = React.forwardRef<
//     HTMLDivElement,
//     React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
//     <div
//         ref={ref}
//         className={cn(
//             "rounded-[28px] border",
//             "bg-[#fefefe]",
//             "text-[#003d35]",

//             "border-[rgba(0,61,53,.18)]",
//             "shadow-[0_8px_24px_rgba(0,61,53,.08)]",
//             className
//         )}
//         {...props}
//     />
// ))
// Card.displayName = "Card"

// const CardHeader = React.forwardRef<
//     HTMLDivElement,
//     React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
//     <div
//         ref={ref}
//         className={cn(
//             "p-5 border-b",
//             "border-[rgba(0,61,53,.14)]",
//             className
//         )}
//         {...props}
//     />
// ))
// CardHeader.displayName = "CardHeader"

// const CardTitle = React.forwardRef<
//     HTMLHeadingElement,
//     React.HTMLAttributes<HTMLHeadingElement>
// >(({ className, ...props }, ref) => (
//     <h3
//         ref={ref}
//         className={cn(
//             "text-base font-extrabold",
//             "text-[#003d35]",
//             className
//         )}
//         {...props}
//     />
// ))
// CardTitle.displayName = "CardTitle"

// const CardDescription = React.forwardRef<
//     HTMLParagraphElement,
//     React.HTMLAttributes<HTMLParagraphElement>
// >(({ className, ...props }, ref) => (
//     <p
//         ref={ref}
//         className={cn(
//             "text-xs",
//             "text-[rgba(0,61,53,.65)]",
//             className
//         )}
//         {...props}
//     />
// ))
// CardDescription.displayName = "CardDescription"

// const CardContent = React.forwardRef<
//     HTMLDivElement,
//     React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
//     <div ref={ref} className={cn("p-5 text-[#003d35]", className)} {...props} />
// ))
// CardContent.displayName = "CardContent"

// const CardFooter = React.forwardRef<
//     HTMLDivElement,
//     React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
//     <div
//         ref={ref}
//         className={cn(
//             "p-5 border-t",
//             "border-[rgba(0,61,53,.14)]",
//             className
//         )}
//         {...props}
//     />
// ))
// CardFooter.displayName = "CardFooter"

// export {
//     Card,
//     CardHeader,
//     CardTitle,
//     CardDescription,
//     CardContent,
//     CardFooter,
// }

import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "rounded-[28px] border bg-white/70 backdrop-blur",
                "text-[var(--text)] border-[var(--border)] shadow-[var(--shadow2)]",
                className
            )}
            {...props}
        />
    )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("p-5 border-b border-[var(--border)]", className)} {...props} />
    )
)
CardHeader.displayName = "CardHeader"

export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={`text-lg font-semibold leading-none tracking-tight ${className}`}
            {...props}
        />
    )
}


const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5", className)} {...props} />
)
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardContent, }



