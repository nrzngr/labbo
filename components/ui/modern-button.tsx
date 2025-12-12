import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modernButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold rounded-[14px] transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-[#f7f6fb]",
  {
    variants: {
      variant: {
        default: "bg-[#ff007a] text-white shadow-[0_20px_45px_rgba(255,0,122,0.35)] hover:bg-[#e6006f] hover:shadow-[0_18px_40px_rgba(255,0,122,0.45)] focus:ring-[rgba(255,0,122,0.35)] hover:-translate-y-0.5 active:translate-y-0",
        destructive: "bg-[#f04438] text-white shadow-[0_15px_35px_rgba(240,68,56,0.25)] hover:bg-[#d63a30] focus:ring-[rgba(240,68,56,0.35)] hover:-translate-y-0.5 active:translate-y-0",
        outline: "border border-[#ff007a] text-[#ff007a] bg-transparent hover:bg-[#ff007a] hover:text-white focus:ring-[rgba(255,0,122,0.25)] hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-white text-[#111827] border border-[#dfe2ec] hover:border-[#ff007a] hover:text-[#ff007a] focus:ring-[rgba(255,0,122,0.2)]",
        ghost: "border border-transparent text-[#6d7079] hover:text-[#ff007a] hover:bg-[#ffe4f2] focus:ring-[rgba(255,0,122,0.15)]",
        link: "text-[#ff007a] underline-offset-4 hover:underline hover:text-[#e6006f] focus:ring-[rgba(255,0,122,0.2)]",
        glass: "glass-morphism border border-white/30 text-[#111827] hover:border-[#ff007a] hover:text-[#ff007a] focus:ring-[rgba(255,0,122,0.2)] hover:-translate-y-0.5 active:translate-y-0",
        gradient: "bg-[radial-gradient(circle_at_top_right,_rgba(255,0,122,0.85),_rgba(255,0,122,0.65))] text-white shadow-[0_22px_48px_rgba(255,0,122,0.38)] hover:shadow-[0_20px_42px_rgba(255,0,122,0.48)] focus:ring-[rgba(255,0,122,0.35)] hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-5 text-xs",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ModernButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof modernButtonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    asChild = false,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(modernButtonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            Loading...
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    )
  }
)
ModernButton.displayName = "ModernButton"

export { ModernButton, modernButtonVariants }
