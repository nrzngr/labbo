import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modernButtonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap text-sm font-bold rounded-2xl transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 outline-none focus:ring-4 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-gray-800 focus:ring-gray-400 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
        outline: "border-2 border-black bg-white hover:bg-black hover:text-white focus:ring-gray-400 hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-gray-100 text-black hover:bg-gray-200 focus:ring-gray-400 border-2 border-transparent hover:border-gray-300",
        ghost: "border-2 border-transparent hover:border-black hover:bg-gray-100 focus:ring-gray-400",
        link: "text-black underline-offset-4 hover:underline hover:text-gray-600 focus:ring-gray-400",
        glass: "glass-morphism border-2 border-black/20 hover:border-black hover:bg-white/80 focus:ring-gray-400 hover:-translate-y-0.5 active:translate-y-0",
        gradient: "gradient-bg border-2 border-black hover:border-gray-800 focus:ring-gray-400 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-5 text-lg",
        icon: "size-12 p-3",
        "icon-sm": "size-10 p-2.5",
        "icon-lg": "size-14 p-4",
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