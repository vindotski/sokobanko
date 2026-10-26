<!--
  Landing page: full width. The content is at least one screen tall, so the
  footer always sits a scroll away.
-->
<template>
  <div>
    <SiteHeader />
    <!-- 3.5rem is the header's height (h-14). -->
    <main class="flex min-h-[calc(100svh-3.5rem)] flex-col">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
