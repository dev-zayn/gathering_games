import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/** A key with weight: a polished face over a dark lip that the press sinks into. */
const KEY =
  "shadow-key active:not-aria-[haspopup]:translate-y-0.5 active:not-aria-[haspopup]:shadow-key-pressed"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-button border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
  {
    variants: {
      variant: {
        /** The hand's reach — a brass key with walnut type («ذبّ الزار», «تمّ»). */
        default: cn(
          KEY,
          "brass-face font-bold text-brass-ink disabled:bg-none disabled:bg-slab-raised disabled:text-ink-faint disabled:opacity-100 disabled:shadow-none"
        ),
        /** The second key — turquoise («العب ويّا الحجّي», «أقبل»). */
        teal: cn(KEY, "turquoise-face font-bold text-secondary-foreground"),
        /** A loss taken on purpose — brick («أسلّم»). */
        brick: cn(KEY, "bg-brick font-bold text-white hover:bg-brick-lit"),
        /** A quiet key on a slab: pearl hairline, walnut face. */
        outline: "border-hairline-strong bg-slab-raised text-ink hover:bg-walnut-deep active:translate-y-px",
        ghost: "text-ink hover:bg-slab-raised aria-expanded:bg-slab-raised",
        link: "h-auto rounded-none px-0 text-turquoise-lit underline-offset-4 hover:underline",
      },
      size: {
        /** 44px — the smallest comfortable tap target. */
        default: "h-11 gap-2 px-4 text-14",
        sm: "h-10 gap-1.5 px-3 text-13 [&_svg:not([class*='size-'])]:size-4",
        /** 52px — a turn's keys. */
        lg: "h-13 gap-2 px-5 text-16",
        /** 60px — the one big key of a screen. */
        xl: "h-15 gap-2.5 px-6 text-17 [&_svg:not([class*='size-'])]:size-5.5",
        icon: "size-11",
        "icon-lg": "size-13 [&_svg:not([class*='size-'])]:size-5.5",
        /** An inline text action inside a row. */
        inline: "h-auto gap-1 p-0 text-13",
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
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
