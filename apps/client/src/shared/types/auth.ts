/** OAuth providers users can sign in with. */
export const Allowed_Providers = ['GitHub', 'Google'] as const;

/** An allowed OAuth provider. */
export type AllowedProviders = (typeof Allowed_Providers)[number];

/** Clerk OAuth strategy of each allowed provider. */
export const Auth_Provider_Strategies = {
  GitHub: 'oauth_github',
  Google: 'oauth_google',
} as const satisfies Record<AllowedProviders, `oauth_${string}`>;

/** Returns the allowed provider found in the user's external accounts, or "Email". */
export function getSignInProviderName(externalProviders: readonly string[]) {
  return (
    Allowed_Providers.find((allowedProvider) =>
      externalProviders.some((provider) => provider.toLowerCase() === allowedProvider.toLowerCase()),
    ) ?? 'Email'
  );
}
