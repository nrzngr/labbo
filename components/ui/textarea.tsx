import * as React from "react"

import { cn } from "@/lib/utils"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "filled" | "underline" | "ghost"
  error?: boolean
}

function Textarea({ className, variant = "default", error, ...props }: TextareaProps) {
  const variantStyles = {
    default: "border border-[#dfe2ec] bg-white focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)]",
    filled: "border border-[#dfe2ec] bg-[#eef0f8] focus:bg-white focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.16)]",
    underline: "border-0 border-b border-[#dfe2ec] bg-transparent focus:border-[#ff007a] focus:ring-0 rounded-none px-0",
    ghost: "border border-transparent bg-transparent hover:border-[#dfe2ec] focus:border-[#ff007a] focus:ring-4 focus:ring-[rgba(255,0,122,0.12)]"
  }

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-[16px] px-5 py-4 text-[15px] font-medium text-[#1f2937] transition-all duration-200 placeholder:text-[#9aa1b3] disabled:cursor-not-allowed disabled:opacity-50 outline-none resize-none",
        variantStyles[variant],
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
