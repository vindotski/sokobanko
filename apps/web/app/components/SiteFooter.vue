<template>
  <footer
    class="flex items-center justify-center gap-3 px-4 py-4 text-sm text-muted-foreground sm:py-6"
  >
    <Avatar class="size-8">
      <!-- Greyscale, like the rest of the black and white design. -->
      <AvatarImage
        src="/vinski.jpg"
        alt="Vinski&amp;Friends"
        class="grayscale"
      />
      <AvatarFallback>VF</AvatarFallback>
    </Avatar>
    <p>
      Made by
      <a
        href="https://www.vin.ski"
        aria-label="Ivan Vinski"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-foreground underline-offset-4 hover:underline"
      >
        Vinski&amp;Friends
      </a>
      in Croatia
    </p>
  </footer>
</template>
