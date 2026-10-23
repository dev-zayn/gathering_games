import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Toggle as TogglePrimitive } from "radix-ui"

const toggleVariants = cva(
  "group/toggle inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold whitespace-nowrap text-ink transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "rounded-control hover:bg-muted data-[state=on]:bg-muted",
        /** Category chip: dim until on, then lit neon — like a cabinet's select light. */
        chip: "rounded-full border-2 border-hairline bg-card text-ink-soft data-[state=on]:border-neon data-[state=on]:bg-neon-soft data-[state=on]:text-neon",
        /** Bordered tile that turns coin when picked — round length, team count. */
        tile: "rounded-control border-2 border-hairline bg-card data-[state=on]:border-primary data-[state=on]:bg-coin-soft data-[state=on]:text-coin-ink",
        /** Segment on the sand track — the picked one lifts to the card. */
        segment: "rounded-control data-[state=on]:bg-card",
      },
      size: {
        default: "h-9.5 px-3.5 text-13",
        sm: "h-9 px-3 text-13",
        lg: "h-10.5 px-3.5 text-13",
        /** The two-line day tile. */
        tall: "h-17.5 flex-col gap-0.5 px-1 text-12",
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
