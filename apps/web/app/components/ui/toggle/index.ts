import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Toggle } from "./Toggle.vue"

// Spotstrap's `btn`: reka's Toggle sets aria-pressed and data-state="on",
// which `btn` shows as on (the accent fill).
export const toggleVariants = cva(
  "btn shrink-0",
  {
    variants: {
      variant: {
        default: "btn-ghost",
        outline: "btn-outline",
      },
      size: {
        default: "",
        sm: "btn-compact",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ToggleVariants = VariantProps<typeof toggleVariants>
