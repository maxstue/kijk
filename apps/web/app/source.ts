import { map } from "@/.map";
import { createMDXSource, defaultSchemas } from "fumadocs-mdx";
import { InferMetaType, InferPageType, loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { create } from "@/components/ui/icon";
import { z } from "zod";

export const sourceUtils = loader({
  rootDir: "docs",
  baseUrl: "/docs",
  icon(icon) {
    if (icon && icon in icons)
      return create({ icon: icons[icon as keyof typeof icons] });
  },
  source: createMDXSource(map,{
    schema: {
      frontmatter: defaultSchemas.frontmatter.extend({
        preview: z.string().optional(),
        index: z.boolean().default(false),
      }),
    },
  }),
});


export type Page = InferPageType<typeof sourceUtils>;
export type Meta = InferMetaType<typeof sourceUtils>;
