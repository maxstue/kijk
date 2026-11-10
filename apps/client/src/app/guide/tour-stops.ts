import { getAvailableGuideTopics } from './constants';
import type { GuideDestination, GuideTopic, TourCapabilities } from './types';

export interface TourStop {
  topic: GuideTopic;
  selector: string;
  destination: GuideDestination;
  title: string;
  description: string;
}

/** Each navigation entry introduces the actual destination; the following stop explains its page. */
export function getTourStops(
  options: TourCapabilities,
  kind: 'tour' | GuideTopic,
  visible: (selector: string) => boolean,
): TourStop[] {
  const stops: TourStop[] = [];
  const addPage = (
    topic: GuideTopic,
    destination: GuideDestination,
    title: string,
    navigationDescription: string,
    description: string,
  ) => {
    const navigation = `[data-guide="nav-${destination}"]`;
    if (stops.length > 0 && visible(navigation)) {
      stops.push({
        topic,
        selector: navigation,
        destination: stops.at(-1)!.destination,
        title: `Open ${title}`,
        description: navigationDescription,
      });
    }
    stops.push({ topic, selector: `[data-guide="${destination}"]`, destination, title, description });
  };
  for (const { id: topic } of getAvailableGuideTopics(options)) {
    switch (topic) {
      case 'dashboard':
        stops.push({
          topic: 'dashboard',
          selector: '[data-guide="dashboard"]',
          destination: 'dashboard',
          title: 'Your dashboard',
          description:
            'This is your space overview. Choose a month, year and resource to explore readings and consumption. The lower sections compare usage with limits and, when enabled, summarize your finances.',
        });
        break;
      case 'consumptions':
        addPage(
          topic,
          'consumptions',
          'Consumptions',
          'This navigation entry opens your recorded values. Select Next to explore the page.',
          'Switch between Monthly and Annual to explore your history. Use the period controls to see older entries. An empty month does not mean your older readings are gone.',
        );
        if (options.canRecord) {
          stops.push({
            topic,
            selector: '[data-guide="consumption-create"]',
            destination: 'consumptions',
            title: 'Record a reading or consumption',
            description:
              'Add consumption opens the entry form. A meter reading is cumulative: the first establishes a baseline, later readings determine usage. A consumption value records an amount used directly. The tour does not open or submit the form.',
          });
        }
        break;
      case 'resources':
        addPage(
          topic,
          'resources',
          'Resources',
          'Resources defines what you track, such as electricity or water. Select Next to open the list.',
          'Each resource has its own unit, color and icon. Open one to review its configuration. Configure a resource before recording its first value; editing depends on your role.',
        );
        break;
      case 'limits':
        addPage(
          topic,
          'limits',
          'Limits',
          'Limits helps you compare usage with a threshold. Select Next to see the limits in this space.',
          'Limits compare a resource’s consumption with a threshold over a chosen period. Switch between list and cards to review them. Creating a limit is optional and depends on your role.',
        );
        break;
      case 'finances':
        addPage(
          topic,
          'accounts',
          'Accounts',
          'Accounts is where bank, cash and other financial accounts are managed. Select Next to open them.',
          'Accounts group your transactions. An account can be shared with the space or private to its owner; its transactions and imports inherit that visibility. Review the account and currency before recording or importing transactions.',
        );
        addPage(
          topic,
          'transactions',
          'Transactions',
          'Transactions lists income and expenses for the chosen period. Select Next to explore them.',
          'Choose a month and filter by category or uncategorized entries. Each transaction belongs to an account and uses its visibility. Add transaction records an individual entry; the More actions menu also links to CSV imports and export.',
        );
        addPage(
          topic,
          'categories',
          'Categories',
          'Categories organize income and expenses and provide rules for automatic categorization.',
          'Use Categories to organize entries, and Categorization rules to match recurring transaction details automatically. These categories also connect expenses to budgets. Changes depend on your space permissions.',
        );
        addPage(
          topic,
          'budgets',
          'Budgets',
          'Budgets compares monthly spending with planned amounts. Select Next to see the budget views.',
          'Choose a month, then switch between Budgets and Category spending. Set budget assigns a monthly amount to an expense category. Shared and private budgets follow their own visibility, so comparisons only include the data you may see.',
        );
        if (options.canImportFinances) {
          addPage(
            topic,
            'imports',
            'Imports',
            'Imports takes you from a bank CSV export to reviewed transactions.',
            'New import starts the upload and mapping flow. Review the preview, account and categories before confirming. Household settings configures import behavior. This tour does not upload files or confirm any transactions.',
          );
        }
        break;
      case 'navigation': {
        const last = stops.at(-1)!;
        stops.push({
          topic: 'navigation',
          selector: visible('[data-guide="account"]') ? '[data-guide="account"]' : '[data-sidebar="trigger"]',
          destination: last.destination,
          title: 'Switch spaces and open settings',
          description:
            'Open the menu at the top left, showing the current space name. Select another space under Spaces to switch its data and your permissions. Choose Settings for your profile, appearance and space administration. Getting started reopens this checklist. On mobile, open the sidebar first.',
        });
        break;
      }
    }
  }
  if (kind === 'tour') {
    return stops;
  }
  const selected = stops.filter((stop) => stop.topic === kind);
  // A focused tour starts directly on its page, rather than introducing its sidebar link from another section.
  return selected.filter((stop, index) => index !== 0 || !stop.selector.startsWith('[data-guide="nav-'));
}
