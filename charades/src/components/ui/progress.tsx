import * as React from "react"
import { cn } from "@/lib/utils"
import { Progress as ProgressPrimitive } from "radix-ui"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const missing = 100 - Math.min(100, Math.max(0, value ?? 0))
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-2 w-full items-center overflow-hidden rounded-full bg-divider",
        className
      )}
      value={value}
      {...props}
    >
      {/* Full width, pushed toward the END edge by the share that's missing,
          so the fill always grows from the start — the right, in Arabic. */}
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 -translate-x-(--progress-missing) rounded-full bg-primary transition-transform duration-500 ease-out-soft rtl:translate-x-(--progress-missing)"
        style={{ "--progress-missing": `${String(missing)}%` } as React.CSSProperties}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
