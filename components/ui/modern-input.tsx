import * as React from "react"
import { cn } from "@/lib/utils"

export interface ModernInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: "default" | "filled" | "underline" | "ghost"
}

const ModernInput = React.forwardRef<HTMLInputElement, ModernInputProps>(
  ({
    className,
    type = "text",
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = "default",
    id,
    ...props
  }, ref) => {
    const generatedId = React.useId()
    const inputId = id || `input-${generatedId}`

    const variantStyles = {
      default: "border-2 border-gray-300 bg-white focus:border-black focus:ring-4 focus:ring-black/10",
      filled: "border-2 border-transparent bg-gray-100 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/10",
      underline: "border-0 border-b-2 border-gray-300 bg-transparent focus:border-black focus:ring-0 rounded-none px-0",
      ghost: "border-2 border-transparent bg-transparent hover:border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10"
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold text-gray-900"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-12 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
              variantStyles[variant],
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm font-medium text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    )
  }
)
ModernInput.displayName = "ModernInput"

export { ModernInput }