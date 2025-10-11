import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-none disabled:pointer-events-none disabled:opacity-50 outline-none focus:ring-0",
  {
    variants: {
      variant: {
        default: "border border-black px-4 py-3 bg-white hover:bg-black hover:text-white",
        destructive:
          "border border-black px-4 py-3 bg-white hover:bg-red-600 hover:text-white hover:border-red-600",
        outline:
          "border border-black px-4 py-3 bg-white hover:bg-gray-100",
        secondary:
          "border border-black px-4 py-3 bg-white hover:bg-gray-200",
        ghost:
          "border border-black px-4 py-3 bg-transparent hover:bg-black hover:text-white",
        link: "text-black underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12",
        sm: "h-10 px-3 py-2 text-xs",
        lg: "h-14 px-6 py-4 text-base",
        icon: "size-12 p-3",
        "icon-sm": "size-10 p-2",
        "icon-lg": "size-14 p-4",
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
