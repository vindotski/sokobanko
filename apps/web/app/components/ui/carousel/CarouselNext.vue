<script setup lang="ts">
import type { WithClassAsProps } from "./interface"
import type { ButtonVariants } from "@/components/ui/button"
import { ArrowRight } from "@lucide/vue"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { useCarousel } from "./useCarousel"

const props = withDefaults(defineProps<{
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
}
& WithClassAsProps>(), {
  variant: "outline",
  size: "icon-sm",
})

const { orientation, canScrollNext, scrollNext } = useCarousel()
</script>

<template>
  <Button
    data-slot="carousel-next"
    :disabled="!canScrollNext"
    :class="cn(
      orientation === 'vertical' && 'rotate-90',
      props.class,
    )"
    :variant="variant"
    :size="size"
    @click="scrollNext"
  >
    <slot>
      <ArrowRight />
      <span class="sr-only">Next</span>
    </slot>
  </Button>
</template>
