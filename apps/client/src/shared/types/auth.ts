export const Allowed_Providers = ['Github'] as const;

export type AllowedProviders = (typeof Allowed_Providers)[number];
