import type { BoundaryContext, BoundaryRuleOptions, BoundaryRuleOptionsResolved } from "./types.ts";

/**
 * Default folder layout for Kijk client feature boundaries.
 *
 * @see {@link BoundaryRuleOptions}
 */
export const defaultOptions = {
  alias: "@",
  compositionDirs: ["routes"],
  featuresDir: "app",
  root: "src",
  sharedDirs: ["shared"],
} satisfies BoundaryRuleOptionsResolved;

/**
 * Resolve configured rule options with package defaults.
 *
 * @param context Oxlint rule context containing configured rule options.
 * @returns Complete boundary options with defaults applied.
 */
export function getOptions(context: BoundaryContext): BoundaryRuleOptionsResolved {
  return {
    ...defaultOptions,
    ...context.options?.[0],
  };
}

/** JSON schema for the `no-cross-feature-imports` rule options. */
export const ruleOptionsSchema = [
  {
    additionalProperties: false,
    properties: {
      alias: { type: "string" },
      compositionDirs: {
        items: { type: "string" },
        type: "array",
      },
      featuresDir: { type: "string" },
      root: { type: "string" },
      sharedDirs: {
        items: { type: "string" },
        type: "array",
      },
    },
    type: "object",
  },
] satisfies Array<{
  additionalProperties: boolean;
  properties: Record<keyof BoundaryRuleOptions, unknown>;
  type: "object";
}>;
