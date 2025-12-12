import * as React from "react"
import { cn } from "@/lib/utils"

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated" | "gradient" | "outline"
  padding?: "none" | "sm" | "md" | "lg" | "xl"
  hover?: boolean
  children: React.ReactNode
}

export const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, variant = "default", padding = "lg", hover = false, children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-white border border-[#dfe2ec] shadow-[0_25px_55px_rgba(17,24,39,0.06)]",
      glass: "glass-morphism border border-white/40 shadow-[0_25px_55px_rgba(17,24,39,0.04)]",
      elevated: "bg-white border border-[#d6dae7] shadow-[0_35px_70px_rgba(17,24,39,0.08)]",
      gradient: "bg-[linear-gradient(135deg,#ffeaf5_0%,#ffffff_40%,#eef0f8_100%)] border border-transparent shadow-[0_35px_70px_rgba(255,0,122,0.12)]",
      outline: "bg-transparent border border-[#ff007a]/40"
    }

    const paddingStyles = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      xl: "p-10"
    }

    const hoverStyles = hover ? "card-hover cursor-pointer" : ""

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-300 ease-in-out",
          variantStyles[variant],
          paddingStyles[padding],
          hoverStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModernCard.displayName = "ModernCard"

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
}

export const ModernCardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {title && (
            <h3 className="text-2xl font-black tracking-tight text-gray-900">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 font-medium">
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
)

ModernCardHeader.displayName = "ModernCardHeader"

type CardContentProps = React.HTMLAttributes<HTMLDivElement>

export const ModernCardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-6", className)} {...props} />
  )
)

ModernCardContent.displayName = "ModernCardContent"

type CardFooterProps = React.HTMLAttributes<HTMLDivElement>

export const ModernCardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-6", className)}
      {...props}
    />
  )
)

ModernCardFooter.displayName = "ModernCardFooter"
