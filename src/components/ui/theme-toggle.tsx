"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const ThemeToggle = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
      setMounted(true)
    }, [])

    const isDark = resolvedTheme === "dark"

    const handleToggle = () => {
      setTheme(isDark ? "light" : "dark")
    }

    if (!mounted) {
      return <div className="h-5 w-10 rounded-full bg-muted animate-pulse" />
    }

    return (
      <label className="relative inline-block h-5 w-10 cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={isDark}
          onChange={handleToggle}
          className={cn(
            "peer sr-only",
            className
          )}
          {...props}
        />
        <span className={cn(
          "absolute inset-0 rounded-full bg-muted transition-colors duration-300",
          "peer-checked:bg-primary/20"
        )} />
        <span className={cn(
          "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-muted-foreground/50 transition-all duration-300",
          "peer-checked:translate-x-5 peer-checked:bg-primary"
        )} />
      </label>
    )
  }
)
ThemeToggle.displayName = "ThemeToggle"

export { ThemeToggle }
