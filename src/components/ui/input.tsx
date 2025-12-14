import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full bg-secondary/50 text-foreground placeholder:text-muted-foreground",
          "rounded-xl px-4 py-3",
          "outline-none ring-0 border-0",
          "transition-all duration-300",
          "focus:bg-secondary/80 focus:ring-1 focus:ring-white/10",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
