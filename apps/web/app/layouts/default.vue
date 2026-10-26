<!--
  Content pages (levels, profile, FAQ): a narrow centred column. The content
  is at least one screen tall, so the footer always sits a scroll away.
-->
<template>
  <div>
    <SiteHeader />
    <!-- 3.5rem is the header's height (h-14). -->
    <main class="flex min-h-[calc(100svh-3.5rem)] flex-col">
      <div class="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
        <slot />
      </div>
    </main>
    <SiteFooter />
  </div>
</template>
