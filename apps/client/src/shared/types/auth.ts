export const Allowed_Providers = ['GitHub', 'Google'] as const;

export type AllowedProviders = (typeof Allowed_Providers)[number];

export const Auth_Provider_Strategies = {
  GitHub: 'oauth_github',
  Google: 'oauth_google',
} as const satisfies Record<AllowedProviders, `oauth_${string}`>;

export function getSignInProviderName(externalProviders: readonly string[]) {
  return (
    Allowed_Providers.find((allowedProvider) =>
      externalProviders.some((provider) => provider.toLowerCase() === allowedProvider.toLowerCase()),
    ) ?? 'Email'
  );
}
