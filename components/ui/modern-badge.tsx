import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modernBadgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-black bg-black text-white shadow-md hover:shadow-lg",
        secondary: "border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200",
        destructive: "border-red-600 bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg",
        outline: "border-black bg-transparent text-black hover:bg-black hover:text-white",
        success: "border-green-600 bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg",
        warning: "border-yellow-500 bg-yellow-500 text-black shadow-md hover:bg-yellow-600 hover:shadow-lg",
        info: "border-blue-600 bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg",
        glass: "glass-morphism border-black/20 text-black hover:border-black/40",
        gradient: "gradient-bg border-black text-black hover:border-gray-800",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        md: "px-3 py-1.5 text-sm",
        lg: "px-4 py-2 text-base",
        xl: "px-6 py-3 text-lg",
      },
      interactive: {
        true: "cursor-pointer hover:scale-105 active:scale-95",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  }
)

export interface ModernBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modernBadgeVariants> {
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
}

const ModernBadge = React.forwardRef<HTMLDivElement, ModernBadgeProps>(
  ({ className, variant, size, interactive, dot, removable, onRemove, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(modernBadgeVariants({ variant, size, interactive }), className)}
        {...props}
      >
        {dot && (
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              variant === "success" && "bg-green-400",
              variant === "warning" && "bg-yellow-400",
              variant === "destructive" && "bg-red-400",
              variant === "info" && "bg-blue-400",
              variant === "default" && "bg-white"
            )}
          />
        )}
        <span>{children}</span>
        {removable && (
          <button
            onClick={onRemove}
            className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)
ModernBadge.displayName = "ModernBadge"

export { ModernBadge, modernBadgeVariants }