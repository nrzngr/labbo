import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full px-3 py-3 border border-black bg-white focus:ring-0 focus:border-black outline-none transition-none placeholder-gray-400 resize-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
