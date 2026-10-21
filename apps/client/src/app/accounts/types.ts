/** What the current member may do with the accounts of the active space. */
export interface AccountPermissions {
  /** Finances:configure, needed for shared accounts. */
  canConfigure: boolean;
  /** Finances:record, enough for private accounts. */
  canRecord: boolean;
  /** A personal space has only private data and offers no visibility choice. */
  isPersonalSpace: boolean;
}
