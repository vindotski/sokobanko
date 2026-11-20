export { default as DropdownMenu } from "./DropdownMenu.vue"

// A row in a menu: 44px tall, so it is as easy to hit on a phone as a button.
export const menuItemClass =
  "relative flex w-full min-h-control cursor-pointer items-center gap-3 px-3 text-left text-body outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5"

export { default as DropdownMenuCheckboxItem } from "./DropdownMenuCheckboxItem.vue"
export { default as DropdownMenuContent } from "./DropdownMenuContent.vue"
export { default as DropdownMenuGroup } from "./DropdownMenuGroup.vue"
export { default as DropdownMenuItem } from "./DropdownMenuItem.vue"
export { default as DropdownMenuLabel } from "./DropdownMenuLabel.vue"
export { default as DropdownMenuRadioGroup } from "./DropdownMenuRadioGroup.vue"
export { default as DropdownMenuRadioItem } from "./DropdownMenuRadioItem.vue"
export { default as DropdownMenuSeparator } from "./DropdownMenuSeparator.vue"
export { default as DropdownMenuShortcut } from "./DropdownMenuShortcut.vue"
export { default as DropdownMenuSub } from "./DropdownMenuSub.vue"
export { default as DropdownMenuSubContent } from "./DropdownMenuSubContent.vue"
export { default as DropdownMenuSubTrigger } from "./DropdownMenuSubTrigger.vue"
export { default as DropdownMenuTrigger } from "./DropdownMenuTrigger.vue"
export { DropdownMenuPortal } from "reka-ui"
