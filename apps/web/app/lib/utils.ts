import { createCn } from "cn/config";

/**
 * shadcn's `cn`, taught our type scale (see main.css). Without this it reads
 * `text-label` or `text-title` as a text color and drops `text-foreground` or
 * `text-muted-foreground` beside it. nuxt.config.ts points every `import
 * { cn } from "cn"` here.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "label",
            "small",
            "body",
            "lead",
            "title",
            "section",
            "display",
          ],
        },
      ],
    },
  },
});
