import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: "sm" | "md" | "lg" | "xl"
}

export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ className, children, cols = { sm: 1, md: 2, lg: 3, xl: 4 }, gap = "md", ...props }, ref) => {
    const gapStyles = {
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
      xl: "gap-10"
    }

    const gridCols = {
      sm: `grid-cols-${cols.sm || 1}`,
      md: `md:grid-cols-${cols.md || 2}`,
      lg: `lg:grid-cols-${cols.lg || 3}`,
      xl: `xl:grid-cols-${cols.xl || 4}`
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gapStyles[gap],
          gridCols.sm,
          gridCols.md,
          gridCols.lg,
          gridCols.xl,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveGrid.displayName = "ResponsiveGrid"

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  span?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, children, span, ...props }, ref) => {
    const spanStyles = span ? {
      sm: span.sm ? `sm:col-span-${span.sm}` : '',
      md: span.md ? `md:col-span-${span.md}` : '',
      lg: span.lg ? `lg:col-span-${span.lg}` : '',
      xl: span.xl ? `xl:col-span-${span.xl}` : ''
    } : {}

    return (
      <div
        ref={ref}
        className={cn(
          spanStyles.sm,
          spanStyles.md,
          spanStyles.lg,
          spanStyles.xl,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GridItem.displayName = "GridItem"