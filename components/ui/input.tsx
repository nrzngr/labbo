import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full px-3 py-3 border border-black bg-white focus:ring-0 focus:border-black outline-none transition-none placeholder-gray-400",
        className
      )}
      {...props}
    />
  )
}

export { Input }
