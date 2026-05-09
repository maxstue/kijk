import path from "node:path";

import type { BoundaryContext, BoundaryRuleOptionsResolved } from "./types.ts";

/**
 * Read the current filename from Oxlint's context shape.
 *
 * @param context Oxlint rule context.
 * @returns Current filename, or an empty string when unavailable.
 */
export function getFilename(context: BoundaryContext) {
  return context.filename ?? context.getFilename?.() ?? "";
}

/**
 * Convert an absolute file path to a path relative to the configured source root.
 *
 * @param filename Absolute or workspace-relative filename.
 * @param root Source root, for example `src`.
 * @returns Path relative to the source root.
 */
export function getRelativePath(filename: string, root: string) {
  const normalizedFilename = normalizePath(filename);
  const normalizedRoot = trimSlashes(normalizePath(root));
  const rootSegment = `/${normalizedRoot}/`;
  const rootIndex = normalizedFilename.lastIndexOf(rootSegment);

  if (rootIndex >= 0) {
    return normalizedFilename.slice(rootIndex + rootSegment.length);
  }

  return normalizePath(path.relative(path.resolve(root), filename));
}

/**
 * Check whether a path is inside any of the configured top-level segments.
 *
 * @param filePath Source-root-relative file path.
 * @param segments Top-level directory names to match.
 * @returns `true` when the path starts with one of the segments.
 */
export function startsWithAnySegment(filePath: string, segments: string[]) {
  return segments.some((segment) => filePath === segment || filePath.startsWith(`${segment}/`));
}

/**
 * Extract the owning feature name from a source-relative file path.
 *
 * @param filePath Source-root-relative file path.
 * @param featuresDir Directory containing feature folders.
 * @returns Feature name, or `undefined` when the file is outside the features directory.
 */
export function getFeatureFromFilePath(filePath: string, featuresDir: string) {
  const featurePrefix = `${trimSlashes(featuresDir)}/`;
  if (!filePath.startsWith(featurePrefix)) {
    return undefined;
  }

  return filePath.slice(featurePrefix.length).split("/")[0];
}

/**
 * Extract the imported feature name from an alias import path.
 *
 * @param importPath Static import path from an import/export declaration.
 * @param options Resolved boundary rule options.
 * @returns Imported feature name, or `undefined` when the import does not target a feature.
 */
export function getImportedFeature(importPath: string, options: BoundaryRuleOptionsResolved) {
  const featurePrefix = `${options.alias}/${trimSlashes(options.featuresDir)}/`;
  if (!importPath.startsWith(featurePrefix)) {
    return undefined;
  }

  return importPath.slice(featurePrefix.length).split("/")[0];
}

function normalizePath(value: string) {
  return value.split(path.sep).join("/");
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}
