<script setup lang="ts">
import type { WithClassAsProps } from "./interface"
import type { ButtonVariants } from "@/components/ui/button"
import { ArrowLeft } from "@lucide/vue"
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

const { orientation, canScrollPrev, scrollPrev } = useCarousel()
</script>

<template>
  <Button
    data-slot="carousel-previous"
    :disabled="!canScrollPrev"
    :class="cn(
      orientation === 'vertical' && 'rotate-90',
      props.class,
    )"
    :variant="variant"
    :size="size"
    @click="scrollPrev"
  >
    <slot>
      <ArrowLeft />
      <span class="sr-only">Previous</span>
    </slot>
  </Button>
</template>
