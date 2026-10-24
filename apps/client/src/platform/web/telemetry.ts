import type { AppRouter } from '@/router';
import { AnalyticsService } from '@/shared/lib/analytics-tracking';
import { ErrorService } from '@/shared/lib/error-tracking';
import { TracingService } from '@/shared/lib/tracing';

/** Browser-only initialization; server rendering never reads local consent or starts browser SDKs. */
export function initializeTelemetry(router: AppRouter) {
  ErrorService.init();
  AnalyticsService.init();
  TracingService.init(router);
}
