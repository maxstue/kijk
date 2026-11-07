export function PrivacyTelemetry() {
  return (
    <>
      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Technical error reporting</h2>
        <p>
          Kijk processes technical error reports to detect and fix failures and keep the service secure and reliable.
          This is separate from optional analytics and route-performance tracing and remains active when consent is
          declined or withdrawn.
        </p>
        <p>
          Reports may contain an event time, app version, operating environment, error type, scrubbed technical stack
          locations and a short-lived request correlation ID. They do not intentionally contain account or
          authentication identifiers, names, email addresses, cookies, authorization headers, query values, submitted
          form data, request or response bodies, uploaded files, or space, resource, consumption, budget or transaction
          values.
        </p>
      </section>
      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Optional analytics and performance tracing</h2>
        <p>
          With your consent, Kijk enables product analytics with PostHog and router tracing, which Sentry and PostHog
          both receive. PostHog receives app usage events with a random identifier that PostHog stores in your browser;
          it is not linked to your Kijk account. Router tracing samples 10% of navigations and sends sanitized route
          templates and timing information. Concrete route parameters, query values, request tracing and user
          identifiers are excluded. You can withdraw consent in Settings at any time; no new analytics events or
          performance traces are then sent. Analytics initializes only after consent. We disable automatic click and
          text capture, session replay, heatmaps, surveys, automatic analytics exceptions and additional performance
          collection in the browser configuration.
        </p>
        <p>
          Independent of this consent, Sentry and PostHog receive minimal technical error reports with the error type,
          the code location and a short-lived request correlation ID, but without error messages, account identifiers or
          the values you enter. Our server also sends anonymous traces of a sample of requests (route template, status
          code and duration) to both tools; they contain no account, space or user identifiers.
        </p>
      </section>
      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Voluntary feedback</h2>
        <p>
          When you send feedback, our server forwards only your message and a fresh random submission identifier to
          PostHog in the European Union. We do not attach your account identity or link the message to your analytics
          identifier. This happens only when you submit the feedback form and is independent of optional analytics
          consent. Please do not include personal or financial details in your message. We process your message to
          respond to your request and improve Kijk based on our legitimate interest (Article 6(1)(f)).
        </p>
      </section>
      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Feature switches</h2>
        <p>
          Some parts of Kijk, such as the finance area and the AI import, can be switched on or off with feature
          switches, for example to make them available or to turn them off when they fail. These switches apply to
          everyone equally. Our server downloads their settings from PostHog and reads them on our own server. PostHog
          receives no data about you for this: no account ID, no pseudonym, no IP address of your device and no usage
          data. Your browser does not contact PostHog for this either; it receives the decision from our server.
        </p>
      </section>
    </>
  );
}
