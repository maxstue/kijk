/** User-facing configuration for feature boundary checks. */
export interface BoundaryRuleOptions {
  /** Import alias prefix used for source imports, for example `@`. */
  alias?: string;
  /** Directories that may compose feature modules, for example `routes`. */
  compositionDirs?: string[];
  /** Directory that contains feature folders. */
  featuresDir?: string;
  /** Source root used to calculate file locations. */
  root?: string;
  /** Directories that must stay feature-neutral. */
  sharedDirs?: string[];
}

/**
 * Boundary options with defaults applied.
 *
 * @see {@link BoundaryRuleOptions}
 */
export type BoundaryRuleOptionsResolved = Required<BoundaryRuleOptions>;

/** Minimal Oxlint rule context shape used by this plugin. */
export interface BoundaryContext {
  filename?: string;
  getFilename?: () => string;
  options?: BoundaryRuleOptions[];
  report: (descriptor: {
    data?: Record<string, string>;
    message?: string;
    messageId?: string;
    node: unknown;
  }) => void;
}

/** Minimal AST node shape for import/export declarations with a source. */
export interface ImportNode {
  source?: {
    value?: unknown;
  };
}
