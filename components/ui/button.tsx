import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold rounded-[14px] transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus:ring-4 focus:ring-[rgba(255,0,122,0.25)] focus:ring-offset-2 focus:ring-offset-[#f7f6fb]",
  {
    variants: {
      variant: {
        default: "px-5 py-3 bg-[#ff007a] text-white shadow-[0_20px_45px_rgba(255,0,122,0.35)] hover:bg-[#e6006f] hover:shadow-[0_18px_40px_rgba(255,0,122,0.45)]",
        destructive:
          "px-5 py-3 bg-[#f04438] text-white shadow-[0_15px_35px_rgba(240,68,56,0.25)] hover:bg-[#d63a30]",
        outline:
          "px-5 py-3 border border-[#ff007a] bg-white text-[#ff007a] hover:bg-[#ffe4f2]",
        secondary:
          "px-5 py-3 border border-[#dfe2ec] bg-white text-[#111827] hover:border-[#ff007a] hover:text-[#ff007a]",
        ghost:
          "px-5 py-3 border border-transparent bg-transparent text-[#6d7079] hover:text-[#ff007a] hover:bg-[#ffe4f2]",
        link: "text-[#ff007a] underline-offset-4 hover:underline hover:text-[#e6006f]",
      },
      size: {
        default: "h-12",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-14 px-7 py-4 text-base",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
