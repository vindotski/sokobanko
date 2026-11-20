import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

// 44px tall, or 36px compact; either way the hit area is at least 44 × 44
// (the ::after box, centered on the button).
export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap border border-transparent text-body font-medium touch-manipulation transition-[background-color,border-color,color,opacity,scale] duration-150 after:absolute after:top-1/2 after:left-1/2 after:size-full after:min-h-control after:min-w-control after:-translate-1/2 after:content-[''] active:scale-[0.97] active:opacity-85 motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.25em]",
  {
    variants: {
      variant: {
        // Filled and outline buttons swap fill and text color on hover.
        default:
          "border-primary bg-primary text-primary-foreground hover:bg-background hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-border bg-background text-foreground hover:bg-foreground hover:text-background",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        // The text color, not the primary: the underline marks it.
        link: "bg-transparent text-foreground underline",
      },
      size: {
        "default": "h-control px-4",
        "xs": "h-control-compact px-3 text-control",
        "sm": "h-control-compact px-3 text-control",
        "lg": "h-control px-4",
        "icon": "size-control",
        "icon-xs": "size-control-compact text-control",
        "icon-sm": "size-control-compact text-control",
        "icon-lg": "size-control",
      },
    },
    compoundVariants: [
      { variant: "link", class: "px-1" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
