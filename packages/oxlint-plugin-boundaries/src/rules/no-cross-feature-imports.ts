import { getOptions, ruleOptionsSchema } from '../options.ts';
import {
  getFeatureFromFilePath,
  getFilename,
  getImportedFeature,
  getRelativePath,
  startsWithAnySegment,
} from '../path-utils.ts';
import type { BoundaryContext, ImportNode } from '../types.ts';

function checkImportBoundary(context: BoundaryContext, node: ImportNode) {
  const importPath = node.source?.value;
  if (typeof importPath !== 'string') {
    return;
  }

  const options = getOptions(context);
  const importedFeature = getImportedFeature(importPath, options);
  if (!importedFeature) {
    return;
  }

  const filename = getFilename(context);
  const relativePath = getRelativePath(filename, options.root);

  if (startsWithAnySegment(relativePath, options.compositionDirs)) {
    return;
  }

  if (startsWithAnySegment(relativePath, options.sharedDirs)) {
    context.report({
      data: {
        featuresDir: options.featuresDir,
        sharedDirs: options.sharedDirs.join(', '),
      },
      messageId: 'sharedToFeature',
      node,
    });
    return;
  }

  const currentFeature = getFeatureFromFilePath(relativePath, options.featuresDir);
  if (currentFeature && currentFeature !== importedFeature) {
    context.report({
      data: {
        fromFeature: currentFeature,
        toFeature: importedFeature,
      },
      messageId: 'crossFeature',
      node,
    });
  }
}

/** Rule that blocks shared-to-feature and cross-feature alias imports. */
export const noCrossFeatureImports = {
  meta: {
    docs: {
      description: 'Enforce feature folder boundaries for alias imports.',
    },
    messages: {
      crossFeature:
        'Feature `{{fromFeature}}` must not import from feature`{{toFeature}}`. Move shared code to shared or compose in an allowed composition layer.',
      sharedToFeature: 'Shared function/etc.`{{sharedDirs}}` must not import from `{{featuresDir}}/*` feature folders.',
    },
    schema: ruleOptionsSchema,
    type: 'problem',
  },
  create(context: BoundaryContext) {
    return {
      ExportAllDeclaration: (node: ImportNode) => checkImportBoundary(context, node),
      ExportNamedDeclaration: (node: ImportNode) => checkImportBoundary(context, node),
      ImportDeclaration: (node: ImportNode) => checkImportBoundary(context, node),
    };
  },
};
