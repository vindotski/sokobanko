<script setup lang="ts">
import type { DropdownMenuRadioItemEmits, DropdownMenuRadioItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "cn"
import {
  DropdownMenuRadioItem,
  useForwardPropsEmits,
} from "reka-ui"

const props = defineProps<DropdownMenuRadioItemProps & { class?: HTMLAttributes["class"] }>()

const emits = defineEmits<DropdownMenuRadioItemEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuRadioItem
    data-slot="dropdown-menu-radio-item"
    v-bind="forwarded"
    :class="cn(
      `menu-item [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5`,
      props.class,
    )"
  >
    <!-- Spotstrap's menu-item draws the check when data-state="checked". -->
    <slot />
  </DropdownMenuRadioItem>
</template>
