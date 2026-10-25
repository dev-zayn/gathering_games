import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Toggle as TogglePrimitive } from "radix-ui"

const toggleVariants = cva(
  "group/toggle inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold whitespace-nowrap text-ink transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "rounded-control hover:bg-slab-raised data-[state=on]:bg-slab-raised",
        /** A tile on a slab that takes the brass when picked — the match's length. */
        tile: "rounded-control border border-hairline-strong bg-slab-raised text-ink-soft data-[state=on]:border-brass data-[state=on]:bg-brass-soft data-[state=on]:text-brass-lit",
      },
      size: {
        default: "h-10 px-3.5 text-13",
        lg: "h-11 px-3.5 text-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
