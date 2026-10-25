export const useProgressStore = defineStore("progress", () => {
  const completed = ref<string[]>([]);

  function isCompleted(id: string) {
    return completed.value.includes(id);
  }

  function markCompleted(id: string) {
    if (!isCompleted(id)) completed.value.push(id);
  }

  return { completed, isCompleted, markCompleted };
});
