const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
    // typedRoutes: true,
    // serverActions: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

const sentryWebPackConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  // Suppresses source map uploading logs during build
  silent: true,
  org: 'maxstue',
  project: 'kijk-web',
};

const sentryConfig = {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,
  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: '/monitoring',
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebPackConfig, sentryConfig);
