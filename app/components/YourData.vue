<script setup lang="ts">
// Download everything kept about the user, or delete it after a confirmation. Talks to the user
// pool on the app's domain (@kodentuzo/spotkit/client); `exportApp` adds the app's own rows.
import { deleteMe, exportMe } from "@kodentuzo/spotkit/client";
import {
  createYourData,
  en,
  type Messages,
  type YourDataState,
} from "@kodentuzo/spotstrap/blocks";
import { computed, onBeforeUnmount, ref } from "vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const props = defineProps<{
  appName: string;
  /** The app's own rows about the user, from its server. */
  exportApp?: () => Promise<unknown>;
  messages?: Messages;
}>();
const emit = defineEmits<{ deleted: [] }>();

const t = computed(() => (props.messages ?? en).yourData);
const data = createYourData(
  { exportMe, deleteMe },
  { appName: props.appName, exportApp: props.exportApp },
);
const state = ref<YourDataState>(data.state);
const stop = data.subscribe((next) => {
  state.value = next;
  if (next.status === "deleted") emit("deleted");
});
onBeforeUnmount(stop);

const confirming = computed({
  get: () => state.value.status === "confirming",
  set: (open) => {
    // The dialog closes before its Delete button's click handler runs; cancel only if that
    // handler didn't start deleting.
    if (!open) queueMicrotask(() => data.cancel());
  },
});
const busy = computed(
  () => state.value.status === "exporting" || state.value.status === "deleting",
);

async function download() {
  const file = await data.exportData();
  if (!file) return;
  const url = URL.createObjectURL(
    new Blob([file.json], { type: "application/json" }),
  );
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: file.filename,
  });
  link.click();
  // Some browsers cancel a download whose URL goes at once.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t.title }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <p v-if="state.status === 'deleted'" role="status">{{ t.deleted }}</p>
      <p v-else-if="state.status === 'empty'" role="status">{{ t.nothing }}</p>
      <template v-else>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <CardDescription class="max-w-prose">{{ t.exportHelp }}</CardDescription>
          <Button variant="outline" :disabled="busy" @click="download">
            {{ state.status === 'exporting' ? t.exporting : t.exportLabel }}
          </Button>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <CardDescription class="max-w-prose">{{ t.deleteHelp }}</CardDescription>
          <Button variant="destructive" :disabled="busy" @click="data.askDelete()">
            {{ state.status === 'deleting' ? t.deleting : t.deleteLabel }}
          </Button>
        </div>
        <p v-if="state.status === 'failed'" role="alert" class="text-destructive">
          {{ state.action === 'export' ? t.failedExport : t.failedDelete }}
        </p>
      </template>
      <slot />
    </CardContent>
  </Card>

  <AlertDialog v-model:open="confirming">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t.confirmTitle }}</AlertDialogTitle>
        <AlertDialogDescription>{{ t.confirmBody }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t.cancel }}</AlertDialogCancel>
        <AlertDialogAction class="bg-destructive text-destructive-foreground" @click="data.confirmDelete()">
          {{ t.confirm }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
