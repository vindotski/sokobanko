import type { Meta, StoryObj } from "@storybook-vue/nuxt";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";

const meta = {
  title: "UI/Carousel",
  component: Carousel,
  render: () => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
    },
    template: `
      <Carousel :opts="{ align: 'start' }" class="flex w-[36rem] flex-col gap-3" aria-label="Levels">
        <div class="flex justify-end gap-2"><CarouselPrevious /><CarouselNext /></div>
        <CarouselContent>
          <CarouselItem v-for="n in 6" :key="n" class="basis-1/3">
            <div class="flex aspect-square items-center justify-center border text-title">{{ n }}</div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>`,
  }),
} satisfies Meta<typeof Carousel>;

export default meta;
export const Row: StoryObj<typeof meta> = {};
