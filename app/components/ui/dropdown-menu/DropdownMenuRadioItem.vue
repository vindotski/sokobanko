<script setup lang="ts">
import type { DropdownMenuRadioItemEmits, DropdownMenuRadioItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { Check } from "@lucide/vue"
import { reactiveOmit } from "@vueuse/core"
import { cn } from "cn"
import {
  DropdownMenuRadioItem,
  DropdownMenuItemIndicator,
  useForwardPropsEmits,
} from "reka-ui"
import { menuItemClass } from "."

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
      menuItemClass,
      props.class,
    )"
  >
    <slot />
    <DropdownMenuItemIndicator class="ml-auto flex items-center">
      <slot name="indicator-icon">
        <Check />
      </slot>
    </DropdownMenuItemIndicator>
  </DropdownMenuRadioItem>
</template>
