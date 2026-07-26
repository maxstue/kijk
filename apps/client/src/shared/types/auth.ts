export const Allowed_Providers = ['GitHub'] as const;

export type AllowedProviders = (typeof Allowed_Providers)[number];

export function getSignInProviderName(externalProviders: readonly string[]) {
  return (
    Allowed_Providers.find((allowedProvider) =>
      externalProviders.some((provider) => provider.toLowerCase() === allowedProvider.toLowerCase()),
    ) ?? 'Email'
  );
}
