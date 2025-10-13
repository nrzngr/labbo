import * as React from "react"
import { cn } from "@/lib/utils"

interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label?: string
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "secondary" | "danger"
}

export const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, icon, label, position = "bottom-right", size = "md", variant = "primary", ...props }, ref) => {
    const positionStyles = {
      "bottom-right": "bottom-6 right-6",
      "bottom-left": "bottom-6 left-6",
      "top-right": "top-6 right-6",
      "top-left": "top-6 left-6"
    }

    const sizeStyles = {
      sm: "w-12 h-12",
      md: "w-14 h-14",
      lg: "w-16 h-16"
    }

    const variantStyles = {
      primary: "bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl",
      secondary: "bg-white text-black border-2 border-black hover:bg-gray-100",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl"
    }

    return (
      <button
        ref={ref}
        className={cn(
          "fixed z-50 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95",
          positionStyles[position],
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon}
          {label && (
            <span className="hidden sm:inline-block font-medium whitespace-nowrap">
              {label}
            </span>
          )}
        </div>
      </button>
    )
  }
)

FAB.displayName = "FAB"