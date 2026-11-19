import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

// Spotstrap's `btn` (@kodentuzo/spotstrap/tailwind.css): 44px tall, or 36px
// compact with a 44px hit area.
export const buttonVariants = cva(
  "btn shrink-0",
  {
    variants: {
      variant: {
        // Filled and outline buttons swap fill and text color on hover.
        default:
          "[--btn-border:var(--color-primary)] [--btn-bg-hover:var(--color-background)] [--btn-fg-hover:var(--color-foreground)]",
        destructive: "btn-destructive",
        outline:
          "btn-outline [--btn-bg-hover:var(--color-foreground)] [--btn-fg-hover:var(--color-background)]",
        secondary: "btn-secondary",
        ghost: "btn-ghost",
        link: "btn-link",
      },
      size: {
        "default": "",
        "xs": "btn-compact",
        "sm": "btn-compact",
        "lg": "",
        "icon": "btn-icon",
        "icon-xs": "btn-icon btn-compact",
        "icon-sm": "btn-icon btn-compact",
        "icon-lg": "btn-icon",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
