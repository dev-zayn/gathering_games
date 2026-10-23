import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/** Arcade keys: a solid face on a hard pixel shadow that the press sinks into. */
const PIXEL_KEY =
  "border-2 border-screen shadow-pixel active:not-aria-[haspopup]:translate-x-0.5 active:not-aria-[haspopup]:translate-y-1 active:not-aria-[haspopup]:shadow-none"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-button border border-transparent bg-clip-padding font-display font-semibold whitespace-nowrap transition outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
  {
    variants: {
      variant: {
        /** The call to action — a coin-yellow arcade key with night type. */
        default: cn(
          PIXEL_KEY,
          "bg-primary font-bold text-primary-foreground hover:bg-coin-glow disabled:bg-sand disabled:text-ink-faint disabled:opacity-100 aria-disabled:bg-sand aria-disabled:text-ink-faint aria-disabled:opacity-100"
        ),
        /** The second player's key — neon cyan. */
        neon: cn(PIXEL_KEY, "bg-neon font-bold text-neon-foreground hover:bg-neon-deep"),
        /** Hot pink — the risky choice: «ابدأ من جديد», a vote. */
        plasma: cn(PIXEL_KEY, "bg-plasma font-bold text-white hover:bg-plasma-deep"),
        outline: "border-2 border-rule bg-card text-ink hover:bg-ghost",
        /** An action that grows a list — «أضف لاعب». */
        dashed:
          "border-2 border-dashed border-dash bg-transparent text-neon hover:bg-card/60",
        ghost: "text-ink hover:bg-muted aria-expanded:bg-muted",
        destructive: "bg-danger-soft text-danger-ink hover:bg-danger-soft/80",
        link: "h-auto rounded-none px-0 text-neon underline-offset-4 hover:text-neon-deep hover:underline",
      },
      size: {
        /** 44px — the smallest comfortable tap target. */
        default: "h-11 gap-2 px-4 text-14",
        sm: "h-10 gap-1.5 px-3 text-13 [&_svg:not([class*='size-'])]:size-4",
        md: "h-12 gap-2 px-4 text-14",
        /** 54px — the bottom-bar CTA. */
        lg: "h-13.5 gap-2 px-5 text-16",
        /** 64px — a game's one big key («اكشف», «التالي»). */
        xl: "h-16 gap-2.5 px-6 text-18 [&_svg:not([class*='size-'])]:size-6",
        icon: "size-11",
        "icon-lg": "size-11.5 [&_svg:not([class*='size-'])]:size-5.5",
        /** An inline text action inside a card row — «تعديل». */
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
