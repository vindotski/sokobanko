import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { buttonVariants } from "../button"

export { default as Toggle } from "./Toggle.vue"

// A ghost button that stays on: reka's Toggle sets aria-pressed and
// data-state="on", shown as the accent fill with a border, whatever the variant.
export const toggleVariants = cva(
  [
    buttonVariants({ variant: "ghost", size: null }),
    "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:inset-ring data-[state=on]:inset-ring-border",
  ],
  {
    variants: {
      variant: {
        default: "",
        outline: "border-border bg-background",
      },
      size: {
        default: "h-control px-4",
        sm: "h-control-compact px-3 text-control",
        lg: "h-control px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ToggleVariants = VariantProps<typeof toggleVariants>
