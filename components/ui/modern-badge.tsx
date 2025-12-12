import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modernBadgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgba(255,0,122,0.25)] focus:ring-offset-2 focus:ring-offset-[#f7f6fb]",
  {
    variants: {
      variant: {
        default: "border-[#ff007a] bg-[#ff007a] text-white shadow-[0_12px_24px_rgba(255,0,122,0.25)] hover:shadow-[0_14px_28px_rgba(255,0,122,0.3)]",
        secondary: "border-transparent bg-[#f3f4fb] text-[#4b5563] hover:bg-[#e9ebf5]",
        destructive: "border-transparent bg-[#f04438] text-white shadow-[0_10px_22px_rgba(240,68,56,0.25)] hover:bg-[#d63a30]",
        outline: "border-[#ff007a] bg-transparent text-[#ff007a] hover:bg-[#ffe4f2]",
        success: "border-transparent bg-[#22c55e] text-white shadow-[0_10px_22px_rgba(34,197,94,0.28)] hover:bg-[#1eab53]",
        warning: "border-transparent bg-[#facc15] text-[#111827] shadow-[0_10px_22px_rgba(250,204,21,0.25)] hover:bg-[#f4bf0f]",
        info: "border-transparent bg-[#0ea5e9] text-white shadow-[0_10px_22px_rgba(14,165,233,0.28)] hover:bg-[#0989c4]",
        glass: "glass-morphism border-white/40 text-[#111827] hover:border-[#ff007a] hover:text-[#ff007a]",
        gradient: "bg-[linear-gradient(135deg,#ff88c4_0%,#ff007a_100%)] text-white border-transparent shadow-[0_14px_30px_rgba(255,0,122,0.28)]",
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
          <div className="w-2 h-2 rounded-full bg-white/80" />
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
