import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy')({ component: PrivacyPolicy });

function PrivacyPolicy() {
  return (
    <main className='mx-auto max-w-3xl space-y-8 px-4 py-12'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-semibold'>Privacy Policy</h1>
        <p className='text-muted-foreground'>Last updated: 5 September 2026</p>
      </header>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Technical error reporting</h2>
        <p>
          Kijk processes technical error reports to detect and fix failures and keep the service secure and reliable.
          This is separate from optional analytics and route-performance tracing and remains active when consent is
          declined or withdrawn.
        </p>
        <p>
          Reports may contain an event time, app version, operating environment, error type, scrubbed technical stack
          locations, HTTP status and a short-lived request correlation ID. They do not intentionally contain account or
          authentication identifiers, names, email addresses, cookies, authorization headers, query values, submitted
          form data, request or response bodies, or household, resource and consumption values.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Purpose and legal basis</h2>
        <p>
          The legal basis is our legitimate interest under GDPR Article 6(1)(f) in operating a secure, stable service.
          We limit the data and disable behavioral breadcrumbs and profiling to reduce the impact on you. You may object
          by contacting the address shown in the app settings; we will assess your request as required by law.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Optional analytics and performance tracing</h2>
        <p>
          With your consent, Kijk enables product analytics and Sentry router tracing. Router tracing samples 10% of
          navigations and sends sanitized route templates and timing information. Concrete route parameters, query
          values, request tracing and user identifiers are excluded. You can withdraw consent in Settings at any time;
          no new performance traces are then sent.
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Processor, transfers and retention</h2>
        <p>
          We use Sentry as our error-reporting processor. Sentry and its relevant subprocessors may process data outside
          the European Economic Area subject to the contractual transfer safeguards described in Sentry&apos;s Data
          Processing Addendum. Technical error events are retained for no longer than 30 days and access is restricted
          to maintainers who diagnose production failures.
        </p>
        <p>
          You may request access, correction, deletion or restriction, object to processing, and lodge a complaint with
          your competent data-protection authority. Contact details and account deletion instructions are available in
          Settings → Info.
        </p>
      </section>
    </main>
  );
}
