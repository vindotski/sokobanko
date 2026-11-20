<script setup lang="ts">
import type { AccordionTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { ChevronDown } from "@lucide/vue"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "cn"
import {
  AccordionHeader,
  AccordionTrigger,
} from "reka-ui"

const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      data-slot="accordion-trigger"
      v-bind="delegatedProps"
      :class="
        cn(
          'flex min-h-control flex-1 cursor-pointer items-center justify-between gap-3 py-2 text-left text-body font-medium hover:underline disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          props.class,
        )
      "
    >
      <slot />
      <slot name="icon">
        <ChevronDown
          class="pointer-events-none size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none"
        />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>
