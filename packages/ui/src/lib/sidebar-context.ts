import * as React from 'react';

export type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

// Keep the context outside the component module so hot updates preserve its identity.
export const SidebarContext = React.createContext<SidebarContextProps | null>(null);

/** Returns the sidebar state and toggles; use inside a `SidebarProvider`. */
export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}
