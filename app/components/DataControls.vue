<script setup lang="ts">
import { DownloadIcon, Trash2Icon } from "@lucide/vue";

/**
 * Progress → Your data: download everything about you, or delete it (the
 * GDPR's rights of access, portability and erasure). Deleting asks first.
 * The work is the page's (useYourData); this only asks.
 */
defineProps<{ busy?: "download" | "delete" }>();
const emit = defineEmits<{ download: []; delete: [] }>();
const confirming = ref(false);
const titleId = useId();

function confirm() {
  confirming.value = false;
  emit("delete");
}
</script>

<template>
  <section :aria-labelledby="titleId" class="flex flex-col gap-3 border p-4">
    <div class="flex flex-col gap-1">
      <h2 :id="titleId" class="text-lead font-semibold">Your data</h2>
      <p class="text-small text-muted-foreground">
        A file of everything Sokobanko keeps about you, here and on the server,
        or all of it gone.
        <NuxtLink to="/privacy" class="underline underline-offset-4">
          What's kept, and why</NuxtLink
        >.
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button
        variant="outline"
        :disabled="!!busy"
        @click="emit('download')"
      >
        <DownloadIcon data-icon="inline-start" />
        {{ busy === "download" ? "Preparing…" : "Download my data" }}
      </Button>
      <Dialog v-model:open="confirming">
        <DialogTrigger as-child>
          <Button variant="outline" :disabled="!!busy">
            <Trash2Icon data-icon="inline-start" />
            {{ busy === "delete" ? "Deleting…" : "Delete my data" }}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your data?</DialogTitle>
            <DialogDescription>
              Your results are deleted from the server, you're signed out, and
              this browser forgets your progress. Every level locks again.
              This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <p class="text-center text-small text-muted-foreground sm:text-left">
            Your guest itself, a random id with no name or email, stays,
            signed out. To have it removed too, email the address in the
            privacy policy.
          </p>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button @click="confirm">Delete my data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </section>
</template>
