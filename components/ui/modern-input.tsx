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
      default: "border border-[#dfe2ec] bg-white focus:border-[#ff007a] focus:ring-[rgba(255,0,122,0.16)]",
      filled: "border border-[#dfe2ec] bg-[#eef0f8] focus:bg-white focus:border-[#ff007a] focus:ring-[rgba(255,0,122,0.16)]",
      underline: "border-0 border-b border-[#dfe2ec] bg-transparent focus:border-[#ff007a] focus:ring-0 rounded-none px-0",
      ghost: "border border-transparent bg-transparent hover:border-[#dfe2ec] focus:border-[#ff007a] focus:ring-[rgba(255,0,122,0.12)]"
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
              "flex h-12 w-full rounded-[16px] px-5 py-3 text-[15px] font-medium text-[#1f2937] transition-all duration-200 placeholder:text-[#9aa1b3] disabled:cursor-not-allowed disabled:opacity-50",
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
